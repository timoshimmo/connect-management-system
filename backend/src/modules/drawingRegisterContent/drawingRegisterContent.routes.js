const express = require('express');
const controller = require('./drawingRegisterContent.controller');
const { authenticateDrawingRegister } = require('../../middlewares/drawingRegisterAuth');

const router = express.Router();

// Every route here requires a valid Drawing Register session — unlike the
// Read Site (public, no auth), unauthenticated visitors get nothing.
router.use(authenticateDrawingRegister);

/**
 * @openapi
 * /drawing-register/documents:
 *   get:
 *     tags: [Drawing Register]
 *     summary: List published documents destined for the Drawing Register (requires Drawing Register login)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated list of Drawing-Register-destined published documents }
 *       401: { description: Missing/invalid Drawing Register access token }
 */
router.get('/documents', controller.listDocuments);

/**
 * @openapi
 * /drawing-register/documents/{id}/file:
 *   get:
 *     tags: [Drawing Register]
 *     summary: Get a Drawing-Register-destined document's preview/download URL
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: File URL }
 *       403: { description: Document exists but isn't published, or isn't destined for the Drawing Register }
 */
router.get('/documents/:id/file', controller.documentFile);

/**
 * @openapi
 * /drawing-register/departments:
 *   get:
 *     tags: [Drawing Register]
 *     summary: Departments with Drawing-Register-destined published-document counts
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Department list with counts }
 */
router.get('/departments', controller.listDepartments);

module.exports = router;
