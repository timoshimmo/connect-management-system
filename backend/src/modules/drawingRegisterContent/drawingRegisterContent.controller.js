const asyncHandler = require('../../utils/asyncHandler');
const readSiteService = require('../readSite/readSite.service');
const contactMessageService = require('../contactMessages/contactMessage.service');
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

const contact = asyncHandler(async (req, res) => {
  const message = await contactMessageService.createMessage({
    ...req.body,
    source: 'drawing-register',
    drawingRegisterUserId: req.drawingRegisterUser.id,
  });
  res.status(201).json({ id: message._id.toString() });
});

module.exports = { listDocuments, listDepartments, documentFile, contact };
