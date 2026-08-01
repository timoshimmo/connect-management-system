const asyncHandler = require('../../utils/asyncHandler');
const userService = require('./user.service');
const { recordAudit } = require('../auditLogs/auditLog.service');
const { notifyRole } = require('../notifications/notification.service');

const list = asyncHandler(async (req, res) => {
  const users = await userService.listUsers({ role: req.query.role });
  res.json({ items: users.map((u) => u.toPublicJSON()) });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json({ user: user.toPublicJSON() });
});

const updateRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.body.role);
  await recordAudit({
    user: req.user.id,
    action: 'edit',
    targetType: 'user',
    targetId: user._id,
    metadata: { newRole: user.role },
  });
  res.json({ user: user.toPublicJSON() });
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  await recordAudit({
    user: req.user.id,
    action: 'edit',
    targetType: 'user',
    targetId: user._id,
    metadata: { updatedFields: Object.keys(req.body) },
  });
  res.json({ user: user.toPublicJSON() });
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  await recordAudit({
    user: req.user.id,
    action: 'edit',
    targetType: 'user',
    targetId: user._id,
    metadata: { created: true, role: user.role },
  });
  await notifyRole('controller', {
    type: 'user_created',
    message: `${user.name} was added as a new ${user.role}.`,
    excludeUserId: req.user.id,
  });
  res.status(201).json({ user: user.toPublicJSON() });
});

module.exports = { list, getOne, updateRole, update, create };
