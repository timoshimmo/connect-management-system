const crypto = require('crypto');
const { User } = require('../users/user.model');
const { RefreshToken } = require('./refreshToken.model');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { UnauthorizedError, BadRequestError } = require('../../common/errors');
const { sendMail } = require('../../utils/mailer');
const { recordAudit } = require('../auditLogs/auditLog.service');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function issueTokens(user) {
  // jti guarantees uniqueness even when two tokens are issued for the same
  // user within the same second (e.g. login immediately followed by a
  // refresh) — without it those JWTs are byte-identical, which collides
  // with RefreshToken's unique tokenHash index.
  const payload = { sub: user._id.toString(), name: user.name, role: user.role, jti: crypto.randomUUID() };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  if (user.status === 'Inactive') {
    throw new UnauthorizedError('This account has been deactivated. Contact your Document Controller.');
  }

  const { accessToken, refreshToken } = issueTokens(user);
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  await recordAudit({ user: user._id, action: 'login', targetType: 'auth', metadata: { email: user.email } });

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

  const tokenHash = hashToken(refreshTokenValue);
  const stored = await RefreshToken.findOne({ tokenHash, user: decoded.sub, revoked: false });
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token is no longer valid');
  }

  const user = await User.findById(decoded.sub);
  if (!user) throw new UnauthorizedError('User no longer exists');

  // Rotate: revoke the old token and issue a new pair.
  stored.revoked = true;
  await stored.save();

  const { accessToken, refreshToken: newRefreshToken } = issueTokens(user);
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken: newRefreshToken, user: user.toPublicJSON() };
}

async function logout(refreshTokenValue) {
  if (!refreshTokenValue) return;
  const tokenHash = hashToken(refreshTokenValue);
  await RefreshToken.updateOne({ tokenHash }, { revoked: true });
}

async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always behave the same way regardless of whether the account exists,
  // so this endpoint can't be used to enumerate registered emails.
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = hashToken(rawToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    await sendMail({
      to: user.email,
      subject: 'Reset your STACconnect password',
      text: `Reset your password using this token: ${rawToken} (expires in 1 hour)`,
    });
  }
  return { message: 'If an account exists for that email, a reset link has been sent.' };
}

async function resetPassword(token, newPassword) {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });
  if (!user) throw new BadRequestError('This reset link is invalid or has expired.');

  user.passwordHash = await hashPassword(newPassword);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();

  // A password reset invalidates every existing session.
  await RefreshToken.updateMany({ user: user._id }, { revoked: true });

  return { message: 'Password has been reset.' };
}

module.exports = { login, refresh, logout, forgotPassword, resetPassword };
