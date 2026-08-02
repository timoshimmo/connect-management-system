const { Document } = require('./document.model');
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
 * document already has.
 */
async function nextDocId(departmentId) {
  const department = await Department.findById(departmentId);
  if (!department) throw new NotFoundError('Department not found');
  const year = new Date().getFullYear();
  const prefix = `${department.code}-${year}-`;
  const latest = await Document.findOne({ docId: new RegExp(`^${prefix}`) }).sort({ docId: -1 });
  const lastSeq = latest ? Number(latest.docId.slice(prefix.length)) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(3, '0')}`;
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
    const docId = await nextDocId(department);
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
