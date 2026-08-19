const { Document, DOCUMENT_TYPES, ISO_STANDARDS } = require('../documents/document.model');
const { Department } = require('../departments/department.model');
const { NotFoundError, ForbiddenError } = require('../../common/errors');

/**
 * Shared by all three storefronts: the public Read Site (destination:'Read
 * Site', no auth), the gated Drawing Register (destination:'Drawing
 * Register', requires authenticateDrawingRegister), and the public Document
 * Register (destination:'Document Register', no auth) — see
 * readSite.routes.js, drawingRegisterContent.routes.js, and
 * documentRegister.routes.js, which each call these same functions with a
 * different `destination`.
 */
async function listPublishedDocuments({
  department,
  type,
  search,
  isoStandard,
  skip = 0,
  limit = 20,
  destination = 'Read Site',
}) {
  const filter = { status: 'Published', destination };
  if (department) filter.department = department;
  if (type) filter.type = type;
  if (isoStandard) filter.isoStandards = isoStandard;
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { docId: new RegExp(search, 'i') },
      { documentRegisterReference: new RegExp(search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Document.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('department', 'name code')
      .populate('discipline', 'name')
      .populate('approver', 'name')
      .populate('currentVersion'),
    Document.countDocuments(filter),
  ]);
  return { items, total };
}

async function listDepartmentsWithCounts(destination = 'Read Site') {
  // Only Active departments — deactivating one removes it from browsing here,
  // matching Department Management's activate/deactivate semantics.
  const departments = await Department.find({ status: 'Active' }).sort({ name: 1 });
  const counts = await Document.aggregate([
    { $match: { status: 'Published', destination } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  // Defensive: a `null` `_id` bucket would appear if this were ever called
  // for a destination where department is optional (see
  // department.service.js's identical fix) — not currently reachable since
  // every call site passes 'Read Site'/'Drawing Register', but cheap to guard.
  const countByDept = new Map(counts.filter((c) => c._id).map((c) => [c._id.toString(), c.count]));
  return departments.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    code: d.code,
    publishedDocumentCount: countByDept.get(d._id.toString()) ?? 0,
  }));
}

/**
 * Live per-type published-document counts for a destination (e.g. the
 * Document Register's "Document Type" filter sidebar) — every one of the 9
 * types is always present, zero-filled, so the frontend never has to guess
 * at a missing type's count.
 */
async function listTypesWithCounts(destination) {
  const counts = await Document.aggregate([
    { $match: { status: 'Published', destination, type: { $ne: null } } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);
  const countByType = new Map(counts.map((c) => [c._id, c.count]));
  return DOCUMENT_TYPES.map((type) => ({ type, count: countByType.get(type) ?? 0 }));
}

/** Same live-count pattern as listTypesWithCounts, for the ISO Standard filter. */
async function listIsoStandardsWithCounts(destination) {
  const counts = await Document.aggregate([
    { $match: { status: 'Published', destination } },
    { $unwind: '$isoStandards' },
    { $group: { _id: '$isoStandards', count: { $sum: 1 } } },
  ]);
  const countByStandard = new Map(counts.map((c) => [c._id, c.count]));
  return ISO_STANDARDS.map((standard) => ({ standard, count: countByStandard.get(standard) ?? 0 }));
}

/** Single published document's public detail (e.g. Document Register's "View" page) — 404s for anything not Published on this destination, same visibility rule as the list/file functions above. */
async function getPublishedDocument(id, destination = 'Read Site') {
  const doc = await Document.findOne({ _id: id, status: 'Published', destination })
    .populate('department', 'name code')
    .populate('discipline', 'name')
    .populate('approver', 'name')
    .populate('currentVersion');
  if (!doc) throw new NotFoundError('Document not found');
  return doc;
}

async function getPublicDocumentFile(id, destination = 'Read Site') {
  const doc = await Document.findById(id).populate('currentVersion');
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.status !== 'Published') throw new ForbiddenError('This document has not been published');
  if (doc.destination !== destination) throw new ForbiddenError('This document is not available here');
  if (!doc.currentVersion) throw new NotFoundError('No file has been uploaded for this document yet');
  return doc.currentVersion;
}

/**
 * Org-wide aggregate counts for the public Dashboard hero (no per-document
 * detail, just totals) — safe to expose without authentication, unlike the
 * full document lists MS Publishing's own /dashboard/summary returns.
 */
async function getPublicStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalDocuments, pendingApproval, publishedThisMonth, dueForReview] = await Promise.all([
    Document.countDocuments({}),
    Document.countDocuments({ status: 'Pending Approval' }),
    Document.countDocuments({ status: 'Published', publishedAt: { $gte: startOfMonth } }),
    Document.countDocuments({ status: 'Published', nextReviewDate: { $lte: now } }),
  ]);

  return { totalDocuments, pendingApproval, publishedThisMonth, dueForReview };
}

module.exports = {
  listPublishedDocuments,
  listDepartmentsWithCounts,
  listTypesWithCounts,
  listIsoStandardsWithCounts,
  getPublishedDocument,
  getPublicDocumentFile,
  getPublicStats,
};
