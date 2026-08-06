const { Document, DOCUMENT_TYPE_PREFIXES, POLICY_RESERVED_SEQUENCE } = require('./document.model');
const { DocumentVersion } = require('./documentVersion.model');
const { Department } = require('../departments/department.model');
const { NotFoundError, BadRequestError, ConflictError } = require('../../common/errors');
const { uploadBufferToR2, resolveExtension } = require('../../middlewares/upload');
const { recordAudit } = require('../auditLogs/auditLog.service');
const { notifyUser, notifyRole } = require('../notifications/notification.service');
const { User } = require('../users/user.model');

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Generates the next Doc ID from the highest existing sequence number for
 * this department+year, not a count — a count collides as soon as any
 * document in the sequence is deleted (e.g. the rollback in createDocument
 * below), since a later "count + 1" can land back on an id a still-existing
 * document already has. Used for Drawing Register documents only (they have
 * no `type` to number by) — see nextDocIdForType for Read Site documents.
 */
async function nextDocIdByDepartment(departmentId) {
  const department = await Department.findById(departmentId);
  if (!department) throw new NotFoundError('Department not found');
  const year = new Date().getFullYear();
  const prefix = `${department.code}-${year}-`;
  const latest = await Document.findOne({ docId: new RegExp(`^${prefix}`) }).sort({ docId: -1 });
  const lastSeq = latest ? Number(latest.docId.slice(prefix.length)) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(3, '0')}`;
}

/**
 * Company numbering convention: `<SMS-XX>-<NNN>` per document type,
 * independent of department/year (e.g. "SMS-PR-015", "SMS-PO-0004").
 * Policy uses 4-digit numbers and reserves 0001–0003 for documents created
 * manually outside the app — automatic numbering starts at 0004. Every
 * other type uses 3-digit numbers starting at 001. The lookup is scoped to
 * docIds matching this exact type's prefix, so it's unaffected by (and
 * never collides with) any legacy department/year-formatted docIds already
 * in the database.
 */
async function nextDocIdForType(type) {
  const prefix = DOCUMENT_TYPE_PREFIXES[type];
  if (!prefix) throw new BadRequestError(`No numbering convention configured for document type "${type}"`);

  const isPolicy = type === 'Policy';
  const digits = isPolicy ? 4 : 3;
  const baseline = isPolicy ? POLICY_RESERVED_SEQUENCE : 0;

  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const latest = await Document.findOne({ docId: pattern }).sort({ docId: -1 });
  let nextSeq = baseline + 1;
  if (latest) {
    const match = latest.docId.match(pattern);
    const seq = match ? Number(match[1]) : NaN;
    if (!Number.isNaN(seq) && seq >= nextSeq) nextSeq = seq + 1;
  }
  return `${prefix}-${String(nextSeq).padStart(digits, '0')}`;
}

/** Dispatches to the type-based scheme for Read Site documents, the department-based scheme for Drawing Register ones. */
async function nextDocId({ destination, department, type }) {
  if (destination === 'Read Site' && type) {
    return nextDocIdForType(type);
  }
  return nextDocIdByDepartment(department);
}

function expectStatus(doc, expected) {
  if (doc.status !== expected) {
    throw new ConflictError(`Expected status "${expected}" but document is "${doc.status}"`);
  }
}

/**
 * Notifies everyone currently involved in a document — author, reviewer,
 * approver — plus every Controller, excluding whoever triggered the action.
 * Each recipient is notified at most once even if they hold more than one
 * of those roles.
 */
async function notifyParticipants(doc, actorId, { type, message }) {
  const controllers = await User.find({ role: 'controller', status: { $ne: 'Inactive' } }, '_id');
  const candidates = [doc.author, doc.reviewer, doc.approver, ...controllers.map((c) => c._id)];
  const seen = new Set([String(actorId ?? '')]);
  for (const userId of candidates) {
    if (!userId) continue;
    const id = userId.toString();
    if (seen.has(id)) continue;
    seen.add(id);
    await notifyUser(id, { type, message, relatedDocument: doc._id });
  }
}

async function listDocuments({ department, type, status, search, skip = 0, limit = 20 }) {
  const filter = {};
  if (department) filter.department = department;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { docId: new RegExp(search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('department', 'name code')
      .populate('discipline', 'name')
      .populate('author reviewer approver archivedBy', 'name email role')
      .populate('currentVersion'),
    Document.countDocuments(filter),
  ]);
  return { items, total };
}

async function getDocumentById(id) {
  const doc = await Document.findById(id)
    .populate('department', 'name code')
    .populate('discipline', 'name')
    .populate('author reviewer approver archivedBy', 'name email role')
    .populate('currentVersion');
  if (!doc) throw new NotFoundError('Document not found');
  return doc;
}

async function createDocument({
  title,
  department,
  type,
  description,
  location,
  destination,
  drawingNumber,
  discipline,
  area,
  revision,
  authorId,
  file,
}) {
  // Retries a couple of times on a docId collision (e.g. a concurrent create
  // landing on the same next-sequence number) rather than failing the whole
  // request outright.
  let doc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const docId = await nextDocId({ destination, department, type });
    try {
      doc = await Document.create({
        docId,
        title,
        department,
        type: type || null,
        description: description || '',
        location: location || 'Onshore',
        destination,
        drawingNumber: drawingNumber || '',
        discipline: discipline || null,
        area: area || '',
        revision: revision || '',
        author: authorId,
        status: 'Draft',
      });
      break;
    } catch (err) {
      if (err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }

  if (file) {
    try {
      await addVersion(doc._id, { file, changeNote: 'Initial upload', uploadedBy: authorId });
    } catch (err) {
      // The upload failed (e.g. R2 unreachable/misconfigured) — don't
      // leave an empty, file-less draft behind. Roll back the document so
      // the author can simply retry instead of finding a broken duplicate.
      await Document.deleteOne({ _id: doc._id });
      throw err;
    }
  }

  return getDocumentById(doc._id);
}

async function addVersion(id, { file, changeNote, uploadedBy }) {
  const doc = await Document.findById(id).populate('department', 'code');
  if (!doc) throw new NotFoundError('Document not found');

  const versionCount = await DocumentVersion.countDocuments({ document: doc._id });
  const versionNumber = `${versionCount + 1}.0`;
  const format = resolveExtension(file);
  const key = `documents/${doc.department.code.toLowerCase()}/${doc.docId}-v${versionNumber}.${format}`;

  await uploadBufferToR2(file.buffer, { key, contentType: file.mimetype });

  const version = await DocumentVersion.create({
    document: doc._id,
    versionNumber,
    file: {
      key,
      originalFilename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      format,
    },
    uploadedBy,
    changeNote: changeNote || '',
  });

  doc.currentVersion = version._id;
  await doc.save();

  await recordAudit({
    user: uploadedBy,
    action: 'upload',
    targetType: 'document',
    targetId: doc._id,
    metadata: { versionNumber },
  });

  return version;
}

async function getVersions(id) {
  await getDocumentById(id);
  return DocumentVersion.find({ document: id }).sort({ uploadedAt: -1 }).populate('uploadedBy', 'name email');
}

/**
 * Updates a document's own fields (title/department/type/description/
 * location). Replacing the file is a separate concern — POST
 * /documents/:id/versions (addVersion, above) already handles that
 * correctly (new version, never overwrites), so this never touches
 * currentVersion. Only the author, and only while still a Draft — once
 * submitted, changes go through the review workflow instead.
 */
async function updateDocument(id, userId, userRole, updates) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.author.toString() !== userId && userRole !== 'controller') {
    throw new BadRequestError('Only the author or a Document Controller can edit this document');
  }
  expectStatus(doc, 'Draft');

  if (updates.department) {
    const department = await Department.findById(updates.department);
    if (!department) throw new NotFoundError('Department not found');
  }

  Object.assign(doc, updates);
  await doc.save();
  await recordAudit({ user: userId, action: 'edit', targetType: 'document', targetId: doc._id });
  return getDocumentById(doc._id);
}

async function submitForReview(id, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.author.toString() !== userId) throw new BadRequestError('Only the author can submit this document');
  expectStatus(doc, 'Draft');
  doc.status = 'Pending Assignment';
  doc.returned = false;
  await doc.save();
  await recordAudit({ user: userId, action: 'edit', targetType: 'document', targetId: doc._id, metadata: { submitted: true } });
  await notifyUser(doc.author, {
    type: 'document_submitted',
    message: `Your document "${doc.title}" (${doc.docId}) was submitted successfully and is awaiting assignment.`,
    relatedDocument: doc._id,
  });
  await notifyRole('controller', {
    type: 'document_submitted',
    message: `"${doc.title}" (${doc.docId}) was submitted and needs a reviewer and approver assigned.`,
    relatedDocument: doc._id,
  });
  return doc;
}

async function assignReviewerApprover(id, { reviewer, approver }, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  expectStatus(doc, 'Pending Assignment');
  doc.reviewer = reviewer;
  doc.approver = approver;
  doc.status = 'Under Review';
  await doc.save();
  await recordAudit({ user: userId, action: 'edit', targetType: 'document', targetId: doc._id, metadata: { assigned: true, reviewer, approver } });
  await notifyUser(doc.reviewer, {
    type: 'review_assigned',
    message: `You have been assigned to review "${doc.title}" (${doc.docId}).`,
    relatedDocument: doc._id,
  });
  return doc;
}

const REASSIGNABLE_STATUSES = ['Under Review', 'Pending Approval', 'Pending Publishing'];

/**
 * Controller-only: changes the reviewer and/or approver on a document that
 * has already been assigned once — unlike assignReviewerApprover (which
 * only ever runs once, from "Pending Assignment", and always moves the
 * document to "Under Review"), this can run any number of times while the
 * document is Under Review / Pending Approval / Pending Publishing, or back
 * with the author for changes (Draft + returned). "Pending Assignment"
 * itself isn't eligible here — that initial assignment is exactly what
 * assignReviewerApprover already handles.
 *
 * Reassigning restarts the relevant workflow stage, since whoever's newly
 * assigned hasn't done that step yet: reassigning the reviewer sends the
 * document back to "Under Review" even if it had already moved past that
 * point (Pending Approval / Pending Publishing), and reassigning just the
 * approver (reviewer unchanged) only needs to go back to "Pending Approval"
 * — the existing reviewer's review still stands. A document still sitting
 * with the author (Draft + returned) isn't pulled into either stage early;
 * only its reviewer/approver fields change, keeping it with the author
 * until they resubmit.
 */
async function reassignReviewerApprover(id, { reviewer, approver, reason }, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');

  const eligible = REASSIGNABLE_STATUSES.includes(doc.status) || (doc.status === 'Draft' && doc.returned);
  if (!eligible) {
    throw new ConflictError('This document cannot be reassigned in its current status.');
  }

  const previousStatus = doc.status;
  const previousReviewer = doc.reviewer ? doc.reviewer.toString() : null;
  const previousApprover = doc.approver ? doc.approver.toString() : null;
  const reviewerChanged = Boolean(reviewer) && reviewer !== previousReviewer;
  const approverChanged = Boolean(approver) && approver !== previousApprover;

  if (!reviewerChanged && !approverChanged) {
    throw new BadRequestError('Select a different reviewer and/or approver to reassign.');
  }

  if (reviewerChanged) doc.reviewer = reviewer;
  if (approverChanged) doc.approver = approver;

  if (doc.status !== 'Draft') {
    if (reviewerChanged) {
      doc.status = 'Under Review';
    } else if (approverChanged) {
      doc.status = 'Pending Approval';
    }
  }

  await doc.save();

  await recordAudit({
    user: userId,
    action: 'reassign',
    targetType: 'document',
    targetId: doc._id,
    metadata: {
      reason,
      previousStatus,
      newStatus: doc.status,
      previousReviewer,
      newReviewer: reviewerChanged ? reviewer : previousReviewer,
      previousApprover,
      newApprover: approverChanged ? approver : previousApprover,
    },
  });

  if (reviewerChanged) {
    if (previousReviewer) {
      await notifyUser(previousReviewer, {
        type: 'reviewer_unassigned',
        message: `You are no longer the reviewer for "${doc.title}" (${doc.docId}).`,
        relatedDocument: doc._id,
      });
    }
    await notifyUser(doc.reviewer, {
      type: 'review_assigned',
      message: `You have been assigned to review "${doc.title}" (${doc.docId}).`,
      relatedDocument: doc._id,
    });
  }

  if (approverChanged) {
    if (previousApprover) {
      await notifyUser(previousApprover, {
        type: 'approver_unassigned',
        message: `You are no longer the approver for "${doc.title}" (${doc.docId}).`,
        relatedDocument: doc._id,
      });
    }
    await notifyUser(doc.approver, {
      type: 'approval_pending',
      message: `You have been assigned to approve "${doc.title}" (${doc.docId}).`,
      relatedDocument: doc._id,
    });
  }

  const changedWhat = reviewerChanged && approverChanged ? 'reviewer and approver' : reviewerChanged ? 'reviewer' : 'approver';
  const restartNote = doc.status !== previousStatus ? ` It's back in "${doc.status}".` : '';
  await notifyUser(doc.author, {
    type: 'document_reassigned',
    message: `Your document "${doc.title}" (${doc.docId}) has been reassigned to a new ${changedWhat}.${restartNote}`,
    relatedDocument: doc._id,
  });

  return doc;
}

