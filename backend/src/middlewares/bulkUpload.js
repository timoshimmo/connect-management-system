const multer = require('multer');
const { BadRequestError } = require('../common/errors');
const { documentFileFilter, MAX_FILE_SIZE } = require('./upload');

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAX_EXCEL_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BULK_FILES = 50; // matches bulkImport.service.js's MAX_ROWS

/** Accepts just the .xlsx template upload for /bulk-import/parse. */
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_EXCEL_SIZE },
  fileFilter(req, file, cb) {
    if (file.mimetype !== EXCEL_MIME_TYPE) return cb(new BadRequestError('Only .xlsx files are supported'));
    cb(null, true);
  },
});

/**
 * Accepts the batch of document files for /bulk-import/commit. Reuses the
 * exact same PDF/DOC/DOCX filter and per-file size limit as single-document
 * upload (middlewares/upload.js) — only `files` (a count cap) and
 * `fieldSize` are bulk-specific: the commit request also carries a `rows`
 * text field (JSON, one entry per row with its validation errors), which
 * can exceed multer's 1MB default fieldSize for a full 50-row batch.
 */
const bulkFilesUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_BULK_FILES, fieldSize: 5 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

module.exports = { excelUpload, bulkFilesUpload, MAX_BULK_FILES };
