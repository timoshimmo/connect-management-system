const asyncHandler = require('../../utils/asyncHandler');
const documentRegisterBulkImportService = require('./documentRegisterBulkImport.service');
const { documentRegisterBulkImportCommitRowsSchema } = require('./documentRegisterBulkImport.validation');
const { BadRequestError } = require('../../common/errors');

const template = asyncHandler(async (req, res) => {
  const workbook = await documentRegisterBulkImportService.generateTemplateWorkbook();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="document-register-bulk-upload-template.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

const parse = asyncHandler(async (req, res) => {
  if (!req.file) throw new BadRequestError('An Excel file is required');
  const rawRows = await documentRegisterBulkImportService.parseWorkbookBuffer(req.file.buffer);
  const rows = await documentRegisterBulkImportService.validateRows(rawRows);
  const valid = rows.filter((r) => r.status === 'valid').length;
  res.json({ rows, summary: { total: rows.length, valid, invalid: rows.length - valid } });
});

const commit = asyncHandler(async (req, res) => {
  if (!req.body.rows) throw new BadRequestError('Row data is required');
  let parsedRows;
  try {
    parsedRows = JSON.parse(req.body.rows);
  } catch {
    throw new BadRequestError('Row data is not valid JSON');
  }
  const result = documentRegisterBulkImportCommitRowsSchema.safeParse(parsedRows);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new BadRequestError(message);
  }
  const importResult = await documentRegisterBulkImportService.commitImport({
    rows: result.data,
    files: req.files,
    actorId: req.user.id,
  });
  res.json(importResult);
});

module.exports = { template, parse, commit };
