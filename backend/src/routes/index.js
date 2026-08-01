const express = require('express');

const router = express.Router();

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/users', require('../modules/users/user.routes'));
router.use('/roles', require('../modules/roles/roles.routes'));
router.use('/departments', require('../modules/departments/department.routes'));
router.use('/documents', require('../modules/documents/document.routes'));
router.use('/comments', require('../modules/comments/comment.routes'));
router.use('/notifications', require('../modules/notifications/notification.routes'));
router.use('/audit-logs', require('../modules/auditLogs/auditLog.routes'));
router.use('/dashboard', require('../modules/dashboard/dashboard.routes'));
router.use('/read-site', require('../modules/readSite/readSite.routes'));
router.use('/drawing-register-auth', require('../modules/drawingRegisterAuth/drawingRegisterAuth.routes'));
router.use('/drawing-register-users', require('../modules/drawingRegisterUsers/drawingRegisterUser.routes'));
router.use('/drawing-register', require('../modules/drawingRegisterContent/drawingRegisterContent.routes'));

module.exports = router;
