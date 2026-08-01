const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { r2Client } = require('../config/r2');
const env = require('../config/env');
const { BadRequestError } = require('../common/errors');

const MIME_TO_EXT = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_TO_EXT));

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB, matches the frontend's upload copy

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new BadRequestError('Only PDF and Word (.doc/.docx) files are supported'));
    }
    cb(null, true);
  },
});

/** Resolves a reliable file extension for an uploaded file — from its mimetype first, falling back to its original filename. */
function resolveExtension(file) {
  if (MIME_TO_EXT[file.mimetype]) return MIME_TO_EXT[file.mimetype];
  const fromName = file.originalname?.split('.').pop()?.toLowerCase();
  return fromName || 'bin';
}

/**
 * Uploads a buffer to Cloudflare R2 (S3-compatible) under `key`. Mongo only
 * ever stores the returned key + the file's own metadata (original filename,
 * size, mime type) — never the file bytes — see documentVersion.model.js /
 * drawingVersion.model.js's `file` sub-document and its toJSON transform,
 * which turns a stored key back into a delivery URL via config/r2.js's
 * buildPublicUrl and never serializes the key itself to API responses.
 */
async function uploadBufferToR2(buffer, { key, contentType }) {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.r2.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return { key };
}

module.exports = { upload, uploadBufferToR2, resolveExtension };
