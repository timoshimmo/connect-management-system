const asyncHandler = require('../../utils/asyncHandler');
const commentService = require('./comment.service');

const list = asyncHandler(async (req, res) => {
  const comments = await commentService.listComments(req.query);
  res.json({ items: comments });
});

const create = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment({ ...req.body, authorId: req.user.id });
  res.status(201).json({ comment });
});

module.exports = { list, create };
