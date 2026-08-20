const multer = require('multer');
const { randomUUID } = require('crypto');
const contentDisposition = require('../utils/contentDisposition');
const { PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
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

/** Shared by `upload` below and bulkUpload.js's `bulkFilesUpload` — same PDF/DOC/DOCX restriction either way. */
function documentFileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new BadRequestError('Only PDF and Word (.doc/.docx) files are supported'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: documentFileFilter,
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

const UPLOAD_URL_EXPIRES_IN = 5 * 60; // seconds — long enough for a real upload, short enough a leaked URL isn't a long-lived write hole

/** Same mimetype→extension resolution as `resolveExtension`, but for a client-declared mimetype/filename pair rather than a multer file object. */
function resolveExtensionFromMime(mimeType, fallbackFilename) {
  if (MIME_TO_EXT[mimeType]) return MIME_TO_EXT[mimeType];
  const fromName = fallbackFilename?.split('.').pop()?.toLowerCase();
  return fromName || 'bin';
}

/**
 * Mints a short-lived presigned PUT URL so the browser can upload a file
 * directly to R2, bypassing our serverless function's request body entirely
 * (Vercel hard-caps that at ~4.5MB, which broke bulk document uploads).
 *
 * The key is an opaque UUID, not the docId-based
 * "documents/{dept}/{docId}-v{version}.{ext}" scheme `addVersion` uses below
 * — docId/versionNumber are only known *after* the Document row exists, but
 * a presigned URL needs a fixed key decided up front. The key is never
 * user-facing (DocumentVersion's toJSON transform strips it, only a derived
 * public `url` is ever returned), so this is a pure internal storage detail.
 *
 * Content-Disposition is bound into the object itself (not just returned to
 * the client as metadata) so the *public* delivery URL — a different origin
 * from the app — serves the real filename via R2's own response header.
 * Browsers deliberately ignore an `<a download>` attribute's suggested name
 * for cross-origin links (anti-spoofing), so without this every download
 * would save as the opaque UUID regardless of what the frontend sets.
 */
async function createPresignedUploadUrl({ filename, mimeType }) {
  const ext = resolveExtensionFromMime(mimeType, filename);
  const key = `documents/uploads/${randomUUID()}.${ext}`;
  const disposition = contentDisposition.create(filename || `file.${ext}`);
  const uploadUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: env.r2.bucketName,
      Key: key,
      ContentType: mimeType,
      ContentDisposition: disposition,
    }),
    { expiresIn: UPLOAD_URL_EXPIRES_IN }
  );
  return { key, uploadUrl, contentDisposition: disposition };
}

/**
 * Confirms a client-claimed upload actually landed in R2, and its real size
 * matches what was declared, before we trust it enough to write a permanent
 * DocumentVersion record — otherwise a client could hand the server an
 * arbitrary/stale/never-uploaded key.
 */
async function headObjectOrThrow({ key, expectedSize }) {
  let head;
  try {
    head = await r2Client.send(new HeadObjectCommand({ Bucket: env.r2.bucketName, Key: key }));
  } catch {
    throw new BadRequestError('The uploaded file could not be found in storage — please try uploading again.');
  }
  if (typeof expectedSize === 'number' && head.ContentLength !== expectedSize) {
    throw new BadRequestError('The uploaded file size does not match what was declared.');
  }
  return head;
}

module.exports = {
  upload,
  uploadBufferToR2,
  resolveExtension,
  resolveExtensionFromMime,
  createPresignedUploadUrl,
  headObjectOrThrow,
  documentFileFilter,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