async function forwardToApproval(id, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.reviewer?.toString() !== userId) throw new BadRequestError('Only the assigned reviewer can forward this document');
  expectStatus(doc, 'Under Review');
  doc.status = 'Pending Approval';
  await doc.save();
  await recordAudit({ user: userId, action: 'review', targetType: 'document', targetId: doc._id });
  await notifyUser(doc.approver, {
    type: 'approval_pending',
    message: `"${doc.title}" (${doc.docId}) has been reviewed and is awaiting your approval.`,
    relatedDocument: doc._id,
  });
  return doc;
}

async function returnToAuthor(id, userId, notes) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.reviewer?.toString() !== userId) throw new BadRequestError('Only the assigned reviewer can return this document');
  expectStatus(doc, 'Under Review');
  doc.status = 'Draft';
  doc.returned = true;
  if (notes) doc.notes = notes;
  await doc.save();
  await recordAudit({ user: userId, action: 'review', targetType: 'document', targetId: doc._id, metadata: { returned: true } });
  await notifyUser(doc.author, {
    type: 'changes_requested',
    message: `Changes were requested on "${doc.title}" (${doc.docId}).${notes ? ` "${notes}"` : ''}`,
    relatedDocument: doc._id,
  });
  return doc;
}

async function approve(id, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.approver?.toString() !== userId) throw new BadRequestError('Only the assigned approver can approve this document');
  expectStatus(doc, 'Pending Approval');
  doc.status = 'Pending Publishing';
  await doc.save();
  await recordAudit({ user: userId, action: 'approve', targetType: 'document', targetId: doc._id });
  await notifyUser(doc.author, {
    type: 'document_approved',
    message: `"${doc.title}" (${doc.docId}) was approved and is awaiting publishing.`,
    relatedDocument: doc._id,
  });
  return doc;
}

