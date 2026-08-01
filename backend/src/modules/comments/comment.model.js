const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['document'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);

module.exports = { Comment };
