const { ForbiddenError } = require('../common/errors');

/**
 * Reusable authorization middleware — the backend mirror of the frontend's
 * RoleGuard. Usage: `requireRole('controller')` or `requireRole('approver', 'controller')`.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`This action requires one of these roles: ${allowedRoles.join(', ')}`));
    }
    next();
  };
}

module.exports = { requireRole };
