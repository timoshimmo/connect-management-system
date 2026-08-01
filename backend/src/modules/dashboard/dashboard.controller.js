const asyncHandler = require('../../utils/asyncHandler');
const dashboardService = require('./dashboard.service');

const summary = asyncHandler(async (req, res) => {
  const stats = await dashboardService.documentSummary(req.user);
  res.json({ role: req.user.role, stats });
});

module.exports = { summary };
