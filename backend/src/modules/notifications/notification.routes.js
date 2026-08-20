const express = require('express');
const controller = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();
module.exports = router;

router.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications (newest first, capped at 50) plus the unread count
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               items: [{ type: "document_published", message: "\"HSE Policy\" has been published.", read: false }]
 *               unreadCount: 3
 */
router.get('/', controller.list);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Notification marked read }
 */
router.patch('/:id/read', controller.markRead);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark every one of the current user's notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All notifications marked read }
 */
router.patch('/read-all', controller.markAllRead);
