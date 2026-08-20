const express = require('express');
const controller = require('./drawingRegisterAuth.controller');
const { validate } = require('../../middlewares/validate');
const { authenticateDrawingRegister } = require('../../middlewares/drawingRegisterAuth');
const { authLimiter } = require('../../middlewares/rateLimiter');
const { loginSchema } = require('./drawingRegisterAuth.validation');

const router = express.Router();
module.exports = router;

/**
 * @openapi
 * /drawing-register-auth/login:
 *   post:
 *     tags: [Drawing Register Auth]
 *     summary: Log in to the Drawing Register — a separate account system from MS Publishing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Access token (body) + refresh token (httpOnly cookie, scoped to /api/drawing-register-auth)
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);

/**
 * @openapi
 * /drawing-register-auth/refresh:
 *   post:
 *     tags: [Drawing Register Auth]
 *     summary: Exchange the Drawing Register refresh cookie for a new access token
 *     responses:
 *       200: { description: New access token issued, refresh cookie rotated }
 *       401: { description: Refresh cookie missing, invalid or expired }
 */
router.post('/refresh', controller.refresh);

/**
 * @openapi
 * /drawing-register-auth/logout:
 *   post:
 *     tags: [Drawing Register Auth]
 *     summary: Revoke the current Drawing Register refresh token and clear the cookie
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', controller.logout);

/**
 * @openapi
 * /drawing-register-auth/me:
 *   get:
 *     tags: [Drawing Register Auth]
 *     summary: Get the currently authenticated Drawing Register user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current Drawing Register user }
 *       401: { description: Missing/invalid access token }
 */
router.get('/me', authenticateDrawingRegister, controller.me);
