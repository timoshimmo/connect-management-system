const express = require('express');
const controller = require('./user.controller');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/permission');
const { validate } = require('../../middlewares/validate');
const { updateRoleSchema, createUserSchema, updateUserSchema } = require('./user.validation');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users (optionally filtered by role) — used for reviewer/approver pickers
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [author, reviewer, approver, controller] }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { items: [{ id: "65f...", name: "A. Musa", email: "a.musa@stac.com", role: "reviewer" }] }
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string, example: "J. Okafor" }
 *               email: { type: string, example: "j.okafor@stac.com" }
 *               password: { type: string, example: "strongPassword123" }
 *               role: { type: string, enum: [author, reviewer, approver, controller] }
 *               department: { type: string, example: "65f0c2..." }
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       201: { description: User created }
 *       409: { description: A user with this email already exists }
 *       403: { description: Document Controllers only }
 */
router.get('/', controller.list);
router.post('/', requireRole('controller'), validate({ body: createUserSchema }), controller.create);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a single user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User found }
 *       404: { description: User not found }
 */
router.get('/:id', controller.getOne);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user's profile — name, email, department, role, status, job title (Document Controller only). Password isn't editable here — see /auth/forgot-password.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               role: { type: string, enum: [author, reviewer, approver, controller] }
 *               department: { type: string }
 *               status: { type: string, enum: [Active, Inactive] }
 *               jobTitle: { type: string }
 *     responses:
 *       200: { description: User updated }
 *       409: { description: A user with this email already exists }
 */
router.patch('/:id', requireRole('controller'), validate({ body: updateUserSchema }), controller.update);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Grant a user a different role (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [author, reviewer, approver, controller] }
 *     responses:
 *       200: { description: Role updated }
 *       403: { description: Only Document Controllers can grant roles }
 */
router.patch('/:id/role', requireRole('controller'), validate({ body: updateRoleSchema }), controller.updateRole);

module.exports = router;
