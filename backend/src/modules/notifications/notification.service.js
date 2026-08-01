const { Notification } = require('./notification.model');
const { User } = require('../users/user.model');
const { NotFoundError } = require('../../common/errors');
const logger = require('../../utils/logger');

async function listForUser(userId) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
}

async function countUnread(userId) {
  return Notification.countDocuments({ user: userId, read: false });
}

async function create({ user, type, message, relatedDocument }) {
  return Notification.create({ user, type, message, relatedDocument });
}

/**
 * Fire-and-forget: notifies a single user by id. Never throws into the
 * caller's workflow action — a notification failure shouldn't fail the
 * document transition that triggered it.
 */
async function notifyUser(userId, { type, message, relatedDocument }) {
  if (!userId) return;
  try {
    await Notification.create({ user: userId, type, message, relatedDocument });
  } catch (err) {
    logger.error({ err, userId, type }, 'failed to create notification');
  }
}

/** Fans a notification out to every user holding `role` (e.g. every Controller). */
async function notifyRole(role, { type, message, relatedDocument, excludeUserId }) {
  try {
    const users = await User.find({ role, status: { $ne: 'Inactive' } }, '_id');
    const targets = users.map((u) => u._id.toString()).filter((id) => id !== String(excludeUserId ?? ''));
    if (targets.length === 0) return;
    await Notification.insertMany(
      targets.map((userId) => ({ user: userId, type, message, relatedDocument }))
    );
  } catch (err) {
    logger.error({ err, role, type }, 'failed to fan out role notification');
  }
}

async function markRead(id, userId) {
  const notification = await Notification.findOne({ _id: id, user: userId });
  if (!notification) throw new NotFoundError('Notification not found');
  notification.read = true;
  await notification.save();
  return notification;
}

async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
}

module.exports = { listForUser, countUnread, create, notifyUser, notifyRole, markRead, markAllRead };
