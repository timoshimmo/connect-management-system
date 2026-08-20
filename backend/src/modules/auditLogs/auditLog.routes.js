const express = require('express');
const controller = require('./auditLog.controller');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/permission');

const router = express.Router();
module.exports = router;

/**
 * @openapi
 * /audit-logs:
 *   get:
 *     tags: [Audit Logs]
 *     summary: List audit log entries (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [login, upload, edit, review, approve, reject, publish, archive, download, preview, delete] }
 *       - in: query
 *         name: targetType
 *         schema: { type: string, enum: [document, user, drawingRegisterUser, auth] }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               items: [{ action: "publish", targetType: "document", user: { name: "Admin" }, timestamp: "2026-06-03T10:00:00Z" }]
 *       403: { description: Document Controllers only }
 */
router.get('/', authenticate, requireRole('controller'), controller.list);
