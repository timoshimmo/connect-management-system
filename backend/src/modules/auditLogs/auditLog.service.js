const { AuditLog } = require('./auditLog.model');
const logger = require('../../utils/logger');

/** Fire-and-forget audit log write — never blocks or fails the calling request. */
async function recordAudit({ user, action, targetType, targetId = null, metadata = {} }) {
  try {
    await AuditLog.create({ user, action, targetType, targetId, metadata });
  } catch (err) {
    logger.error({ err, action, targetType }, 'failed to write audit log');
  }
}

async function listAuditLogs({ action, targetType, userId, skip, limit }) {
  const filter = {};
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;
  if (userId) filter.user = userId;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).populate('user', 'name email role'),
    AuditLog.countDocuments(filter),
  ]);
  return { items, total };
}

module.exports = { recordAudit, listAuditLogs };