async function reject(id, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.approver?.toString() !== userId) throw new BadRequestError('Only the assigned approver can reject this document');
  expectStatus(doc, 'Pending Approval');
  doc.status = 'Under Review';
  await doc.save();
  await recordAudit({ user: userId, action: 'reject', targetType: 'document', targetId: doc._id });
  await notifyUser(doc.reviewer, {
    type: 'document_rejected',
    message: `"${doc.title}" (${doc.docId}) was rejected by the approver and is back with you for review.`,
    relatedDocument: doc._id,
  });
  return doc;
}

async function publish(id, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  expectStatus(doc, 'Pending Publishing');
  doc.status = 'Published';
  doc.publishedAt = new Date();
  doc.nextReviewDate = new Date(Date.now() + ONE_YEAR_MS);
  await doc.save();
  await recordAudit({ user: userId, action: 'publish', targetType: 'document', targetId: doc._id });
  const destinationLabel = doc.destination === 'Drawing Register' ? 'the Drawing Register' : 'the Read Site';
  await notifyUser(doc.author, {
    type: 'document_published',
    message: `"${doc.title}" (${doc.docId}) has been published and is now live on ${destinationLabel}.`,
    relatedDocument: doc._id,
  });
  await notifyRole('controller', {
    type: 'document_published',
    message: `"${doc.title}" (${doc.docId}) has been published to ${destinationLabel}.`,
    relatedDocument: doc._id,
    excludeUserId: userId,
  });
  return doc;
}

