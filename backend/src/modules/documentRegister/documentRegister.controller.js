const asyncHandler = require('../../utils/asyncHandler');
const readSiteService = require('../readSite/readSite.service');
const { parsePagination, paginatedResponse } = require('../../common/pagination');
const { recordAudit } = require('../auditLogs/auditLog.service');

/**
 * Public, unauthenticated storefront for controlled QHSE/Management System
 * documents — same shared readSite.service.js functions the Read Site and
 * Drawing Register storefronts already use, just scoped to this
 * destination. See document.model.js's DOCUMENT_DESTINATIONS comment.
 */
const DESTINATION = 'Document Register';

const listDocuments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await readSiteService.listPublishedDocuments({
    department: req.query.department,
    type: req.query.type,
    search: req.query.search,
    isoStandard: req.query.isoStandard,
    skip,
    limit,
    destination: DESTINATION,
  });
  res.json(paginatedResponse(items, total, page, limit));
});

const listTypes = asyncHandler(async (req, res) => {
  const items = await readSiteService.listTypesWithCounts(DESTINATION);
  res.json({ items });
});

const listIsoStandards = asyncHandler(async (req, res) => {
  const items = await readSiteService.listIsoStandardsWithCounts(DESTINATION);
  res.json({ items });
});

const getOne = asyncHandler(async (req, res) => {
  const doc = await readSiteService.getPublishedDocument(req.params.id, DESTINATION);
  res.json({ document: doc });
});

const documentFile = asyncHandler(async (req, res) => {
  const version = await readSiteService.getPublicDocumentFile(req.params.id, DESTINATION);
  // Public (no auth), so there's no req.user to attribute the audit entry
  // to — same pattern as readSite.controller.js's documentFile.
  await recordAudit({ user: null, action: 'preview', targetType: 'document', targetId: req.params.id, metadata: { public: true } });
  res.json({ url: version.file.url, format: version.file.format });
});

module.exports = { listDocuments, listTypes, listIsoStandards, getOne, documentFile };
