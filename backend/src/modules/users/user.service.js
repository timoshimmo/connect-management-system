const { User } = require('./user.model');
const { NotFoundError, ConflictError, ForbiddenError } = require('../../common/errors');
const { hashPassword } = require('../../utils/password');
const { inviteUser } = require('../auth/auth.service');
const { notifyUser } = require('../notifications/notification.service');

async function listUsers({ role } = {}) {
  const filter = {};
  if (role) filter.role = role;
  return User.find(filter).sort({ name: 1 }).populate('department', 'name code');
}

async function getUserById(id) {
  const user = await User.findById(id).populate('department', 'name code');
  if (!user) throw new NotFoundError('User not found');
  return user;
}

async function updateUserRole(id, role) {
  const user = await getUserById(id);
  user.role = role;
  await user.save();
  return user;
}

/**
 * The admin-set `password` still becomes the account's real password (the
 * Create User form is unchanged) — inviteUser() additionally emails the new
 * user a set-password link, so they never actually need to learn or use
 * the password the admin typed. A failed invite email never fails account
 * creation itself (sendMail/inviteUser already swallow their own errors).
 *
 * `password` is optional — a Controller can create a placeholder account
 * for someone who'll only ever sign in with Microsoft SSO (see
 * auth/microsoft.service.js). Skipping both hashPassword and inviteUser in
 * that case is deliberate: there's no password to invite them to set, and
 * they'll get a real account the moment they first sign in with Microsoft
 * and it auto-links by matching email.
 */
async function createUser({ name, email, password, role, department, status }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ConflictError('A user with this email already exists.');

  const passwordHash = password ? await hashPassword(password) : null;
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role || null,
    department: department || null,
    status: status || 'Active',
  });
  if (password) await inviteUser(user);
  return getUserById(user._id);
}

/**
 * Full profile edit (name/email/department/role/status/jobTitle) —
 * deliberately excludes password, which stays a separate reset/forgot flow.
 * Deactivating a user here (status: 'Inactive') only blocks future logins
 * (see auth.service.js's login check) — the account and its audit history
 * are never deleted.
 *
 * `actingUserId` is the Controller making the request — a Controller can't
 * deactivate their own account, since that would lock every Controller out
 * with no one left able to reactivate anyone.
 */
async function updateUser(id, updates, actingUserId) {
  if (updates.status === 'Inactive' && actingUserId && String(actingUserId) === String(id)) {
    throw new ForbiddenError('You cannot deactivate your own account.');
  }

  const user = await User.findById(id);
  if (!user) throw new NotFoundError('User not found');

  const becameInactive = updates.status === 'Inactive' && user.status !== 'Inactive';
  const roleChanged = updates.role !== undefined && String(updates.role) !== String(user.role);
  const departmentChanged = updates.department !== undefined && String(updates.department || '') !== String(user.department || '');

  if (updates.email !== undefined) {
    const nextEmail = updates.email.toLowerCase();
    if (nextEmail !== user.email) {
      const existing = await User.findOne({ email: nextEmail, _id: { $ne: id } });
      if (existing) throw new ConflictError('A user with this email already exists.');
      user.email = nextEmail;
    }
  }
  if (updates.name !== undefined) user.name = updates.name;
  if (updates.role !== undefined) user.role = updates.role;
  if (updates.department !== undefined) user.department = updates.department || null;
  if (updates.status !== undefined) user.status = updates.status;
  if (updates.jobTitle !== undefined) user.jobTitle = updates.jobTitle;

  await user.save();

  if (becameInactive) {
    await notifyUser(user._id, {
      type: 'account_deactivated',
      message: 'Your account has been deactivated. Contact your Document Controller if you believe this is a mistake.',
    });
  } else if (roleChanged || departmentChanged) {
    await notifyUser(user._id, {
      type: 'access_changed',
      message: 'Your role or department was updated by a Document Controller.',
    });
  }

  return getUserById(user._id);
}

module.exports = { listUsers, getUserById, updateUserRole, createUser, updateUser };
