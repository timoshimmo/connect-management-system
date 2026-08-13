const asyncHandler = require('../../utils/asyncHandler');
const authService = require('./auth.service');
const { User } = require('../users/user.model');
const { NotFoundError } = require('../../common/errors');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
}

const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

const refresh = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.refresh(req.cookies?.[REFRESH_COOKIE_NAME]);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.json({ message: 'Logged out.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  res.json(result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.params.token, req.body.password);
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('department', 'name code');
  if (!user) throw new NotFoundError('User not found');
  res.json({ user: user.toPublicJSON() });
});

module.exports = { login, refresh, logout, forgotPassword, resetPassword, me, setRefreshCookie };
