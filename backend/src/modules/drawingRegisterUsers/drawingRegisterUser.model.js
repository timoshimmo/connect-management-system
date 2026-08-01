const mongoose = require('mongoose');

const STATUSES = ['Active', 'Inactive'];

/**
 * Drawing Register viewer accounts — deliberately a separate collection from
 * `User` (MS Publishing's author/reviewer/approver/controller accounts).
 * These accounts have no role/department/workflow capabilities at all: they
 * can only sign in and browse/search/preview/download whatever documents
 * were routed to the Drawing Register (see document.model.js's `destination`
 * field). Managed exclusively by MS Publishing Controllers — see
 * drawingRegisterUser.routes.js — never self-service beyond login.
 */
const drawingRegisterUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: STATUSES, default: 'Active' },
    jobTitle: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

drawingRegisterUserSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    status: this.status,
    jobTitle: this.jobTitle || '',
    createdAt: this.createdAt,
  };
};

const DrawingRegisterUser = mongoose.model('DrawingRegisterUser', drawingRegisterUserSchema);

module.exports = { DrawingRegisterUser, STATUSES };
