const express = require('express');
const controller = require('./discipline.controller');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/permission');
const { validate } = require('../../middlewares/validate');
const { createDisciplineSchema, updateDisciplineSchema, listQuerySchema } = require('./discipline.validation');

const router = express.Router();
module.exports = router;

/**
 * @openapi
 * /disciplines:
 *   get:
 *     tags: [Disciplines]
 *     summary: List engineering disciplines. Public — populates the Discipline dropdown on the Drawing Register branch of Create Document, and (with search/status/pagination) the admin Discipline Management panel.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Active, Inactive] }
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
 *               items: [{ id: "65f...", name: "Mechanical", status: "Active" }]
 *               pagination: { page: 1, limit: 20, total: 5, totalPages: 1 }
 *   post:
 *     tags: [Disciplines]
 *     summary: Create a discipline (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Mechanical }
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       201: { description: Discipline created }
 *       409: { description: A discipline with this name already exists }
 */
router.get('/', validate({ query: listQuerySchema }), controller.list);
router.post('/', authenticate, requireRole('controller'), validate({ body: createDisciplineSchema }), controller.create);

/**
 * @openapi
 * /disciplines/{id}:
 *   patch:
 *     tags: [Disciplines]
 *     summary: Update a discipline — name or status (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Discipline updated }
 *       409: { description: A discipline with this name already exists }
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('controller'),
  validate({ body: updateDisciplineSchema }),
  controller.update
);
