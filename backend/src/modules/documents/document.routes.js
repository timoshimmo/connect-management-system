const express = require('express');

// TEMPORARY diagnostic: routes/index.js's router.use() calls for documents
// onward were all silently failing to register on Vercel (404 for
// everything from /documents through the end of the mount list, while
// everything before it — auth/users/roles/departments/disciplines — worked
// fine). That pattern means something in THIS file's own require chain
// throws during load and Vercel's module loader swallows the error instead
// of propagating it (same class of bug seen in routes/index.js earlier).
// Wrapping each require individually (the require() call itself still uses
// a static string literal, so Vercel's file-tracer can still see it) forces
// the real error to surface with the specific module named.
function safeRequire(name, loadFn) {
  try {
    return loadFn();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[document.routes] failed to load "${name}":`, err && err.stack ? err.stack : err);
    throw new Error(`[document.routes] failed to load "${name}": ${err && err.message}`);
  }
}

const controller = safeRequire('document.controller', () => require('./document.controller'));
const bulkImportController = safeRequire('bulkImport.controller', () => require('./bulkImport.controller'));
const documentRegisterBulkImportController = safeRequire(
  'documentRegisterBulkImport.controller',
  () => require('./documentRegisterBulkImport.controller')
);
const { authenticate } = safeRequire('middlewares/auth', () => require('../../middlewares/auth'));
const { requireRole } = safeRequire('middlewares/permission', () => require('../../middlewares/permission'));
const { validate } = safeRequire('middlewares/validate', () => require('../../middlewares/validate'));
const { excelUpload } = safeRequire('middlewares/bulkUpload', () => require('../../middlewares/bulkUpload'));
const {
  createDocumentSchema,
  updateDocumentSchema,
  assignSchema,
  reassignSchema,
  returnSchema,
  archiveSchema,
  listQuerySchema,
  uploadUrlRequestSchema,
  addVersionSchema,
} = safeRequire('document.validation', () => require('./document.validation'));

const router = express.Router();
module.exports = router;

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
 *     summary: Create a new document draft (Author or Controller). Optionally attach the first file version via `fileRef` (see /documents/upload-urls).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, department, type]
 *             properties:
 *               title: { type: string, example: "HSE Safety Procedure v1" }
 *               department: { type: string, example: "65f0c2..." }
 *               type: { type: string, enum: [Manual, Policy, Procedure, Standard, Goal, "Org Chart", "Policy Change", "Functional Description", Form] }
 *               description: { type: string }
 *               location: { type: string, enum: [Onshore, "Offshore – Mayo ABO", Both] }
 *               fileRef: { type: object, properties: { key: { type: string }, originalFilename: { type: string }, size: { type: integer }, mimeType: { type: string } } }
 *     responses:
 *       201: { description: Draft created }
 */
router.get('/', validate({ query: listQuerySchema }), controller.list);
router.post('/', requireRole('author', 'controller'), validate({ body: createDocumentSchema }), controller.create);

/**
 * @openapi
 * /documents/upload-urls:
 *   post:
 *     tags: [Documents]
 *     summary: Mint short-lived presigned R2 PUT URLs so the browser can upload file bytes directly to storage, bypassing the API's request-body size limit.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [filename, mimeType, size]
 *                   properties:
 *                     filename: { type: string }
 *                     mimeType: { type: string }
 *                     size: { type: integer }
 *     responses:
 *       200: { description: 'One presigned target per requested file, in the same order: { key, uploadUrl, originalFilename, mimeType, size }' }
 */
router.post(
  '/upload-urls',
  requireRole('author', 'controller'),
  validate({ body: uploadUrlRequestSchema }),
  controller.getUploadUrls
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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rows, fileRefs]
 *             properties:
 *               rows: { type: array, description: 'Array of { rowNumber, data }' }
 *               fileRefs: { type: array, description: 'Files already uploaded via /documents/upload-urls: { key, originalFilename, size, mimeType }[]' }
 *     responses:
 *       200: { description: 'Import summary: { total, succeeded, failed, skipped, results }' }
 */
router.get('/bulk-import/template', requireRole('controller'), bulkImportController.template);
router.post('/bulk-import/parse', requireRole('controller'), excelUpload.single('file'), bulkImportController.parse);
router.post('/bulk-import/commit', requireRole('controller'), bulkImportController.commit);

/**
 * Document Register bulk import (Document Controller only) — a dedicated
 * template/parse/commit flow matching the Controller's own existing QHSE
 * register file format (Reference No. / Document Title / Version (Rev.) /
 * Issue Date / Document Type / ISO Clauses Covered / File Name — no
 * Department or Author column). Separate from /bulk-import/* above, which
 * keeps handling Read Site/Drawing Register (and ad-hoc Document Register
 * rows) via its own generic multi-destination sheet, unchanged.
 *
 * @openapi
 * /documents/document-register-bulk-import/template:
 *   get:
 *     tags: [Documents]
 *     summary: Download the Document Register bulk-import Excel template (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: The .xlsx template file }
 * /documents/document-register-bulk-import/parse:
 *   post:
 *     tags: [Documents]
 *     summary: Parse and validate an uploaded Document Register Excel sheet, without importing anything (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [file], properties: { file: { type: string, format: binary } } }
 *     responses:
 *       200: { description: Per-row validation results }
 * /documents/document-register-bulk-import/commit:
 *   post:
 *     tags: [Documents]
 *     summary: Import the given Document Register rows + matching files, publishing each valid row directly (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rows, fileRefs]
 *             properties:
 *               rows: { type: array, description: 'Array of { rowNumber, data }' }
 *               fileRefs: { type: array, description: 'Files already uploaded via /documents/upload-urls: { key, originalFilename, size, mimeType }[]' }
 *     responses:
 *       200: { description: 'Import summary: { total, succeeded, failed, skipped, results }' }
 */
router.get(
  '/document-register-bulk-import/template',
  requireRole('controller'),
  documentRegisterBulkImportController.template
);
router.post(
  '/document-register-bulk-import/parse',
  requireRole('controller'),
  excelUpload.single('file'),
  documentRegisterBulkImportController.parse
);
router.post('/document-register-bulk-import/commit', requireRole('controller'), documentRegisterBulkImportController.commit);

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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileRef]
 *             properties:
 *               fileRef: { type: object, description: 'Already uploaded via /documents/upload-urls: { key, originalFilename, size, mimeType }' }
 *               changeNote: { type: string }
 *     responses:
 *       201: { description: New version created }
 */
router.get('/:id/versions', controller.listVersions);
router.post(
  '/:id/versions',
  requireRole('author', 'controller'),
  validate({ body: addVersionSchema }),
  controller.addVersion
);

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
