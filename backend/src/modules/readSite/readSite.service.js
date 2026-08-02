const { Document } = require('../documents/document.model');
const { Department } = require('../departments/department.model');
const { NotFoundError, ForbiddenError } = require('../../common/errors');

/**
 * Shared by both storefronts: the public Read Site (destination:'Read Site',
 * no auth) and the gated Drawing Register (destination:'Drawing Register',
 * requires authenticateDrawingRegister) — see readSite.routes.js and
 * drawingRegisterContent.routes.js, which both call these same functions
 * with a different `destination`.
 */
async function listPublishedDocuments({ department, type, search, skip = 0, limit = 20, destination = 'Read Site' }) {
  const filter = { status: 'Published', destination };
  if (department) filter.department = department;
  if (type) filter.type = type;
  if (search) {
    filter.$or = [{ title: new RegExp(search, 'i') }, { docId: new RegExp(search, 'i') }];
  }

  const [items, total] = await Promise.all([
    Document.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('department', 'name code')
      .populate('approver', 'name')
      .populate('currentVersion'),
    Document.countDocuments(filter),
  ]);
  return { items, total };
}

async function listDepartmentsWithCounts(destination = 'Read Site') {
  const departments = await Department.find().sort({ name: 1 });
  const counts = await Document.aggregate([
    { $match: { status: 'Published', destination } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const countByDept = new Map(counts.map((c) => [c._id.toString(), c.count]));
  return departments.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    code: d.code,
    publishedDocumentCount: countByDept.get(d._id.toString()) ?? 0,
  }));
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

module.exports = { listPublishedDocuments, listDepartmentsWithCounts, getPublicDocumentFile, getPublicStats };
