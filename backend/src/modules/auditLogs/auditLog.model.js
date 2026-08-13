const mongoose = require('mongoose');

const AUDIT_ACTIONS = [
  'login',
  'upload',
  'edit',
  'review',
  'approve',
  'reject',
  'publish',
  'archive',
  'download',
  'preview',
  'delete',
  'reassign',
  'bulk_import',
  'sso_login',
  'sso_signup',
  'sso_link',
  'sso_unlink',
];

const auditLogSchema = new mongoose.Schema(
  {
    // Nullable: the public Read Site logs preview/download events without a
    // logged-in user, since anonymous staff can browse published documents.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    targetType: {
      type: String,
      enum: ['document', 'user', 'drawingRegisterUser', 'auth', 'department', 'discipline', 'contactMessage'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { AuditLog, AUDIT_ACTIONS };
