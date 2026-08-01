const asyncHandler = require('../../utils/asyncHandler');
const { listAuditLogs } = require('./auditLog.service');
const { parsePagination, paginatedResponse } = require('../../common/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 50, 200);
  const { items, total } = await listAuditLogs({
    action: req.query.action,
    targetType: req.query.targetType,
    userId: req.query.userId,
    skip,
    limit,
  });
  res.json(paginatedResponse(items, total, page, limit));
});

module.exports = { list };
