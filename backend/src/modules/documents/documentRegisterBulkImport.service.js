const ExcelJS = require('exceljs');
const documentService = require('./document.service');
const { Document, DOCUMENT_TYPES, DOCUMENT_REGISTER_TYPE_PREFIXES } = require('./document.model');
const { recordAudit } = require('../auditLogs/auditLog.service');
const { notifyRole } = require('../notifications/notification.service');
const { BadRequestError } = require('../../common/errors');

// A real, evolving company register (Manuals + Policies + Procedures +
// Standards + ...) runs well past the generic importer's 50-row cap — see
// middlewares/bulkUpload.js's matching documentRegisterFilesUpload limit.
const MAX_ROWS = 150;

const COMPANY_NAME = 'STAC MARINE NIGERIA LIMITED';
const SUBTITLE = 'QHSE Management System — Document Register (bulk import template)';

/**
 * Dedicated Document Register bulk-upload template — a sibling to
 * bulkImport.service.js, not a branch of it. This one matches the
 * Controller's own existing register file format exactly: Reference No. /
 * Document Title / Version (Rev.) / Issue Date / Document Type / ISO
 * Clauses Covered / File Name, with a two-line company/title header block
 * above the real header row. Deliberately no Department or Author column —
 * the Document Register is organized by Document Type only, and every
 * document is registered under the importing Controller's own account.
 */
const TEMPLATE_COLUMNS = [
  { header: 'Reference No.', key: 'referenceNo', required: true, width: 20 },
  { header: 'Document Title', key: 'title', required: true, width: 62 },
  { header: 'Version (Rev.)', key: 'revision', required: false, width: 12 },
  { header: 'Issue Date', key: 'issueDate', required: false, width: 14 },
  { header: 'Document Type', key: 'category', required: true, width: 13 },
  { header: 'ISO Clauses Covered', key: 'isoClauses', required: false, width: 30 },
  { header: 'File Name', key: 'fileName', required: true, width: 46 },
];

const SAMPLE_ROWS = [
  {
    referenceNo: 'STAC-QHSE-MAN-001',
    title: 'QHSE Management System Manual',
    revision: '0',
    issueDate: '13 August 2026',
    category: 'Manual',
    isoClauses: 'ISO 9001:2015 / 14001:2015 / 45001:2018 — Clauses 4–10',
    fileName: 'STAC_Marine_QHSE_Manual.docx',
  },
  {
    referenceNo: 'STAC-QHSE-PRO-001',
    title: 'QHSE Risk and Opportunities Register Procedure',
    revision: '0',
    issueDate: '13 August 2026',
    category: 'Procedure',
    isoClauses: '6.1.1',
    fileName: 'STAC_Marine_QHSE_Risk_Opportunities_Register_Procedure.docx',
  },
];

const INSTRUCTIONS = [
  [
    'Reference No.',
    'Required. Must match "STAC-QHSE-[PREFIX]-NNN" for the selected Document Type (e.g. a Manual must be "STAC-QHSE-MAN-001") and must not already be in use.',
  ],
  ['Document Title', 'Required.'],
  ['Version (Rev.)', 'Optional. Defaults to "0" if blank.'],
  ['Issue Date', 'Optional. Any recognizable date (e.g. "13 August 2026"). Defaults to today if blank.'],
  ['Document Type', 'Required (use the dropdown).'],
  ['ISO Clauses Covered', 'Optional freeform text — stored exactly as entered.'],
  ['File Name', 'Required. Must exactly match the filename of one of the files you upload in Step 2 (case-insensitive).'],
  ['', ''],
  ['Department', 'Not required — the Document Register is organized by Document Type, not Department.'],
  ['Author', 'Not required — every row is registered under your own account as the Document Controller performing this import.'],
  [
    'Rows without a Reference No.',
    'Skipped automatically — useful for section-header rows (e.g. "POLICIES") pasted in from your own register.',
  ],
  ['Import limit', `A single import is limited to ${MAX_ROWS} rows. Split larger registers into multiple imports.`],
  ['Publishing', 'Every row that passes validation is published immediately to the Document Register.'],
];

async function generateTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'STAC Management System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Document Register');
  sheet.columns = TEMPLATE_COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = COMPANY_NAME;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF37474F' }, name: 'Cambria' };

  sheet.mergeCells('A2:G2');
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.value = SUBTITLE;
  subtitleCell.font = { italic: true, size: 10, color: { argb: 'FF666666' }, name: 'Cambria' };

  const headerRow = sheet.getRow(4);
  TEMPLATE_COLUMNS.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.required ? `${c.header} *` : c.header;
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Cambria' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  headerRow.commit();

  SAMPLE_ROWS.forEach((row) => sheet.addRow(row));

  const listsSheet = workbook.addWorksheet('Lists', { state: 'veryHidden' });
  listsSheet.getColumn(1).values = ['Document Type', ...DOCUMENT_TYPES];
  sheet.dataValidations.add('E5:E1000', {
    type: 'list',
    allowBlank: false,
    formulae: [`=Lists!$A$2:$A$${1 + DOCUMENT_TYPES.length}`],
    showErrorMessage: true,
    errorTitle: 'Invalid value',
    error: 'Please choose a Document Type from the dropdown list.',
  });

  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.columns = [
    { header: 'Field', key: 'field', width: 26 },
    { header: 'Notes', key: 'notes', width: 90 },
  ];
  instructionsSheet.getRow(1).font = { bold: true };
  INSTRUCTIONS.forEach(([field, notes]) => instructionsSheet.addRow({ field, notes }));

  return workbook;
}

