const express = require('express');
const controller = require('./documentRegister.controller');

const router = express.Router();
module.exports = router;

/**
 * @openapi
 * /document-register/documents:
 *   get:
 *     tags: [Document Register]
 *     summary: Public — list published Document Register documents (no auth required)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: isoStandard
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches title or Doc ID
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               items: [{ docId: "SMS-MP00001", title: "QHSE Management System Manual", status: "Published" }]
 *               pagination: { page: 1, limit: 20, total: 20, totalPages: 1 }
 */
router.get('/documents', controller.listDocuments);

/**
 * @openapi
 * /document-register/types:
 *   get:
 *     tags: [Document Register]
 *     summary: Public — every document type with a live published-document count (Document Type filter)
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { items: [{ type: "Procedure", count: 19 }, { type: "Manual", count: 1 }] }
 */
router.get('/types', controller.listTypes);

/**
 * @openapi
 * /document-register/iso-standards:
 *   get:
 *     tags: [Document Register]
 *     summary: Public — every ISO standard with a live published-document count (ISO Standard filter)
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { items: [{ standard: "ISO 9001 (Quality)", count: 12 }] }
 */
router.get('/iso-standards', controller.listIsoStandards);

/**
 * @openapi
 * /document-register/documents/{id}/file:
 *   get:
 *     tags: [Document Register]
 *     summary: Public — get a published document's preview/download URL
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { url: "https://pub-xxxxxxxxxxxx.r2.dev/documents/com/SMS-MP00001-v1.0.pdf", format: "pdf" }
 *       404: { description: Document doesn't exist, isn't published, or isn't a Document Register document }
 */
router.get('/documents/:id/file', controller.documentFile);

/**
 * @openapi
 * /document-register/{id}:
 *   get:
 *     tags: [Document Register]
 *     summary: Public — a single published Document Register document's detail
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Document found }
 *       404: { description: Document doesn't exist, isn't published, or isn't a Document Register document }
 */
router.get('/:id', controller.getOne);
