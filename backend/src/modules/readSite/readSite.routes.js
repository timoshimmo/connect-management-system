const express = require('express');
const controller = require('./readSite.controller');
const { validate } = require('../../middlewares/validate');
const { createContactMessageSchema } = require('../contactMessages/contactMessage.validation');

const router = express.Router();
module.exports = router;

/**
 * @openapi
 * /read-site/documents:
 *   get:
 *     tags: [Read Site]
 *     summary: Public — list published documents destined for the Read Site (no auth required)
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
 *         description: Matches title or Doc ID (per the guide's "search by title, keywords, doc id")
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               items: [{ docId: "COM-2026-001", title: "Compliance Code of Conduct 2026", status: "Published" }]
 *               pagination: { page: 1, limit: 20, total: 142, totalPages: 8 }
 */
router.get('/documents', controller.listDocuments);

/**
 * @openapi
 * /read-site/documents/{id}/file:
 *   get:
 *     tags: [Read Site]
 *     summary: Public — get a published document's preview/download URL (Read Site destination only)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { url: "https://pub-xxxxxxxxxxxx.r2.dev/documents/hse/HSE-2026-001-v1.0.pdf", format: "pdf" }
 *       403: { description: Document exists but isn't published, or isn't destined for the Read Site }
 */
router.get('/documents/:id/file', controller.documentFile);

/**
 * @openapi
 * /read-site/departments:
 *   get:
 *     tags: [Read Site]
 *     summary: Public — departments with Read-Site-destined published-document counts, for "Browse by Department"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { items: [{ name: "HSE", code: "HSE", publishedDocumentCount: 27 }] }
 */
router.get('/departments', controller.listDepartments);

/**
 * @openapi
 * /read-site/stats:
 *   get:
 *     tags: [Read Site]
 *     summary: Public — org-wide document counts for the Dashboard hero (no per-document detail)
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { totalDocuments: 34, pendingApproval: 3, publishedThisMonth: 11, dueForReview: 3 }
 */
router.get('/stats', controller.stats);

/**
 * @openapi
 * /read-site/contact:
 *   post:
 *     tags: [Read Site]
 *     summary: Public — "Contact Document Controller" submission from the Read Site (no auth required)
 *     requestBody:
 *       content:
 *         application/json:
 *           example: { subject: "Missing revision", message: "The PDF for HSE-2026-001 seems outdated.", department: "64f...", relatedDocument: "64f..." }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             example: { id: "64f..." }
 */
router.post('/contact', validate({ body: createContactMessageSchema }), controller.contact);