/** Header text -> internal field key, case/whitespace-insensitive, tolerant of the "required" asterisk. */
function buildHeaderMap(row) {
  const map = new Map();
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const normalized = String(cell.value ?? '')
      .replace(/\*$/, '')
      .trim()
      .toLowerCase();
    const column = TEMPLATE_COLUMNS.find((c) => c.header.toLowerCase() === normalized);
    if (column) map.set(colNumber, column.key);
  });
  return map;
}

function cellText(raw) {
  if (raw === null || raw === undefined) return '';
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === 'object' && 'richText' in raw) {
    return raw.richText.map((r) => r.text).join('');
  }
  if (typeof raw === 'object' && 'text' in raw) return String(raw.text);
  return String(raw).trim();
}

/**
 * Scans the first several rows for the real header row (containing
 * "Reference No.") rather than assuming a fixed row index — tolerant of the
 * branded company/title rows above it, and of a hand-edited copy adding or
 * removing blank rows.
 */
async function parseWorkbookBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  let headerRowNumber = null;
  let headerMap = new Map();
  for (let r = 1; r <= Math.min(sheet.rowCount, 10); r += 1) {
    const map = buildHeaderMap(sheet.getRow(r));
    if ([...map.values()].includes('referenceNo')) {
      headerRowNumber = r;
      headerMap = map;
      break;
    }
  }
  if (!headerRowNumber) {
    throw new BadRequestError(
      'Could not find the "Reference No." column — make sure you\'re using the Document Register bulk upload template.'
    );
  }

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;
    const values = {};
    let hasAnyValue = false;
    headerMap.forEach((key, colNumber) => {
      const value = cellText(row.getCell(colNumber).value);
      values[key] = value;
      if (value) hasAnyValue = true;
    });
    if (!hasAnyValue) return; // fully blank trailing row
    rows.push({ rowNumber, data: values });
  });
  return rows;
}

function fileNameKey(name) {
  return String(name || '').trim().toLowerCase();
}

const FILE_NAME_PATTERN = /\.(pdf|docx?)$/i;

/**
 * A row missing Title, Type, and File Name is treated as a non-data row —
 * a section header pasted in from the Controller's own register (e.g. a
 * bare "POLICIES" label sitting in the Reference No. column with nothing
 * else filled in), a note, or a blank spacer — and silently excluded,
 * never surfaced as an error. A row is only skipped when ALL THREE are
 * empty, so a row with a real reference but a genuinely missing title (say)
 * still gets flagged as invalid rather than disappearing.
 * Used by both /parse and /commit (commit always re-validates, never trusts
 * the client).
 */
