const { Comment } = require('./comment.model');
const { Document } = require('../documents/document.model');
const { User } = require('../users/user.model');
const { notifyUser } = require('../notifications/notification.service');

async function listComments({ targetType, targetId }) {
  return Comment.find({ targetType, targetId }).sort({ createdAt: 1 }).populate('author', 'name email role');
}

const COMMENT_PREVIEW_LENGTH = 100;

/**
 * Notifies everyone currently involved in the document's workflow — author,
 * reviewer, approver — plus every Controller, excluding whoever just posted
 * the comment. Each recipient is notified at most once even if they hold
 * more than one of those roles (e.g. a Controller who authored the
 * document).
 */
async function notifyCommentParticipants({ targetId, body, commenter }) {
  const target = await Document.findById(targetId);
  if (!target) return;

  const preview = body.length > COMMENT_PREVIEW_LENGTH ? `${body.slice(0, COMMENT_PREVIEW_LENGTH)}…` : body;
  const message = `${commenter.name} commented on "${target.title}" (${target.docId}): "${preview}"`;

  const controllers = await User.find({ role: 'controller', status: { $ne: 'Inactive' } }, '_id');

  const seen = new Set([commenter._id.toString()]);
  for (const userId of [target.author, target.reviewer, target.approver, ...controllers.map((c) => c._id)]) {
    if (!userId) continue;
    const id = userId.toString();
    if (seen.has(id)) continue;
    seen.add(id);
    await notifyUser(id, { type: 'comment_added', message, relatedDocument: target._id });
  }
}

async function createComment({ targetType, targetId, body, authorId }) {
  const comment = await Comment.create({ targetType, targetId, body, author: authorId });
  await comment.populate('author', 'name email role');
  if (targetType === 'document') {
    await notifyCommentParticipants({ targetId, body, commenter: comment.author });
  }
  return comment;
}

module.exports = { listComments, createComment };
