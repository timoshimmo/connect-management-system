const express = require('express');
const controller = require('./department.controller');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/permission');
const { validate } = require('../../middlewares/validate');
const { createDepartmentSchema } = require('./department.validation');

const router = express.Router();

/**
 * @openapi
 * /departments:
 *   get:
 *     tags: [Departments]
 *     summary: List departments with their published-document counts
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { items: [{ id: "65f...", name: "HSE", code: "HSE", publishedDocumentCount: 27 }] }
 */
router.get('/', controller.list);

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
 *     responses:
 *       201: { description: Department created }
 */
router.post('/', authenticate, requireRole('controller'), validate({ body: createDepartmentSchema }), controller.create);

module.exports = router;