async function validateRows(rawRows) {
  const dataRows = rawRows.filter(
    (r) => r.data.title?.trim() || r.data.category?.trim() || r.data.fileName?.trim()
  );

  if (dataRows.length > MAX_ROWS) {
    throw new BadRequestError(
      `A single import is limited to ${MAX_ROWS} rows (this sheet has ${dataRows.length}). Split it into multiple imports.`
    );
  }

  const existingReferences = new Set(
    (await Document.find({ documentRegisterReference: { $exists: true } }, 'documentRegisterReference')).map((d) =>
      d.documentRegisterReference.toLowerCase()
    )
  );

  const referenceCounts = new Map();
  const fileNameCounts = new Map();
  for (const { data } of dataRows) {
    const refNo = data.referenceNo?.trim();
    if (refNo) {
      const key = refNo.toLowerCase();
      referenceCounts.set(key, (referenceCounts.get(key) || 0) + 1);
    }
    if (data.fileName) {
      const fKey = fileNameKey(data.fileName);
      fileNameCounts.set(fKey, (fileNameCounts.get(fKey) || 0) + 1);
    }
  }

  const results = [];
  for (const { rowNumber, data } of dataRows) {
    const errors = [];
    const resolved = {};

    const referenceNo = data.referenceNo?.trim() || '';
    const key = referenceNo.toLowerCase();
    if (!referenceNo) {
      errors.push('Reference No. is required.');
    } else {
      if (referenceCounts.get(key) > 1) {
        errors.push(`Reference No. "${referenceNo}" is used by more than one row in this sheet.`);
      }
      if (existingReferences.has(key)) errors.push(`Reference No. "${referenceNo}" already exists.`);
    }

    if (!data.title?.trim()) errors.push('Document Title is required.');

    if (!data.category?.trim()) {
      errors.push('Document Type is required.');
    } else if (!DOCUMENT_TYPES.includes(data.category.trim())) {
      errors.push(`Document Type must be one of: ${DOCUMENT_TYPES.join(', ')}.`);
    } else {
      const prefix = DOCUMENT_REGISTER_TYPE_PREFIXES[data.category.trim()];
      const expectedPattern = new RegExp(`^${prefix}\\d{3}$`);
      if (referenceNo && prefix && !expectedPattern.test(referenceNo)) {
        errors.push(
          `Reference No. "${referenceNo}" doesn't match the "${prefix}NNN" format required for ${data.category.trim()} documents.`
        );
      }
    }

    if (!data.fileName?.trim()) {
      errors.push('File Name is required.');
    } else if (!FILE_NAME_PATTERN.test(data.fileName.trim())) {
      errors.push('File Name must end in .pdf, .doc, or .docx.');
    } else if (fileNameCounts.get(fileNameKey(data.fileName)) > 1) {
      errors.push(`File Name "${data.fileName}" is used by more than one row in this sheet.`);
    }

    if (data.issueDate?.trim()) {
      const parsed = new Date(data.issueDate.trim());
      if (Number.isNaN(parsed.getTime())) {
        errors.push(`Issue Date "${data.issueDate}" could not be understood — try a format like "13 August 2026".`);
      } else {
        resolved.issueDate = parsed;
      }
    }

    results.push({
      rowNumber,
      data: {
        referenceNo,
        title: data.title?.trim() || '',
        revision: data.revision?.trim() || '',
        issueDate: data.issueDate?.trim() || '',
        category: data.category?.trim() || '',
        isoClauses: data.isoClauses?.trim() || '',
        fileName: data.fileName?.trim() || '',
      },
      resolved,
      status: errors.length === 0 ? 'valid' : 'invalid',
      errors,
    });
  }

  return results;
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

async function commitImport({ rows, fileRefs, actorId }) {
  const revalidated = await validateRows(rows.map((r) => ({ rowNumber: r.rowNumber, data: r.data })));

  const fileByName = new Map();
  for (const f of fileRefs || []) {
    const key = fileNameKey(f.originalFilename);
    fileByName.set(key, fileByName.has(key) ? 'AMBIGUOUS' : f);
  }

  const results = [];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of revalidated) {
    if (row.status === 'invalid') {
      results.push({ row: row.rowNumber, status: 'skipped', error: row.errors.join(' ') });
      skipped += 1;
      continue;
    }

    const fileRef = fileByName.get(fileNameKey(row.data.fileName));
    if (!fileRef) {
      results.push({ row: row.rowNumber, status: 'failed', error: `No uploaded file named "${row.data.fileName}" was found.` });
      failed += 1;
      continue;
    }
    if (fileRef === 'AMBIGUOUS') {
      results.push({ row: row.rowNumber, status: 'failed', error: `Multiple uploaded files are named "${row.data.fileName}".` });
      failed += 1;
      continue;
    }

    try {
      const issueDate = row.resolved.issueDate || new Date();
      const doc = await documentService.createDocument({
        title: row.data.title,
        type: row.data.category,
        destination: 'Document Register',
        documentRegisterReference: row.data.referenceNo,
        revision: row.data.revision || '0',
        isoClauses: row.data.isoClauses,
        isoStandards: [],
        authorId: actorId,
        fileRef,
        status: 'Published',
        publishedAt: issueDate,
        nextReviewDate: new Date(issueDate.getTime() + ONE_YEAR_MS),
        versionNumber: row.data.revision || undefined,
        changeNote: 'Document Register bulk import',
      });

      await recordAudit({
        user: actorId,
        action: 'bulk_import',
        targetType: 'document',
        targetId: doc._id,
        metadata: { documentRegisterReference: doc.documentRegisterReference, sourceRow: row.rowNumber },
      });

      results.push({ row: row.rowNumber, status: 'succeeded', docId: doc.documentRegisterReference });
      succeeded += 1;
    } catch (err) {
      results.push({ row: row.rowNumber, status: 'failed', error: err.message });
      failed += 1;
    }
  }

  if (succeeded > 0) {
    await notifyRole('controller', {
      type: 'document_published',
      message: `${succeeded} Document Register document${succeeded === 1 ? '' : 's'} ${succeeded === 1 ? 'was' : 'were'} bulk-imported and published.`,
      relatedDocument: null,
      excludeUserId: actorId,
    });
  }

  return { total: revalidated.length, succeeded, failed, skipped, results };
}

module.exports = {
  MAX_ROWS,
  generateTemplateWorkbook,
  parseWorkbookBuffer,
  validateRows,
  commitImport,
};
