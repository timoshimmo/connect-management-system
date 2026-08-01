const express = require('express');
const controller = require('./comment.controller');
const { authenticate } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const { createCommentSchema, listQuerySchema } = require('./comment.validation');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /comments:
 *   get:
 *     tags: [Comments]
 *     summary: List comments on a document or drawing
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: targetType
 *         required: true
 *         schema: { type: string, enum: [document, drawing] }
 *       - in: query
 *         name: targetId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Comments, oldest first }
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a document or drawing (e.g. reviewer feedback)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType, targetId, body]
 *             properties:
 *               targetType: { type: string, enum: [document, drawing] }
 *               targetId: { type: string }
 *               body: { type: string, example: "Clashes with HVAC ducting — please revise." }
 *     responses:
 *       201: { description: Comment created }
 */
router.get('/', validate({ query: listQuerySchema }), controller.list);
router.post('/', validate({ body: createCommentSchema }), controller.create);

module.exports = router;
