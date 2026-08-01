const express = require('express');
const controller = require('./auth.controller');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { authLimiter } = require('../../middlewares/rateLimiter');
const {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordParamsSchema,
} = require('./auth.validation');

const router = express.Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: l.sule@stac.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Access token (body) + refresh token (httpOnly cookie)
 *         content:
 *           application/json:
 *             example:
 *               accessToken: eyJhbGciOi...
 *               user: { id: "65f...", name: "L. Sule", email: "l.sule@stac.com", role: "author" }
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange the httpOnly refresh cookie for a new access token
 *     responses:
 *       200: { description: New access token issued, refresh cookie rotated }
 *       401: { description: Refresh cookie missing, invalid or expired }
 */
router.post('/refresh', controller.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh token and clear the cookie
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', controller.logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: l.sule@stac.com }
 *     responses:
 *       200:
 *         description: Always 200 — does not reveal whether the email exists
 *         content:
 *           application/json:
 *             example: { message: "If an account exists for that email, a reset link has been sent." }
 */
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), controller.forgotPassword);

/**
 * @openapi
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Reset the password using the token emailed by forgot-password
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, example: newStrongPassword123 }
 *     responses:
 *       200: { description: Password reset }
 *       400: { description: Token invalid or expired }
 */
router.post(
  '/reset-password/:token',
  authLimiter,
  validate({ params: resetPasswordParamsSchema, body: resetPasswordSchema }),
  controller.resetPassword
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example: { user: { id: "65f...", name: "L. Sule", email: "l.sule@stac.com", role: "author" } }
 *       401: { description: Missing/invalid access token }
 */
router.get('/me', authenticate, controller.me);

module.exports = router;
