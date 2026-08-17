const { z } = require('zod');
const { MAX_ROWS } = require('./bulkImport.service');

/**
 * Structural guard only — this just confirms the `rows` field the client
 * sends to /bulk-import/commit is well-formed JSON in the expected shape.
 * The actual business validation (department/discipline/author lookups,
 * duplicate checks, destination-conditional requiredness) always re-runs
 * server-side via bulkImport.service.js's validateRows(), which never
 * trusts whatever the client claims here.
 */
const bulkImportRowDataSchema = z.object({
  documentId: z.string().optional().default(''),
  destination: z.string().optional().default(''),
  department: z.string().optional().default(''),
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  fileName: z.string().optional().default(''),
  authorName: z.string().optional().default(''),
  version: z.string().optional().default(''),
  category: z.string().optional().default(''),
  drawingNumber: z.string().optional().default(''),
  discipline: z.string().optional().default(''),
  area: z.string().optional().default(''),
  revision: z.string().optional().default(''),
  isoStandards: z.string().optional().default(''),
  isoClauses: z.string().optional().default(''),
});

const bulkImportCommitRowsSchema = z
  .array(
    z.object({
      rowNumber: z.number(),
      data: bulkImportRowDataSchema,
    })
  )
  .min(1, 'At least one row is required.')
  .max(MAX_ROWS, `A single import is limited to ${MAX_ROWS} rows.`);

module.exports = { bulkImportCommitRowsSchema };
