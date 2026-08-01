const mongoose = require('mongoose');
const { buildPublicUrl } = require('../../config/r2');

/**
 * Every upload creates a new version — documents are never overwritten.
 * Mongo stores only R2 object metadata, never the file bytes.
 */
const documentVersionSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    versionNumber: { type: String, required: true },
    file: {
      key: { type: String, required: true },
      originalFilename: { type: String, required: true },
      size: { type: Number, required: true },
      mimeType: { type: String, required: true },
      format: { type: String, required: true },
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changeNote: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

// Never expose the raw R2 object key to API responses — only a ready-to-use
// delivery URL, the same shape the frontend already worked with under
// Cloudinary's `secureUrl`.
documentVersionSchema.set('toJSON', {
  transform(doc, ret) {
    if (ret.file) {
      const { key, ...rest } = ret.file;
      ret.file = { ...rest, url: buildPublicUrl(key) };
    }
    return ret;
  },
});

const DocumentVersion = mongoose.model('DocumentVersion', documentVersionSchema);

module.exports = { DocumentVersion };
