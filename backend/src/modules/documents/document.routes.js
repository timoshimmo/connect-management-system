const express = require('express');
const controller = require('./document.controller');
const bulkImportController = require('./bulkImport.controller');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/permission');
const { validate } = require('../../middlewares/validate');
const { upload } = require('../../middlewares/upload');
const { excelUpload, bulkFilesUpload, MAX_BULK_FILES } = require('../../middlewares/bulkUpload');
const {
  createDocumentSchema,
  updateDocumentSchema,
  assignSchema,
  reassignSchema,
  returnSchema,
  archiveSchema,
  listQuerySchema,
} = require('./document.validation');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /documents:
 *   get:
 *     tags: [Documents]
 *     summary: List documents (filterable by department, type, status, search)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches title or Doc ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               items: [{ docId: "HR-2026-004", title: "Flexible Working Policy", status: "Under Review" }]
 *               pagination: { page: 1, limit: 20, total: 34, totalPages: 2 }
 *   post:
 *     tags: [Documents]
 *     summary: Create a new document draft (Author or Controller). Optionally attach the first file version.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, department, type]
 *             properties:
 *               title: { type: string, example: "HSE Safety Procedure v1" }
 *               department: { type: string, example: "65f0c2..." }
 *               type: { type: string, enum: [Manual, Policy, Procedure, Standard, Goal, "Org Chart", "Policy Change", "Functional Description", Form] }
 *               description: { type: string }
 *               location: { type: string, enum: [Onshore, "Offshore – Mayo ABO", Both] }
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Draft created }
 */
router.get('/', validate({ query: listQuerySchema }), controller.list);
router.post(
  '/',
  requireRole('author', 'controller'),
  upload.single('file'),
  validate({ body: createDocumentSchema }),
  controller.create
);

/**
 * Bulk import (Document Controller only) — placed above the `/:id` routes
 * below so a literal path like `/bulk-import/template` is never shadowed by
 * a wildcard `:id` match.
 *
 * @openapi
 * /documents/bulk-import/template:
 *   get:
 *     tags: [Documents]
 *     summary: Download the bulk-import Excel template (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: The .xlsx template file }
 * /documents/bulk-import/parse:
 *   post:
 *     tags: [Documents]
 *     summary: Parse and validate an uploaded bulk-import Excel sheet, without importing anything (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [file], properties: { file: { type: string, format: binary } } }
 *     responses:
 *       200: { description: Per-row validation results }
 * /documents/bulk-import/commit:
 *   post:
 *     tags: [Documents]
 *     summary: Import the given rows + matching files, publishing each valid row directly (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [rows, files]
 *             properties:
 *               rows: { type: string, description: 'JSON-encoded array of { rowNumber, data }' }
 *               files: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       200: { description: 'Import summary: { total, succeeded, failed, skipped, results }' }
 */
router.get('/bulk-import/template', requireRole('controller'), bulkImportController.template);
router.post('/bulk-import/parse', requireRole('controller'), excelUpload.single('file'), bulkImportController.parse);
router.post(
  '/bulk-import/commit',
  requireRole('controller'),
  bulkFilesUpload.array('files', MAX_BULK_FILES),
  bulkImportController.commit
);

/**
 * @openapi
 * /documents/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Get a single document with its current version
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Document found }
 *       404: { description: Document not found }
 *   patch:
 *     tags: [Documents]
 *     summary: Update a draft's own fields (author or Controller only, Draft status only). File replacement is a separate call — see /documents/{id}/versions.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               department: { type: string }
 *               type: { type: string, enum: [Manual, Policy, Procedure, Standard, Goal, "Org Chart", "Policy Change", "Functional Description", Form] }
 *               description: { type: string }
 *               location: { type: string, enum: [Onshore, "Offshore – Mayo ABO", Both] }
 *     responses:
 *       200: { description: Document updated }
 *       409: { description: Document is no longer a Draft }
 */
router.get('/:id', controller.getOne);
router.patch('/:id', validate({ body: updateDocumentSchema }), controller.update);

/**
 * @openapi
 * /documents/{id}/versions:
 *   get:
 *     tags: [Documents]
 *     summary: Get the version history of a document
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Version history, newest first }
 *   post:
 *     tags: [Documents]
 *     summary: Upload a new version (never overwrites — always creates a new version)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               changeNote: { type: string }
 *     responses:
 *       201: { description: New version created }
 */
router.get('/:id/versions', controller.listVersions);
router.post('/:id/versions', requireRole('author', 'controller'), upload.single('file'), controller.addVersion);

/**
 * @openapi
 * /documents/{id}/submit:
 *   post:
 *     tags: [Documents]
 *     summary: Author submits a draft — moves it to "Pending Assignment"
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Document is now Pending Assignment }
 *       409: { description: Document isn't in Draft status }
 */
// 'controller' is included alongside 'author' because Controllers can also
// author documents (canCreate is true for both roles) — the real gate is
// document.service.js's ownership check (only *this* draft's actual author
// may submit it), this route-level check just needs to not be stricter than
// that and lock Controllers out of submitting their own drafts.
router.post('/:id/submit', requireRole('author', 'controller'), controller.submitForReview);

