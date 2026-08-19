const asyncHandler = require('../../utils/asyncHandler');
const documentRegisterBulkImportService = require('./documentRegisterBulkImport.service');
const {
  documentRegisterBulkImportCommitRowsSchema,
  documentRegisterBulkImportFileRefsSchema,
} = require('./documentRegisterBulkImport.validation');
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
  const rowsResult = documentRegisterBulkImportCommitRowsSchema.safeParse(req.body.rows);
  if (!rowsResult.success) {
    const message = rowsResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new BadRequestError(message);
  }
  const fileRefsResult = documentRegisterBulkImportFileRefsSchema.safeParse(req.body.fileRefs || []);
  if (!fileRefsResult.success) {
    const message = fileRefsResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new BadRequestError(message);
  }
  const importResult = await documentRegisterBulkImportService.commitImport({
    rows: rowsResult.data,
    fileRefs: fileRefsResult.data,
    actorId: req.user.id,
  });
  res.json(importResult);
});

module.exports = { template, parse, commit };
