const mongoose = require('mongoose');

const SOURCES = ['read-site', 'drawing-register'];
const STATUSES = ['New', 'Resolved'];

/**
 * "Contact Document Controller" submissions from either public storefront.
 * Read Site is fully unauthenticated, so `fromDrawingRegisterUser` is only
 * ever set for submissions made from the (gated) Drawing Register — there is
 * no equivalent identity to capture for an anonymous Read Site visitor.
 */
const contactMessageSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    relatedDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    source: { type: String, enum: SOURCES, required: true },
    fromDrawingRegisterUser: { type: mongoose.Schema.Types.ObjectId, ref: 'DrawingRegisterUser', default: null },
    status: { type: String, enum: STATUSES, default: 'New' },
  },
  { timestamps: true }
);

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

module.exports = { ContactMessage, SOURCES, STATUSES };
