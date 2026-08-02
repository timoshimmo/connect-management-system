const asyncHandler = require('../../utils/asyncHandler');
const readSiteService = require('./readSite.service');
const { parsePagination, paginatedResponse } = require('../../common/pagination');
const { recordAudit } = require('../auditLogs/auditLog.service');

const listDocuments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await readSiteService.listPublishedDocuments({
    department: req.query.department,
    type: req.query.type,
    search: req.query.search,
    skip,
    limit,
    destination: 'Read Site',
  });
  res.json(paginatedResponse(items, total, page, limit));
});

const listDepartments = asyncHandler(async (req, res) => {
  const items = await readSiteService.listDepartmentsWithCounts('Read Site');
  res.json({ items });
});

const documentFile = asyncHandler(async (req, res) => {
  const version = await readSiteService.getPublicDocumentFile(req.params.id, 'Read Site');
  // Read Site downloads/previews are public (no auth), so there's no req.user
  // to attribute the audit entry to; the document id is enough to trace it.
  await recordAudit({ user: null, action: 'preview', targetType: 'document', targetId: req.params.id, metadata: { public: true } });
  res.json({ url: version.file.url, format: version.file.format });
});

const stats = asyncHandler(async (req, res) => {
  const data = await readSiteService.getPublicStats();
  res.json(data);
});

module.exports = { listDocuments, listDepartments, documentFile, stats };