async function rejectPublishing(id, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  expectStatus(doc, 'Pending Publishing');
  doc.status = 'Pending Approval';
  await doc.save();
  await recordAudit({ user: userId, action: 'reject', targetType: 'document', targetId: doc._id });
  await notifyUser(doc.approver, {
    type: 'document_rejected',
    message: `Publishing was declined for "${doc.title}" (${doc.docId}) — it's back with you for approval.`,
    relatedDocument: doc._id,
  });
  return doc;
}

/**
 * Archiving is a Controller-only action (enforced at the route) and only
 * applies to Published documents — archiving a draft or in-review document
 * doesn't make sense since it isn't visible on its destination yet. Archived
 * documents drop out of both storefronts automatically: readSite.service.js's
 * listPublishedDocuments only ever matches status:'Published'.
 */
async function archive(id, userId, reason) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  expectStatus(doc, 'Published');
  doc.status = 'Archived';
  doc.archivedBy = userId;
  doc.archivedAt = new Date();
  doc.archiveReason = reason || '';
  await doc.save();
  await recordAudit({ user: userId, action: 'archive', targetType: 'document', targetId: doc._id });
  const destinationLabel = doc.destination === 'Drawing Register' ? 'the Drawing Register' : 'the Read Site';
  await notifyParticipants(doc, userId, {
    type: 'document_archived',
    message: `"${doc.title}" (${doc.docId}) was archived and is no longer visible on ${destinationLabel}.`,
  });
  return getDocumentById(doc._id);
}

