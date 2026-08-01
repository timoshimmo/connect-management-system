const { User } = require('./user.model');
const { NotFoundError, ConflictError } = require('../../common/errors');
const { hashPassword } = require('../../utils/password');

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

async function createUser({ name, email, password, role, department, status }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ConflictError('A user with this email already exists.');

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    department: department || null,
    status: status || 'Active',
  });
  return getUserById(user._id);
}

/**
 * Full profile edit (name/email/department/role/status/jobTitle) —
 * deliberately excludes password, which stays a separate reset/forgot flow.
 * Deactivating a user here (status: 'Inactive') only blocks future logins
 * (see auth.service.js's login check) — the account and its audit history
 * are never deleted.
 */
async function updateUser(id, updates) {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError('User not found');

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
  return getUserById(user._id);
}

module.exports = { listUsers, getUserById, updateUserRole, createUser, updateUser };
