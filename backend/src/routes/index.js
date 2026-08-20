const express = require('express');

const router = express.Router();

// TEMPORARY diagnostic: require('./routes') was resolving to an empty {}
// on Vercel instead of throwing, meaning one of the requires below fails
// during load and Vercel's own module loader swallows the error instead of
// propagating it. Wrapping each require individually forces that error to
// surface with the exact module name attached. Revert to the plain
// router.use('/x', require('../modules/...')) list once the cause is found.
function safeRequire(name, path) {
  try {
    return require(path);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[routes] failed to require "${name}" (${path}):`, err && err.stack ? err.stack : err);
    throw new Error(`Failed to load route module "${name}" (${path}): ${err && err.message}`);
  }
}

router.use('/auth', safeRequire('auth', '../modules/auth/auth.routes'));
router.use('/users', safeRequire('users', '../modules/users/user.routes'));
router.use('/roles', safeRequire('roles', '../modules/roles/roles.routes'));
router.use('/departments', safeRequire('departments', '../modules/departments/department.routes'));
router.use('/disciplines', safeRequire('disciplines', '../modules/disciplines/discipline.routes'));
router.use('/documents', safeRequire('documents', '../modules/documents/document.routes'));
router.use('/comments', safeRequire('comments', '../modules/comments/comment.routes'));
router.use('/notifications', safeRequire('notifications', '../modules/notifications/notification.routes'));
router.use('/audit-logs', safeRequire('audit-logs', '../modules/auditLogs/auditLog.routes'));
router.use('/dashboard', safeRequire('dashboard', '../modules/dashboard/dashboard.routes'));
router.use('/read-site', safeRequire('read-site', '../modules/readSite/readSite.routes'));
router.use('/document-register', safeRequire('document-register', '../modules/documentRegister/documentRegister.routes'));
router.use('/drawing-register-auth', safeRequire('drawing-register-auth', '../modules/drawingRegisterAuth/drawingRegisterAuth.routes'));
router.use('/drawing-register-users', safeRequire('drawing-register-users', '../modules/drawingRegisterUsers/drawingRegisterUser.routes'));
router.use('/drawing-register', safeRequire('drawing-register', '../modules/drawingRegisterContent/drawingRegisterContent.routes'));

module.exports = router;
