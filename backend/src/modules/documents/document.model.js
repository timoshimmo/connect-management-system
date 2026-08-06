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

const DOCUMENT_TYPES = [
  'Manual',
  'Policy',
  'Procedure',
  'Standard',
  'Goal',
  'Org Chart',
  'Policy Change',
  'Functional Description',
  'Form',
];

/**
 * Doc ID prefix per type (Read Site documents only — Drawing Register
 * documents use their own user-entered `drawingNumber` field instead and
 * keep the department/year docId scheme, since they have no `type`). See
 * document.service.js's nextDocIdForType.
 */
const DOCUMENT_TYPE_PREFIXES = {
  Manual: 'SMS-MP',
  Policy: 'SMS-PO',
  Procedure: 'SMS-PR',
  Standard: 'SMS-ST',
  Goal: 'SMS-GL',
  'Org Chart': 'SMS-OC',
  'Policy Change': 'SMS-PC',
  'Functional Description': 'SMS-FD',
  Form: 'SMS-FR',
};

/**
 * SMS-PO 0001–0003 are reserved for special company documents created
 * manually later — automatic Policy numbering starts at 0004. Every other
 * type starts at 001. See nextDocIdForType.
 */
const POLICY_RESERVED_SEQUENCE = 3;

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
    // Required for Read Site documents, not applicable to Drawing Register
    // ones (enforced in document.validation.js, conditional on destination —
    // not a blanket Mongoose `required` since one schema now serves both).
    type: { type: String, enum: DOCUMENT_TYPES, default: null },
    status: { type: String, enum: DOCUMENT_STATUSES, default: 'Draft' },
    currentVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentVersion', default: null },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    description: { type: String, default: '' },
    location: { type: String, enum: DOCUMENT_LOCATIONS, default: 'Onshore' },
    destination: { type: String, enum: DOCUMENT_DESTINATIONS, required: true, default: 'Read Site' },
    // Drawing Register-only metadata (required there, unused for Read Site
    // documents — see document.validation.js's destination-conditional
    // requiredness). `title` and `department` are shared by both branches
    // and stay as the single fields above rather than duplicating them.
    drawingNumber: { type: String, default: '' },
    discipline: { type: mongoose.Schema.Types.ObjectId, ref: 'Discipline', default: null },
    area: { type: String, default: '' },
    revision: { type: String, default: '' },
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

module.exports = {
  Document,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_PREFIXES,
  POLICY_RESERVED_SEQUENCE,
  DOCUMENT_LOCATIONS,
  DOCUMENT_DESTINATIONS,
};
