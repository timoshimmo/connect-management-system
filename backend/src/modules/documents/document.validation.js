const { z } = require('zod');
const { DOCUMENT_TYPES, DOCUMENT_LOCATIONS, DOCUMENT_STATUSES, DOCUMENT_DESTINATIONS } = require('./document.model');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/**
 * Fields shared by both destinations, plus every destination-specific field
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
  // Read Site
  type: z.enum(DOCUMENT_TYPES).optional(),
  // Drawing Register
  drawingNumber: z.string().optional(),
  discipline: objectId.optional(),
  area: z.string().optional(),
  revision: z.string().optional(),
};

function requireDestinationFields(data, ctx) {
  if (data.destination === 'Read Site') {
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

const createDocumentSchema = z.object(documentFieldsSchema).superRefine(requireDestinationFields);

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
  returnSchema,
  archiveSchema,
  listQuerySchema,
  objectId,
};
