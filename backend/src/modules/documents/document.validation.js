const { z } = require('zod');
const {
  DOCUMENT_TYPES,
  DOCUMENT_LOCATIONS,
  DOCUMENT_STATUSES,
  DOCUMENT_DESTINATIONS,
  ISO_STANDARDS,
} = require('./document.model');
const { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } = require('../../middlewares/upload');
const { MAX_DOCUMENT_REGISTER_BULK_FILES } = require('../../middlewares/bulkUpload');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/** A file already uploaded to R2 via a presigned URL (see /documents/upload-urls) — never raw bytes. */
const fileRefSchema = z.object({
  key: z.string().min(1),
  originalFilename: z.string().min(1),
  size: z.number().int().positive(),
  mimeType: z.string().min(1),
});

const uploadUrlRequestSchema = z.object({
  files: z
    .array(
      z.object({
        filename: z.string().min(1),
        mimeType: z.enum([...ALLOWED_MIME_TYPES]),
        size: z.number().int().positive().max(MAX_FILE_SIZE, `Files must be ${MAX_FILE_SIZE / 1024 / 1024}MB or smaller.`),
      })
    )
    .min(1)
    .max(MAX_DOCUMENT_REGISTER_BULK_FILES, `A single request is limited to ${MAX_DOCUMENT_REGISTER_BULK_FILES} files.`),
});

const addVersionSchema = z.object({
  fileRef: fileRefSchema,
  changeNote: z.string().optional(),
});

/**
 * Fields shared across destinations, plus every destination-specific field
 * as optional at the schema level — requiredness is destination-conditional,
 * enforced below via superRefine rather than the schema shape itself (see
 * requirement 6: "Validation should also change dynamically depending on
 * the selected destination").
 */
const documentFieldsSchema = {
  title: z.string().min(1),
  department: objectId,
  destination: z.enum(DOCUMENT_DESTINATIONS),
  description: z.string().optional(),
  location: z.enum(DOCUMENT_LOCATIONS).optional(),
  // Read Site / Document Register
  type: z.enum(DOCUMENT_TYPES).optional(),
  // Drawing Register
  drawingNumber: z.string().optional(),
  discipline: objectId.optional(),
  area: z.string().optional(),
  revision: z.string().optional(),
  // Document Register — optional even there ("where applicable"). multer only
  // arrays a repeated multipart field when it appears 2+ times, so selecting
  // exactly one ISO standard checkbox arrives as a bare string, not a
  // 1-element array — normalize before validating against the enum.
  isoStandards: z
    .union([z.array(z.enum(ISO_STANDARDS)), z.enum(ISO_STANDARDS)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  isoClauses: z.string().optional(),
};

function requireDestinationFields(data, ctx) {
  if (data.destination === 'Read Site' || data.destination === 'Document Register') {
    if (!data.type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['type'], message: 'Document type is required.' });
    }
  } else if (data.destination === 'Drawing Register') {
    if (!data.drawingNumber?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['drawingNumber'], message: 'Drawing number is required.' });
    }
    if (!data.discipline) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discipline'], message: 'Discipline is required.' });
    }
    if (!data.revision?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['revision'], message: 'Revision is required.' });
    }
  }
}

const createDocumentSchema = z
  .object({
    ...documentFieldsSchema,
    // Create-only — an update's replacement file goes through
    // addVersionSchema/POST /:id/versions instead, never a raw field on PATCH.
    fileRef: fileRefSchema.optional(),
    // Create-only, and deliberately restricted to just 'Published' (not the
    // full DOCUMENT_STATUSES enum) — this is exclusively how Document
    // Register documents skip the review workflow (spec: Controller
    // registers an already-controlled document). Every other status
    // transition goes through its own dedicated endpoint (/submit,
    // /publish, /archive, ...), never a raw status field on create/update.
    status: z.enum(['Published']).optional(),
  })
  .superRefine((data, ctx) => {
    requireDestinationFields(data, ctx);
    if (data.status === 'Published' && data.destination !== 'Document Register') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'Only Document Register documents can be created as already Published.',
      });
    }
  });

// Same destination-conditional rule as create, but every field is optional
// since this is a partial update — the requiredness check only runs when
// `destination` is actually part of this request (the frontend's Edit modal
// always sends the full field set for whichever destination is selected
// alongside it; a PATCH that doesn't touch destination at all — e.g. just
// editing the description — skips the check entirely).
const updateDocumentSchema = z
  .object(documentFieldsSchema)
  .partial()
  .superRefine((data, ctx) => {
    if (data.destination !== undefined) requireDestinationFields(data, ctx);
  });

const assignSchema = z.object({
  reviewer: objectId,
  approver: objectId,
});

const reassignSchema = z
  .object({
    reviewer: objectId.optional(),
    approver: objectId.optional(),
    reason: z.string().min(1, 'A reason is required.'),
  })
  .refine((data) => data.reviewer || data.approver, {
    message: 'Select a new reviewer and/or approver.',
    path: ['reviewer'],
  });

const returnSchema = z.object({
  notes: z.string().optional(),
});

const archiveSchema = z.object({
  reason: z.string().optional(),
});

const listQuerySchema = z.object({
  department: objectId.optional(),
  type: z.enum(DOCUMENT_TYPES).optional(),
  status: z.enum(DOCUMENT_STATUSES).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

module.exports = {
  createDocumentSchema,
  updateDocumentSchema,
  assignSchema,
  reassignSchema,
  returnSchema,
  archiveSchema,
  listQuerySchema,
  objectId,
  fileRefSchema,
  uploadUrlRequestSchema,
  addVersionSchema,
};
