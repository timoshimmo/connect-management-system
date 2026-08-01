const { DrawingRegisterUser } = require('./drawingRegisterUser.model');
const { DrawingRegisterRefreshToken } = require('../drawingRegisterAuth/drawingRegisterRefreshToken.model');
const { NotFoundError, ConflictError } = require('../../common/errors');
const { hashPassword } = require('../../utils/password');

async function listUsers() {
  return DrawingRegisterUser.find().sort({ name: 1 });
}

async function getUserById(id) {
  const user = await DrawingRegisterUser.findById(id);
  if (!user) throw new NotFoundError('Drawing Register user not found');
  return user;
}

async function createUser({ name, email, password, status, jobTitle }) {
  const existing = await DrawingRegisterUser.findOne({ email: email.toLowerCase() });
  if (existing) throw new ConflictError('A Drawing Register user with this email already exists.');

  const passwordHash = await hashPassword(password);
  return DrawingRegisterUser.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    status: status || 'Active',
    jobTitle: jobTitle || '',
  });
}

/** Profile edit (name/email/status/jobTitle) — password changes go through resetPassword below, never here. */
async function updateUser(id, updates) {
  const user = await getUserById(id);

  if (updates.email !== undefined) {
    const nextEmail = updates.email.toLowerCase();
    if (nextEmail !== user.email) {
      const existing = await DrawingRegisterUser.findOne({ email: nextEmail, _id: { $ne: id } });
      if (existing) throw new ConflictError('A Drawing Register user with this email already exists.');
      user.email = nextEmail;
    }
  }
  if (updates.name !== undefined) user.name = updates.name;
  if (updates.status !== undefined) user.status = updates.status;
  if (updates.jobTitle !== undefined) user.jobTitle = updates.jobTitle;

  await user.save();
  return user;
}

/**
 * Controller-driven password reset — sets a new password directly (no email
 * infrastructure exists in this app for a self-service token flow). Revokes
 * every existing refresh token for the account, matching how MS
 * Publishing's own resetPassword forces a fresh sign-in after a reset.
 */
async function resetPassword(id, newPassword) {
  const user = await getUserById(id);
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await DrawingRegisterRefreshToken.updateMany({ user: user._id }, { revoked: true });
  return user;
}

module.exports = { listUsers, getUserById, createUser, updateUser, resetPassword };
