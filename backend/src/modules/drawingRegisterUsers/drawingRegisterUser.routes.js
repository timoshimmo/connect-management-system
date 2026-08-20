const express = require('express');
const controller = require('./drawingRegisterUser.controller');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/permission');
const { validate } = require('../../middlewares/validate');
const {
  createDrawingRegisterUserSchema,
  updateDrawingRegisterUserSchema,
  resetDrawingRegisterUserPasswordSchema,
} = require('./drawingRegisterUser.validation');

const router = express.Router();
module.exports = router;

// Managed exclusively by MS Publishing Document Controllers — this is the
// regular MS Publishing `authenticate` + `requireRole('controller')` guard,
// not the separate Drawing Register auth. Drawing Register accounts
// themselves have no access to these routes at all.
router.use(authenticate, requireRole('controller'));

/**
 * @openapi
 * /drawing-register-users:
 *   get:
 *     tags: [Drawing Register Users]
 *     summary: List Drawing Register viewer accounts (Document Controller only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { items: [{ id: "65f...", name: "E. Adeyemi", email: "e.adeyemi@stac.com", status: "Active" }] }
 *   post:
 *     tags: [Drawing Register Users]
 *     summary: Create a new Drawing Register viewer account
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               status: { type: string, enum: [Active, Inactive] }
 *               jobTitle: { type: string }
 *     responses:
 *       201: { description: Drawing Register user created }
 *       409: { description: A Drawing Register user with this email already exists }
 */
router.get('/', controller.list);
router.post('/', validate({ body: createDrawingRegisterUserSchema }), controller.create);

/**
 * @openapi
 * /drawing-register-users/{id}:
 *   get:
 *     tags: [Drawing Register Users]
 *     summary: Get a single Drawing Register user
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Drawing Register user found }
 *   patch:
 *     tags: [Drawing Register Users]
 *     summary: Update a Drawing Register user's profile (never the password — see /reset-password)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Drawing Register user updated }
 */
router.get('/:id', controller.getOne);
router.patch('/:id', validate({ body: updateDrawingRegisterUserSchema }), controller.update);

/**
 * @openapi
 * /drawing-register-users/{id}/reset-password:
 *   patch:
 *     tags: [Drawing Register Users]
 *     summary: Controller sets a new password directly and revokes the account's existing sessions
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [password], properties: { password: { type: string } } }
 *     responses:
 *       200: { description: Password reset }
 */
router.patch(
  '/:id/reset-password',
  validate({ body: resetDrawingRegisterUserPasswordSchema }),
  controller.resetPassword
);
