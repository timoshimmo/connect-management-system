const asyncHandler = require('../../utils/asyncHandler');
const notificationService = require('./notification.service');

const list = asyncHandler(async (req, res) => {
  const [items, unreadCount] = await Promise.all([
    notificationService.listForUser(req.user.id),
    notificationService.countUnread(req.user.id),
  ]);
  res.json({ items, unreadCount });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user.id);
  res.json({ notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  res.json({ message: 'All notifications marked as read.' });
});

module.exports = { list, markRead, markAllRead };
