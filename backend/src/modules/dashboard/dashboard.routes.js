const express = require('express');
const controller = require('./dashboard.controller');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();
module.exports = router;

router.use(authenticate);

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Role-aware KPI summary for MS Publishing (mirrors the frontend's dashboard cards)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { role: "controller", stats: { total: 142, pendingAssignment: 2, pendingPublishing: 2, publishedThisMonth: 11, dueForReview: 4 } }
 */
router.get('/summary', controller.summary);
