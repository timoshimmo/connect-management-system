const mongoose = require('mongoose');

/**
 * Atomic per-prefix sequence counters for document numbering (e.g. `_id:
 * 'SMS-PO', seq: 6`) — see document.service.js's nextSequence(). Replaces
 * the old "highest existing docId + 1" scan, which is safe for a single
 * writer but can hand out the same number twice under concurrent document
 * creation. `$inc` on a single document is atomic in MongoDB regardless of
 * how many callers hit it simultaneously, so this can't.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = { Counter };
