const crypto = require('crypto');
const { User } = require('../users/user.model');
const { RefreshToken } = require('./refreshToken.model');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { UnauthorizedError, BadRequestError } = require('../../common/errors');
const { sendMail } = require('../../utils/mailer');
const { renderEmail } = require('../../utils/emailTemplates');
const { recordAudit } = require('../auditLogs/auditLog.service');
const env = require('../../config/env');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
// Invitations get a longer window than a routine password reset — the
// account may sit unused for a few days before the new hire's first login.
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function resetLink(rawToken) {
  return `${env.frontendUrl}/reset-password/${rawToken}`;
}

/**
 * Issues a set-password token for a freshly created account and emails the
 * invitee a real link, reusing the exact same token mechanism/route as a
 * routine forgot-password reset (resetPassword() below accepts either).
 * Called right after user.service.js's createUser — never fails the account
 * creation itself if the email doesn't send (sendMail already swallows its
 * own errors), so an admin can always fall back to sharing the link
 * manually from the audit log / server logs if needed.
 */
async function inviteUser(user) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = hashToken(rawToken);
  user.resetPasswordExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);
  await user.save();

  const link = resetLink(rawToken);
  const text = `Hi ${user.name},

An account has been created for you on STACconnect (role: ${user.role}).

Set your password here (link expires in 7 days):
${link}

If you weren't expecting this, you can ignore this email.`;

  await sendMail({
    to: user.email,
    subject: 'Welcome to STACconnect — set your password',
    text,
    html: renderEmail({
      title: 'Welcome to STACconnect',
      bodyText: `Hi ${user.name},\n\nAn account has been created for you on STACconnect (role: ${user.role}). Set your password below to get started — this link expires in 7 days.\n\nIf you weren't expecting this, you can safely ignore this email.`,
      cta: { label: 'Set Your Password', url: link },
      preheader: 'Set your password to activate your STACconnect account.',
    }),
  });

  return { rawToken, link };
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
  const user = await User.findOne({ email: email.toLowerCase() }).populate('department', 'name code');
  if (!user) throw new UnauthorizedError('Invalid email or password');

  // An SSO-only account (Microsoft, no password ever set) has no hash to
  // compare against — bcrypt.compare() would throw on a null hash, and
  // "Invalid email or password" would be misleading (the email is right,
  // there's just no password method to check it against yet).
  if (!user.passwordHash) {
    throw new UnauthorizedError(
      'This account signs in with Microsoft. Use "Sign in with Microsoft", or set a password from your account profile first.'
    );
  }

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

  const user = await User.findById(decoded.sub).populate('department', 'name code');
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

    const link = resetLink(rawToken);
    await sendMail({
      to: user.email,
      subject: 'Reset your STACconnect password',
      text: `Reset your password here (expires in 1 hour):
${link}

If you didn't request this, you can ignore this email.`,
      html: renderEmail({
        title: 'Reset Your Password',
        bodyText: "We received a request to reset your STACconnect password. This link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email — your password won't change.",
        cta: { label: 'Reset Password', url: link },
        preheader: 'Reset your STACconnect password.',
      }),
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

module.exports = {
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  inviteUser,
  // Exported for reuse by microsoft.service.js — SSO login issues the exact
  // same token pair/RefreshToken record as password login, and hashes its
  // own short-lived OAuth state the same way.
  hashToken,
  issueTokens,
};
