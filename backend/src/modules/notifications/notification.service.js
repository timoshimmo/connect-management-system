const { Notification } = require('./notification.model');
const { User } = require('../users/user.model');
const { NotFoundError } = require('../../common/errors');
const { sendMail } = require('../../utils/mailer');
const logger = require('../../utils/logger');

/**
 * Friendly email subject per notification `type` — covers every category
 * requirement 5 lists (document assignment, comments, workflow,
 * approval/rejection) since they all funnel through notifyUser/notifyRole
 * below. Unmapped/future types still send with a generic subject rather
 * than being silently skipped.
 */
const NOTIFICATION_EMAIL_SUBJECTS = {
  document_submitted: 'Document Submitted',
  review_assigned: 'You’ve Been Assigned to Review',
  approval_pending: 'Awaiting Your Approval',
  changes_requested: 'Changes Requested',
  document_approved: 'Document Approved',
  document_rejected: 'Document Rejected',
  document_published: 'Document Published',
  document_archived: 'Document Archived',
  document_restored: 'Document Restored',
  document_reassigned: 'Document Reassigned',
  reviewer_unassigned: 'Reviewer Reassigned',
  approver_unassigned: 'Approver Reassigned',
  comment_added: 'New Comment',
  contact_message: 'New Message from Document Controller Contact Form',
  user_created: 'New User Created',
  drawing_register_user_created: 'New Drawing Register User',
};

function emailSubjectFor(type) {
  return `STACconnect — ${NOTIFICATION_EMAIL_SUBJECTS[type] || 'Notification'}`;
}

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
 * Fire-and-forget: notifies a single user by id — creates the in-app
 * Notification (bell) and, independently, emails them (best-effort; a
 * missing SMTP config or a delivery failure never affects the bell, and a
 * notification failure never fails the caller's workflow action). Skips
 * emailing Inactive accounts.
 */
async function notifyUser(userId, { type, message, relatedDocument }) {
  if (!userId) return;
  try {
    await Notification.create({ user: userId, type, message, relatedDocument });
  } catch (err) {
    logger.error({ err, userId, type }, 'failed to create notification');
  }
  try {
    const user = await User.findById(userId, 'email status');
    if (user && user.status !== 'Inactive') {
      await sendMail({ to: user.email, subject: emailSubjectFor(type), text: message });
    }
  } catch (err) {
    logger.error({ err, userId, type }, 'failed to email notification');
  }
}

/** Fans a notification out to every user holding `role` (e.g. every Controller) — in-app and by email. */
async function notifyRole(role, { type, message, relatedDocument, excludeUserId }) {
  try {
    const users = await User.find({ role, status: { $ne: 'Inactive' } }, '_id email');
    const targets = users.filter((u) => u._id.toString() !== String(excludeUserId ?? ''));
    if (targets.length === 0) return;
    await Notification.insertMany(targets.map((u) => ({ user: u._id, type, message, relatedDocument })));
    await Promise.all(
      targets.map((u) =>
        sendMail({ to: u.email, subject: emailSubjectFor(type), text: message }).catch((err) =>
          logger.error({ err, userId: u._id, type }, 'failed to email role notification')
        )
      )
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
