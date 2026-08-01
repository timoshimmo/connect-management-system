const mongoose = require('mongoose');

const ROLES = ['author', 'reviewer', 'approver', 'controller'];
const STATUSES = ['Active', 'Inactive'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    status: { type: String, enum: STATUSES, default: 'Active' },
    jobTitle: { type: String, default: '', trim: true },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },
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
  };
};

const User = mongoose.model('User', userSchema);

module.exports = { User, ROLES, STATUSES };
