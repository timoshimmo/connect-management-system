const mongoose = require('mongoose');

const ROLES = ['author', 'reviewer', 'approver', 'controller'];
const STATUSES = ['Active', 'Inactive'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional — an SSO-only account (Microsoft) never sets this. At least
    // one of passwordHash/microsoftId must be set; enforced in application
    // code (user.service.js/microsoft.service.js), not the schema, since a
    // brand-new SSO signup and a Controller-created placeholder account are
    // both legitimately password-less at creation time.
    passwordHash: { type: String, required: false, default: null },
    // Optional — null means "Pending": a first-time Microsoft SSO signup
    // with no role assigned yet. Such a user can authenticate but is denied
    // every role-gated action until a Controller assigns a real role.
    role: { type: String, enum: ROLES, required: false, default: null },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    status: { type: String, enum: STATUSES, default: 'Active' },
    jobTitle: { type: String, default: '', trim: true },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },
    // Microsoft Entra ID (Azure AD) SSO linkage — see auth/microsoft.service.js.
    // `microsoftId` is the token's `oid` claim: stable and unique per
    // tenant+app, unlike email (which a user could change in Entra).
    // `sparse: true` lets every password-only account keep this null
    // without violating the unique index.
    microsoftId: { type: String, default: null, unique: true, sparse: true },
    microsoftTenantId: { type: String, default: null },
    microsoftLinkedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const department = this.department;
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    jobTitle: this.jobTitle || '',
    department:
      department && typeof department === 'object' && department.name
        ? { id: department._id.toString(), name: department.name, code: department.code }
        : department
          ? department.toString()
          : null,
    createdAt: this.createdAt,
    // Derived, not stored redundantly — the frontend uses these to render
    // Authentication status (Profile page, User Management table) without
    // ever needing to know about passwordHash/microsoftId directly.
    hasPassword: Boolean(this.passwordHash),
    microsoftLinked: Boolean(this.microsoftId),
  };
};

const User = mongoose.model('User', userSchema);

module.exports = { User, ROLES, STATUSES };
