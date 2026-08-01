const asyncHandler = require('../../utils/asyncHandler');
const drawingRegisterAuthService = require('./drawingRegisterAuth.service');
const { DrawingRegisterUser } = require('../drawingRegisterUsers/drawingRegisterUser.model');
const { NotFoundError } = require('../../common/errors');

// A distinct cookie name + path from MS Publishing's 'refreshToken' /
// '/api/auth' — the two refresh cookies must never collide or be sent to
// each other's endpoints.
const REFRESH_COOKIE_NAME = 'drRefreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/drawing-register-auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
}

const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await drawingRegisterAuthService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

const refresh = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await drawingRegisterAuthService.refresh(req.cookies?.[REFRESH_COOKIE_NAME]);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

const logout = asyncHandler(async (req, res) => {
  await drawingRegisterAuthService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/drawing-register-auth' });
  res.json({ message: 'Logged out.' });
});

const me = asyncHandler(async (req, res) => {
  const user = await DrawingRegisterUser.findById(req.drawingRegisterUser.id);
  if (!user) throw new NotFoundError('User not found');
  res.json({ user: user.toPublicJSON() });
});

module.exports = { login, refresh, logout, me };