/** Restores an archived document back to Published — visible on its destination again. */
async function restore(id, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  expectStatus(doc, 'Archived');
  doc.status = 'Published';
  doc.archivedBy = null;
  doc.archivedAt = null;
  doc.archiveReason = '';
  await doc.save();
  await recordAudit({ user: userId, action: 'edit', targetType: 'document', targetId: doc._id, metadata: { restored: true } });
  const destinationLabel = doc.destination === 'Drawing Register' ? 'the Drawing Register' : 'the Read Site';
  await notifyParticipants(doc, userId, {
    type: 'document_restored',
    message: `"${doc.title}" (${doc.docId}) was restored and is visible on ${destinationLabel} again.`,
  });
  return getDocumentById(doc._id);
}

async function initiateRevision(id, userId) {
  const doc = await Document.findById(id);
  if (!doc) throw new NotFoundError('Document not found');
  expectStatus(doc, 'Published');
  doc.status = 'Draft';
  await doc.save();
  await recordAudit({ user: userId, action: 'edit', targetType: 'document', targetId: doc._id, metadata: { revision: true } });
  return doc;
}

async function recordDownload(id, userId) {
  const doc = await getDocumentById(id);
  if (!doc.currentVersion) throw new NotFoundError('No file has been uploaded for this document yet');
  await recordAudit({ user: userId, action: 'download', targetType: 'document', targetId: doc._id });
  return doc.currentVersion;
}

async function recordPreview(id, userId) {
  const doc = await getDocumentById(id);
  if (!doc.currentVersion) throw new NotFoundError('No file has been uploaded for this document yet');
  await recordAudit({ user: userId, action: 'preview', targetType: 'document', targetId: doc._id });
  return doc.currentVersion;
}

module.exports = {
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  addVersion,
  getVersions,
  submitForReview,
  assignReviewerApprover,
  reassignReviewerApprover,
  forwardToApproval,
  returnToAuthor,
  approve,
  reject,
  publish,
  rejectPublishing,
  archive,
  restore,
  initiateRevision,
  recordDownload,
  recordPreview,
};
