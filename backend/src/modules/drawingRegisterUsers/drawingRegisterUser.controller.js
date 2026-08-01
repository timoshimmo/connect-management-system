const asyncHandler = require('../../utils/asyncHandler');
const drawingRegisterUserService = require('./drawingRegisterUser.service');
const { recordAudit } = require('../auditLogs/auditLog.service');
const { notifyRole } = require('../notifications/notification.service');

const list = asyncHandler(async (req, res) => {
  const users = await drawingRegisterUserService.listUsers();
  res.json({ items: users.map((u) => u.toPublicJSON()) });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await drawingRegisterUserService.getUserById(req.params.id);
  res.json({ user: user.toPublicJSON() });
});

const create = asyncHandler(async (req, res) => {
  const user = await drawingRegisterUserService.createUser(req.body);
  await recordAudit({
    user: req.user.id,
    action: 'edit',
    targetType: 'drawingRegisterUser',
    targetId: user._id,
    metadata: { created: true },
  });
  await notifyRole('controller', {
    type: 'drawing_register_user_created',
    message: `${user.name} was added as a Drawing Register user.`,
    excludeUserId: req.user.id,
  });
  res.status(201).json({ user: user.toPublicJSON() });
});

const update = asyncHandler(async (req, res) => {
  const user = await drawingRegisterUserService.updateUser(req.params.id, req.body);
  await recordAudit({
    user: req.user.id,
    action: 'edit',
    targetType: 'drawingRegisterUser',
    targetId: user._id,
    metadata: { updatedFields: Object.keys(req.body) },
  });
  res.json({ user: user.toPublicJSON() });
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await drawingRegisterUserService.resetPassword(req.params.id, req.body.password);
  await recordAudit({
    user: req.user.id,
    action: 'edit',
    targetType: 'drawingRegisterUser',
    targetId: user._id,
    metadata: { passwordReset: true },
  });
  res.json({ user: user.toPublicJSON() });
});

module.exports = { list, getOne, create, update, resetPassword };
