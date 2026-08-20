const express = require('express');

// Assigned immediately, before any router.use() calls run, rather than
// reassigned at the end of the file — a late `module.exports = router`
// (after other statements already executed) was consistently resolving to
// an empty {} for whoever required this file on Vercel specifically, even
// though every individual route module below loaded without error. All
// `.use()` calls below mutate this same already-exported object in place.
const router = express.Router();
module.exports = router;

// Each require below MUST stay a static string literal — Vercel's build
// statically traces require('literal') calls to decide which files to
// include in the deployed function bundle. Passing the path through a
// variable/function parameter (as an earlier diagnostic version of this
// file did) is invisible to that tracer, so the traced-out modules
// silently vanish from the deployment with a "Cannot find module" error
// at runtime — a bug in the diagnostic itself, not the original issue.
function safeUse(name, mod) {
  if (typeof mod !== 'function') {
    // eslint-disable-next-line no-console
    console.error(`[routes] "${name}" did not resolve to a router — got ${typeof mod}:`, mod);
    throw new Error(`Route module "${name}" is not a function (got ${typeof mod})`);
  }
  return mod;
}

router.use('/auth', safeUse('auth', require('../modules/auth/auth.routes')));
router.use('/users', safeUse('users', require('../modules/users/user.routes')));
router.use('/roles', safeUse('roles', require('../modules/roles/roles.routes')));
router.use('/departments', safeUse('departments', require('../modules/departments/department.routes')));
router.use('/disciplines', safeUse('disciplines', require('../modules/disciplines/discipline.routes')));
router.use('/documents', safeUse('documents', require('../modules/documents/document.routes')));
router.use('/comments', safeUse('comments', require('../modules/comments/comment.routes')));
router.use('/notifications', safeUse('notifications', require('../modules/notifications/notification.routes')));
router.use('/audit-logs', safeUse('audit-logs', require('../modules/auditLogs/auditLog.routes')));
router.use('/dashboard', safeUse('dashboard', require('../modules/dashboard/dashboard.routes')));
router.use('/read-site', safeUse('read-site', require('../modules/readSite/readSite.routes')));
router.use('/document-register', safeUse('document-register', require('../modules/documentRegister/documentRegister.routes')));
router.use('/drawing-register-auth', safeUse('drawing-register-auth', require('../modules/drawingRegisterAuth/drawingRegisterAuth.routes')));
router.use('/drawing-register-users', safeUse('drawing-register-users', require('../modules/drawingRegisterUsers/drawingRegisterUser.routes')));
router.use('/drawing-register', safeUse('drawing-register', require('../modules/drawingRegisterContent/drawingRegisterContent.routes')));
