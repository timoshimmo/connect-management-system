const mongoose = require('mongoose');

const DOCUMENT_STATUSES = [
  'Draft',
  'Pending Assignment',
  'Under Review',
  'Pending Approval',
  'Pending Publishing',
  'Published',
  'Archived',
];

const DOCUMENT_TYPES = ['Policy', 'Procedure', 'Standard', 'Work Instruction', 'Form'];

const DOCUMENT_LOCATIONS = ['Onshore', 'Offshore – Mayo ABO', 'Both'];

/**
 * Where a document is published once approved. Read Site is the public,
 * unauthenticated storefront; Drawing Register is a separately-authenticated
 * storefront for the same underlying Document/DocumentVersion pipeline — see
 * readSite.service.js, which both /read-site and /drawing-register routes
 * call with a different `destination` filter.
 */
const DOCUMENT_DESTINATIONS = ['Read Site', 'Drawing Register'];

const documentSchema = new mongoose.Schema(
  {
    docId: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    type: { type: String, enum: DOCUMENT_TYPES, required: true },
    status: { type: String, enum: DOCUMENT_STATUSES, default: 'Draft' },
    currentVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentVersion', default: null },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    description: { type: String, default: '' },
    location: { type: String, enum: DOCUMENT_LOCATIONS, default: 'Onshore' },
    destination: { type: String, enum: DOCUMENT_DESTINATIONS, required: true, default: 'Read Site' },
    notes: { type: String, default: '' },
    // True while this Draft is a reviewer hand-back rather than a fresh,
    // never-submitted draft — lets the frontend tell "My Drafts" and
    // "Returned to Me" apart. Cleared again on submit.
    returned: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    nextReviewDate: { type: Date, default: null },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    archivedAt: { type: Date, default: null },
    archiveReason: { type: String, default: '' },
  },
  { timestamps: true }
);

documentSchema.index({ title: 'text', docId: 'text' });

const Document = mongoose.model('Document', documentSchema);

module.exports = { Document, DOCUMENT_STATUSES, DOCUMENT_TYPES, DOCUMENT_LOCATIONS, DOCUMENT_DESTINATIONS };
