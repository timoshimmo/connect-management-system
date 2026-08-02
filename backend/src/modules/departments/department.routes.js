const express = require('express');
const controller = require('./department.controller');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/permission');
const { validate } = require('../../middlewares/validate');
const { createDepartmentSchema, updateDepartmentSchema, listQuerySchema } = require('./department.validation');

const router = express.Router();

/**
 * @openapi
 * /departments:
 *   get:
 *     tags: [Departments]
 *     summary: List departments with their published-document counts. Public — used to populate dropdowns across the app (Read Site included), and (with search/status/pagination) by the admin Department Management panel.
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
 *               items: [{ id: "65f...", name: "HSE", code: "HSE", status: "Active", publishedDocumentCount: 27 }]
 *               pagination: { page: 1, limit: 20, total: 7, totalPages: 1 }
 */
router.get('/', validate({ query: listQuerySchema }), controller.list);

/**
 * @openapi
 * /departments:
 *   post:
 *     tags: [Departments]
 *     summary: Create a department (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name: { type: string, example: HSE }
 *               code: { type: string, example: HSE }
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       201: { description: Department created }
 *       409: { description: A department with this name or code already exists }
 */
router.post('/', authenticate, requireRole('controller'), validate({ body: createDepartmentSchema }), controller.create);

/**
 * @openapi
 * /departments/{id}:
 *   patch:
 *     tags: [Departments]
 *     summary: Update a department — name, code, or status (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Department updated }
 *       409: { description: A department with this name or code already exists }
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('controller'),
  validate({ body: updateDepartmentSchema }),
  controller.update
);

module.exports = router;
