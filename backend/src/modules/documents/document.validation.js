const { z } = require('zod');
const { DOCUMENT_TYPES, DOCUMENT_LOCATIONS, DOCUMENT_STATUSES, DOCUMENT_DESTINATIONS } = require('./document.model');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const createDocumentSchema = z.object({
  title: z.string().min(1),
  department: objectId,
  type: z.enum(DOCUMENT_TYPES),
  description: z.string().optional(),
  location: z.enum(DOCUMENT_LOCATIONS).optional(),
  destination: z.enum(DOCUMENT_DESTINATIONS),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  department: objectId.optional(),
  type: z.enum(DOCUMENT_TYPES).optional(),
  description: z.string().optional(),
  location: z.enum(DOCUMENT_LOCATIONS).optional(),
  destination: z.enum(DOCUMENT_DESTINATIONS).optional(),
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
