const crypto = require('crypto');
const { DrawingRegisterUser } = require('../drawingRegisterUsers/drawingRegisterUser.model');
const { DrawingRegisterRefreshToken } = require('./drawingRegisterRefreshToken.model');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { UnauthorizedError } = require('../../common/errors');
const { recordAudit } = require('../auditLogs/auditLog.service');

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Mirrors auth.service.js's issueTokens/login/refresh/logout shape exactly,
 * but against DrawingRegisterUser + DrawingRegisterRefreshToken instead of
 * User + RefreshToken, and with a `type: 'drawing-register'` claim on every
 * token so the two systems' tokens are never interchangeable (enforced in
 * middlewares/auth.js and middlewares/drawingRegisterAuth.js). No
 * forgot/reset-password flow here — password resets are Controller-driven,
 * see drawingRegisterUser.service.js's resetPassword.
 */
function issueTokens(user) {
  const payload = { sub: user._id.toString(), name: user.name, type: 'drawing-register', jti: crypto.randomUUID() };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}

async function login({ email, password }) {
  const user = await DrawingRegisterUser.findOne({ email: email.toLowerCase() });
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  if (user.status === 'Inactive') {
    throw new UnauthorizedError('This account has been deactivated. Contact your Document Controller.');
  }

  const { accessToken, refreshToken } = issueTokens(user);
  await DrawingRegisterRefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  await recordAudit({ user: user._id, action: 'login', targetType: 'auth', metadata: { email: user.email, accountType: 'drawingRegisterUser' } });

  return { accessToken, refreshToken, user: user.toPublicJSON() };
}

async function refresh(refreshTokenValue) {
  if (!refreshTokenValue) throw new UnauthorizedError('Missing refresh token');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshTokenValue);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
  if (decoded.type !== 'drawing-register') throw new UnauthorizedError('Invalid or expired refresh token');

  const tokenHash = hashToken(refreshTokenValue);
  const stored = await DrawingRegisterRefreshToken.findOne({ tokenHash, user: decoded.sub, revoked: false });
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token is no longer valid');
  }

  const user = await DrawingRegisterUser.findById(decoded.sub);
  if (!user) throw new UnauthorizedError('User no longer exists');

  stored.revoked = true;
  await stored.save();

  const { accessToken, refreshToken: newRefreshToken } = issueTokens(user);
  await DrawingRegisterRefreshToken.create({
    user: user._id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken: newRefreshToken, user: user.toPublicJSON() };
}

async function logout(refreshTokenValue) {
  if (!refreshTokenValue) return;
  const tokenHash = hashToken(refreshTokenValue);
  await DrawingRegisterRefreshToken.updateOne({ tokenHash }, { revoked: true });
}

module.exports = { login, refresh, logout };
