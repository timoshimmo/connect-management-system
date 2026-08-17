const { z } = require('zod');
const { MAX_ROWS } = require('./documentRegisterBulkImport.service');

/**
 * Structural guard only — confirms the `rows` field the client sends to
 * /document-register-bulk-import/commit is well-formed JSON in the expected
 * shape. The actual business validation (reference format/uniqueness,
 * Document Type, file-name matching) always re-runs server-side via
 * documentRegisterBulkImport.service.js's validateRows(), which never
 * trusts whatever the client claims here.
 */
const documentRegisterBulkImportRowDataSchema = z.object({
  referenceNo: z.string().optional().default(''),
  title: z.string().optional().default(''),
  revision: z.string().optional().default(''),
  issueDate: z.string().optional().default(''),
  category: z.string().optional().default(''),
  isoClauses: z.string().optional().default(''),
  fileName: z.string().optional().default(''),
});

const documentRegisterBulkImportCommitRowsSchema = z
  .array(
    z.object({
      rowNumber: z.number(),
      data: documentRegisterBulkImportRowDataSchema,
    })
  )
  .min(1, 'At least one row is required.')
  .max(MAX_ROWS, `A single import is limited to ${MAX_ROWS} rows.`);

module.exports = { documentRegisterBulkImportCommitRowsSchema };
