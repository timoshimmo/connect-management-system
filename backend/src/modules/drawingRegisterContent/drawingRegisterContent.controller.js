const asyncHandler = require('../../utils/asyncHandler');
const readSiteService = require('../readSite/readSite.service');
const { parsePagination, paginatedResponse } = require('../../common/pagination');
const { recordAudit } = require('../auditLogs/auditLog.service');

const DESTINATION = 'Drawing Register';

const listDocuments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await readSiteService.listPublishedDocuments({
    department: req.query.department,
    type: req.query.type,
    search: req.query.search,
    skip,
    limit,
    destination: DESTINATION,
  });
  res.json(paginatedResponse(items, total, page, limit));
});

const listDepartments = asyncHandler(async (req, res) => {
  const items = await readSiteService.listDepartmentsWithCounts(DESTINATION);
  res.json({ items });
});

const documentFile = asyncHandler(async (req, res) => {
  const version = await readSiteService.getPublicDocumentFile(req.params.id, DESTINATION);
  await recordAudit({
    user: null,
    action: 'preview',
    targetType: 'document',
    targetId: req.params.id,
    metadata: { drawingRegisterUserId: req.drawingRegisterUser.id },
  });
  res.json({ url: version.file.url, format: version.file.format });
});

module.exports = { listDocuments, listDepartments, documentFile };