/**
 * @openapi
 * /documents/{id}/assign:
 *   post:
 *     tags: [Documents]
 *     summary: Controller assigns a reviewer and approver — moves it to "Under Review"
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reviewer, approver]
 *             properties:
 *               reviewer: { type: string, example: "65f0c2..." }
 *               approver: { type: string, example: "65f0c2..." }
 *     responses:
 *       200: { description: Document is now Under Review }
 */
router.post('/:id/assign', requireRole('controller'), validate({ body: assignSchema }), controller.assign);

/**
 * @openapi
 * /documents/{id}/reassign:
 *   post:
 *     tags: [Documents]
 *     summary: Controller reassigns the reviewer and/or approver on a document already in progress (Under Review, Pending Approval, Pending Publishing, or Draft-with-changes-requested). Status is left unchanged.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reviewer: { type: string, example: "65f0c2..." }
 *               approver: { type: string, example: "65f0c2..." }
 *               reason: { type: string, example: "Original reviewer is on leave" }
 *     responses:
 *       200: { description: Reviewer and/or approver updated }
 *       409: { description: Document isn't in a reassignable status }
 */
router.post('/:id/reassign', requireRole('controller'), validate({ body: reassignSchema }), controller.reassign);

/**
 * @openapi
 * /documents/{id}/forward:
 *   post:
 *     tags: [Documents]
 *     summary: Reviewer forwards to the pre-assigned approver — moves it to "Pending Approval"
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Document is now Pending Approval }
 */
router.post('/:id/forward', requireRole('reviewer'), controller.forward);

/**
 * @openapi
 * /documents/{id}/return:
 *   post:
 *     tags: [Documents]
 *     summary: Reviewer returns the document to the author with comments
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { notes: { type: string } } }
 *     responses:
 *       200: { description: Document is back in Draft }
 */
router.post('/:id/return', requireRole('reviewer'), validate({ body: returnSchema }), controller.returnToAuthor);

/**
 * @openapi
 * /documents/{id}/approve:
 *   post:
 *     tags: [Documents]
 *     summary: Approver signs off — moves it to "Pending Publishing"
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Document is now Pending Publishing }
 */
router.post('/:id/approve', requireRole('approver'), controller.approve);

/**
 * @openapi
 * /documents/{id}/reject:
 *   post:
 *     tags: [Documents]
 *     summary: Approver rejects — sends it back to "Under Review"
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Document is back Under Review }
 */
router.post('/:id/reject', requireRole('approver'), controller.reject);

/**
 * @openapi
 * /documents/{id}/publish:
 *   post:
 *     tags: [Documents]
 *     summary: Controller publishes — appears on the Read Site immediately
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Document is now Published }
 */
router.post('/:id/publish', requireRole('controller'), controller.publish);

/**
 * @openapi
 * /documents/{id}/reject-publishing:
 *   post:
 *     tags: [Documents]
 *     summary: Controller rejects at the publishing stage — sends it back to "Pending Approval"
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Document is back Pending Approval }
 */
router.post('/:id/reject-publishing', requireRole('controller'), controller.rejectPublishing);

/**
 * @openapi
 * /documents/{id}/archive:
 *   post:
 *     tags: [Documents]
 *     summary: Controller archives a Published document — it's removed from the Read Site but kept in the Admin Portal
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { reason: { type: string } } }
 *     responses:
 *       200: { description: Document is now Archived }
 *       409: { description: Document isn't Published }
 */
router.post('/:id/archive', requireRole('controller'), validate({ body: archiveSchema }), controller.archive);

/**
 * @openapi
 * /documents/{id}/restore:
 *   post:
 *     tags: [Documents]
 *     summary: Controller restores an archived document back to Published
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Document is Published again }
 *       409: { description: Document isn't Archived }
 */
router.post('/:id/restore', requireRole('controller'), controller.restore);

/**
 * @openapi
 * /documents/{id}/initiate-revision:
 *   post:
 *     tags: [Documents]
 *     summary: Reopens a Published-but-overdue document as a new Draft
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Document is back in Draft }
 */
router.post('/:id/initiate-revision', requireRole('approver', 'controller'), controller.initiateRevision);

/**
 * @openapi
 * /documents/{id}/download:
 *   get:
 *     tags: [Documents]
 *     summary: Get the current version's download URL (logs an audit "download" event)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { url: "https://pub-xxxxxxxxxxxx.r2.dev/documents/hse/HSE-2026-001-v1.0.pdf", fileName: "1.0.pdf" }
 */
router.get('/:id/download', controller.download);

/**
 * @openapi
 * /documents/{id}/preview:
 *   get:
 *     tags: [Documents]
 *     summary: Get the current version's preview URL (logs an audit "preview" event)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { url: "https://pub-xxxxxxxxxxxx.r2.dev/documents/hse/HSE-2026-001-v1.0.pdf", format: "pdf" }
 */
router.get('/:id/preview', controller.preview);

module.exports = router;
