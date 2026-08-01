const { Document } = require('../documents/document.model');

async function documentSummary(user) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (user.role === 'author') {
    const [drafts, pending, publishedByMe] = await Promise.all([
      Document.countDocuments({ author: user.id, status: 'Draft' }),
      Document.countDocuments({
        author: user.id,
        status: { $in: ['Pending Assignment', 'Under Review', 'Pending Approval', 'Pending Publishing'] },
      }),
      Document.countDocuments({ author: user.id, status: 'Published' }),
    ]);
    return { myDrafts: drafts, inWorkflow: pending, publishedByMe };
  }

  if (user.role === 'reviewer') {
    const [assigned, completed] = await Promise.all([
      Document.countDocuments({ reviewer: user.id, status: 'Under Review' }),
      Document.countDocuments({ reviewer: user.id, status: { $nin: ['Draft', 'Under Review'] } }),
    ]);
    return { assignedToMe: assigned, completedReviews: completed };
  }

  if (user.role === 'approver') {
    const [pendingApproval, dueForReview] = await Promise.all([
      Document.countDocuments({ approver: user.id, status: 'Pending Approval' }),
      Document.countDocuments({ approver: user.id, status: 'Published', nextReviewDate: { $lte: now } }),
    ]);
    return { pendingApproval, dueForReview };
  }

  // controller — full visibility
  const [total, pendingAssignment, pendingPublishing, publishedThisMonth, dueForReview] = await Promise.all([
    Document.countDocuments({}),
    Document.countDocuments({ status: 'Pending Assignment' }),
    Document.countDocuments({ status: 'Pending Publishing' }),
    Document.countDocuments({ status: 'Published', publishedAt: { $gte: startOfMonth } }),
    Document.countDocuments({ status: 'Published', nextReviewDate: { $lte: now } }),
  ]);
  return { total, pendingAssignment, pendingPublishing, publishedThisMonth, dueForReview };
}

module.exports = { documentSummary };
