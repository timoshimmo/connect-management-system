const ExcelJS = require('exceljs');
const documentService = require('./document.service');
const {
  Document,
  DOCUMENT_TYPES,
  DOCUMENT_DESTINATIONS,
  DOCUMENT_REGISTER_TYPE_PREFIXES,
  ISO_STANDARDS,
} = require('./document.model');
const { Department } = require('../departments/department.model');
const { Discipline } = require('../disciplines/discipline.model');
const { User } = require('../users/user.model');
const { recordAudit } = require('../auditLogs/auditLog.service');
const { notifyUser, notifyRole } = require('../notifications/notification.service');
const { BadRequestError } = require('../../common/errors');

const MAX_ROWS = 50;

/**
 * Column order drives both the generated template and the parser — a
 * header this doesn't recognize is ignored, and a missing header just
 * leaves that field blank rather than erroring, so re-ordered/extra
 * columns in a hand-edited sheet don't break parsing.
 */
const TEMPLATE_COLUMNS = [
  { header: 'Document ID / Reference', key: 'documentId', required: true },
  { header: 'Document Destination', key: 'destination', required: true },
  { header: 'Department', key: 'department', required: true },
  { header: 'Title', key: 'title', required: true },
  { header: 'Description', key: 'description', required: false },
  { header: 'File Name', key: 'fileName', required: true },
  { header: 'Author', key: 'authorName', required: true },
  { header: 'Version', key: 'version', required: false },
  { header: 'Document Type', key: 'category', required: false },
  { header: 'Drawing Number', key: 'drawingNumber', required: false },
  { header: 'Discipline', key: 'discipline', required: false },
  { header: 'Area', key: 'area', required: false },
  { header: 'Revision', key: 'revision', required: false },
  { header: 'ISO Standards', key: 'isoStandards', required: false },
  { header: 'ISO Clauses', key: 'isoClauses', required: false },
];

const SAMPLE_ROWS = [
  {
    documentId: 'SMS-PO-0004',
    destination: 'Read Site',
    department: '',
    title: 'Sample: Health & Safety Policy',
    description: 'Company-wide health and safety policy.',
    fileName: 'Health and Safety Policy.pdf',
    authorName: 'L. Sule',
    version: '1.0',
    category: 'Policy',
    drawingNumber: '',
    discipline: '',
    area: '',
    revision: '',
  },
  {
    documentId: 'HSE-2026-001',
    destination: 'Drawing Register',
    department: '',
    title: 'Sample: Site Layout Drawing',
    description: 'General arrangement drawing for the main site.',
    fileName: 'Drawing-A101.pdf',
    authorName: 'L. Sule',
    version: '2.1',
    category: '',
    drawingNumber: 'A-101',
    discipline: '',
    area: 'Main Site',
    revision: 'B',
    isoStandards: '',
    isoClauses: '',
  },
  {
    documentId: 'STAC-QHSE-MAN-002',
    destination: 'Document Register',
    department: '',
    title: 'Sample: QHSE Management System Manual',
    description: 'Controlled QHSE manual.',
    fileName: 'QHSE-Manual.pdf',
    authorName: 'L. Sule',
    version: '1.0',
    category: 'Manual',
    drawingNumber: '',
    discipline: '',
    area: '',
    revision: '0',
    isoStandards: 'ISO 9001 (Quality), ISO 14001 (Environment)',
    isoClauses: '4-10',
  },
];

const INSTRUCTIONS = [
  ['Document ID / Reference', 'Required. For Read Site and Drawing Register rows: the SMS document number to assign (existing format, e.g. "SMS-PR00001") — must not already be in use. For Document Register rows: the Document Register Reference, in "STAC-QHSE-[TYPE]-[3-digit]" format matching the selected Document Type (e.g. a "Manual" must be "STAC-QHSE-MAN-001") — must not already be in use. An internal SMS number is still generated automatically for Document Register rows; you don\'t supply it here.'],
  ['Document Destination', 'Required. Must be exactly "Read Site", "Drawing Register" or "Document Register" (use the dropdown).'],
  ['Department', 'Required. Must exactly match an existing, active department name (use the dropdown).'],
  ['Title', 'Required.'],
  ['Description', 'Optional.'],
  ['File Name', 'Required. Must exactly match the filename of one of the files you upload in Step 2 (case-insensitive).'],
  ['Author', 'Required. Must exactly match the full name of an existing user account (use the dropdown). If more than one account shares that name, the row will fail — use a name that uniquely identifies one account.'],
  ['Version', 'Optional. Freeform label (e.g. "3.2") for the document’s existing version history. Defaults to "1.0" if blank.'],
  ['Document Type', 'Required when Destination is "Read Site" or "Document Register" (use the dropdown). Leave blank for Drawing Register rows.'],
  ['Drawing Number', 'Required only when Destination is "Drawing Register". Leave blank otherwise.'],
  ['Discipline', 'Required only when Destination is "Drawing Register" (use the dropdown). Leave blank otherwise.'],
  ['Area', 'Optional.'],
  ['Revision', 'Required when Destination is "Drawing Register". Optional (e.g. "0") for Document Register rows. Leave blank for Read Site rows.'],
  ['ISO Standards', 'Document Register only. Optional. Comma-separated, must exactly match entries from: ' + ISO_STANDARDS.join(', ') + '.'],
  ['ISO Clauses', 'Document Register only. Optional freeform text, e.g. "4.1-4.2, 6.1.1".'],
  ['', ''],
  ['Import limit', `A single import is limited to ${MAX_ROWS} rows. Split larger batches into multiple imports.`],
  ['Publishing', 'Every row that passes validation is published immediately — bulk import skips the normal draft/review/approval workflow.'],
];

async function generateTemplateWorkbook() {
  const [departments, disciplines, authors] = await Promise.all([
    Department.find({ status: 'Active' }).sort({ name: 1 }),
    Discipline.find({ status: 'Active' }).sort({ name: 1 }),
    User.find({ status: 'Active' }).sort({ name: 1 }),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'STACconnect';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Documents');
  sheet.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.required ? `${c.header} *` : c.header, key: c.key, width: 24 }));
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: TEMPLATE_COLUMNS[colNumber - 1].required ? 'FFCC0000' : 'FF1F2937' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
  });
  SAMPLE_ROWS.forEach((row) => sheet.addRow(row));

  const listsSheet = workbook.addWorksheet('Lists', { state: 'veryHidden' });
  listsSheet.getColumn(1).values = ['Destination', ...DOCUMENT_DESTINATIONS];
  listsSheet.getColumn(2).values = ['Department', ...departments.map((d) => d.name)];
  listsSheet.getColumn(3).values = ['Document Type', ...DOCUMENT_TYPES];
  listsSheet.getColumn(4).values = ['Discipline', ...disciplines.map((d) => d.name)];
  listsSheet.getColumn(5).values = ['Author', ...authors.map((u) => u.name)];

  const LAST_DATA_ROW = 1000;
  function applyListValidation(colLetter, listColLetter, count) {
    sheet.dataValidations.add(`${colLetter}2:${colLetter}${LAST_DATA_ROW}`, {
      type: 'list',
      allowBlank: true,
      formulae: [`=Lists!$${listColLetter}$2:$${listColLetter}$${1 + count}`],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Please choose a value from the dropdown list.',
    });
  }
  applyListValidation('B', 'A', DOCUMENT_DESTINATIONS.length); // Document Destination
  applyListValidation('C', 'B', departments.length); // Department
  applyListValidation('I', 'C', DOCUMENT_TYPES.length); // Document Type
  applyListValidation('K', 'D', disciplines.length); // Discipline
  applyListValidation('G', 'E', authors.length); // Author

  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.columns = [
    { header: 'Field', key: 'field', width: 24 },
    { header: 'Notes', key: 'notes', width: 90 },
  ];
  instructionsSheet.getRow(1).font = { bold: true };
  INSTRUCTIONS.forEach(([field, notes]) => instructionsSheet.addRow({ field, notes }));

  return workbook;
}

/** Header text -> internal field key, case/whitespace-insensitive so a hand-edited header still matches. */
function buildHeaderMap(headerRow) {
  const map = new Map();
  headerRow.eachCell((cell, colNumber) => {
    const normalized = String(cell.value ?? '')
      .replace(/\*$/, '')
      .trim()
      .toLowerCase();
    const column = TEMPLATE_COLUMNS.find((c) => c.header.toLowerCase() === normalized);
    if (column) map.set(colNumber, column.key);
  });
  return map;
}

async function parseWorkbookBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.getWorksheet('Documents') || workbook.worksheets[0];
  if (!sheet) return [];

  const headerMap = buildHeaderMap(sheet.getRow(1));
  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = {};
    let hasAnyValue = false;
    headerMap.forEach((key, colNumber) => {
      const raw = row.getCell(colNumber).value;
      const value = raw === null || raw === undefined ? '' : String(raw).trim();
      values[key] = value;
      if (value) hasAnyValue = true;
    });
    if (!hasAnyValue) return; // skip fully blank rows (trailing rows in the sheet)
    rows.push({ rowNumber, data: values });
  });
  return rows;
}

async function buildValidationContext() {
  const [departments, disciplines] = await Promise.all([
    Department.find({ status: 'Active' }),
    Discipline.find({ status: 'Active' }),
  ]);
  const departmentByName = new Map(departments.map((d) => [d.name.toLowerCase(), d]));
  const disciplineByName = new Map(disciplines.map((d) => [d.name.toLowerCase(), d]));
  return { departmentByName, disciplineByName };
}

function fileNameKey(name) {
  return String(name || '').trim().toLowerCase();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const FILE_NAME_PATTERN = /\.(pdf|docx?)$/i;

/**
 * Validates every row in a single pass so cross-row checks (duplicate
 * Document ID / Drawing Number / File Name within the sheet) can be
 * enforced alongside each row's own field-level checks. Used by both
 * /parse (no files yet) and /commit (re-validates, never trusts the
 * client) — identical logic, so parse-time and commit-time results only
 * ever differ because of file-matching (which requires uploaded files).
 */
async function validateRows(rawRows, context) {
  if (rawRows.length > MAX_ROWS) {
    throw new BadRequestError(
      `A single import is limited to ${MAX_ROWS} rows (this sheet has ${rawRows.length}). Split it into multiple imports.`
    );
  }

  const { departmentByName, disciplineByName } = context;

  // The "Document ID / Reference" column means different things depending on
  // the row's own Destination — an SMS docId for Read Site/Drawing Register,
  // a Document Register Reference (STAC-QHSE-...) for Document Register —
  // so uniqueness (both against the DB and within this sheet) is tracked in
  // two entirely separate pools, keyed by which meaning applies to that row.
  const existingDocIds = new Set((await Document.find({}, 'docId')).map((d) => d.docId.toLowerCase()));
  const existingRegisterRefs = new Set(
    (await Document.find({ documentRegisterReference: { $exists: true } }, 'documentRegisterReference')).map((d) =>
      d.documentRegisterReference.toLowerCase()
    )
  );
  const existingDrawingNumbers = new Set(
    (await Document.find({ destination: 'Drawing Register', drawingNumber: { $ne: '' } }, 'drawingNumber')).map((d) =>
      d.drawingNumber.trim().toLowerCase()
    )
  );

  const docIdCounts = new Map();
  const registerRefCounts = new Map();
  const drawingNumberCounts = new Map();
  const fileNameCounts = new Map();
  for (const { data } of rawRows) {
    if (data.documentId) {
      const key = data.documentId.trim().toLowerCase();
      const counts = data.destination?.trim() === 'Document Register' ? registerRefCounts : docIdCounts;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    if (data.drawingNumber) {
      const key = data.drawingNumber.trim().toLowerCase();
      drawingNumberCounts.set(key, (drawingNumberCounts.get(key) || 0) + 1);
    }
    if (data.fileName) {
      const key = fileNameKey(data.fileName);
      fileNameCounts.set(key, (fileNameCounts.get(key) || 0) + 1);
    }
  }

  const results = [];
  for (const { rowNumber, data } of rawRows) {
    const errors = [];
    const resolved = {};

    const destination = data.destination?.trim();
    if (!destination) errors.push('Document Destination is required.');
    else if (!DOCUMENT_DESTINATIONS.includes(destination)) {
      errors.push(`Document Destination must be one of: ${DOCUMENT_DESTINATIONS.join(', ')}.`);
    }

    if (!data.department?.trim()) {
      errors.push('Department is required.');
    } else {
      const dept = departmentByName.get(data.department.trim().toLowerCase());
      if (!dept) errors.push(`Department "${data.department}" was not found or is inactive.`);
      else resolved.departmentId = dept._id;
    }

    if (!data.title?.trim()) errors.push('Title is required.');

    if (!data.fileName?.trim()) {
      errors.push('File Name is required.');
    } else if (!FILE_NAME_PATTERN.test(data.fileName.trim())) {
      errors.push('File Name must end in .pdf, .doc, or .docx.');
    }

    if (!data.authorName?.trim()) {
      errors.push('Author is required.');
    } else {
      const name = data.authorName.trim();
      const matches = await User.find({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
      if (matches.length === 0) errors.push(`No user found with the name "${data.authorName}".`);
      else if (matches.length > 1) {
        errors.push(`More than one user is named "${data.authorName}" — use a name that uniquely identifies one account.`);
      } else resolved.authorUserId = matches[0]._id;
    }

    if (destination === 'Read Site' || destination === 'Document Register') {
      if (!data.category?.trim()) errors.push(`Document Type is required for ${destination} documents.`);
      else if (!DOCUMENT_TYPES.includes(data.category.trim())) {
        errors.push(`Document Type must be one of: ${DOCUMENT_TYPES.join(', ')}.`);
      }
    } else if (destination === 'Drawing Register') {
      if (!data.drawingNumber?.trim()) errors.push('Drawing Number is required for Drawing Register documents.');
      if (!data.discipline?.trim()) {
        errors.push('Discipline is required for Drawing Register documents.');
      } else {
        const discipline = disciplineByName.get(data.discipline.trim().toLowerCase());
        if (!discipline) errors.push(`Discipline "${data.discipline}" was not found or is inactive.`);
        else resolved.disciplineId = discipline._id;
      }
      if (!data.revision?.trim()) errors.push('Revision is required for Drawing Register documents.');
    }

    if (destination === 'Document Register' && data.isoStandards?.trim()) {
      const values = data.isoStandards.split(',').map((s) => s.trim()).filter(Boolean);
      const invalid = values.filter((v) => !ISO_STANDARDS.includes(v));
      if (invalid.length > 0) {
        errors.push(`ISO Standards must only contain: ${ISO_STANDARDS.join(', ')}. Found invalid value(s): ${invalid.join(', ')}.`);
      } else {
        resolved.isoStandards = values;
      }
    }

    if (!data.documentId?.trim()) {
      errors.push('Document ID / Reference is required.');
    } else if (destination === 'Document Register') {
      const key = data.documentId.trim().toLowerCase();
      if (registerRefCounts.get(key) > 1) {
        errors.push(`Document Register Reference "${data.documentId}" is used by more than one row in this sheet.`);
      }
      if (existingRegisterRefs.has(key)) errors.push(`Document Register Reference "${data.documentId}" already exists.`);
      if (data.category?.trim() && DOCUMENT_TYPES.includes(data.category.trim())) {
        const prefix = DOCUMENT_REGISTER_TYPE_PREFIXES[data.category.trim()];
        const expectedPattern = new RegExp(`^${prefix}\\d{3}$`);
        if (prefix && !expectedPattern.test(data.documentId.trim())) {
          errors.push(
            `Document Register Reference "${data.documentId}" doesn't match the "${prefix}NNN" format required for ${data.category.trim()} documents.`
          );
        }
      }
    } else {
      const key = data.documentId.trim().toLowerCase();
      if (docIdCounts.get(key) > 1) errors.push(`Document ID "${data.documentId}" is used by more than one row in this sheet.`);
      if (existingDocIds.has(key)) errors.push(`Document ID "${data.documentId}" already exists.`);
    }

    if (data.drawingNumber?.trim()) {
      const key = data.drawingNumber.trim().toLowerCase();
      if (drawingNumberCounts.get(key) > 1) errors.push(`Drawing Number "${data.drawingNumber}" is used by more than one row in this sheet.`);
      if (existingDrawingNumbers.has(key)) errors.push(`Drawing Number "${data.drawingNumber}" already exists.`);
    }

    if (data.fileName?.trim() && fileNameCounts.get(fileNameKey(data.fileName)) > 1) {
      errors.push(`File Name "${data.fileName}" is used by more than one row in this sheet.`);
    }

    results.push({
      rowNumber,
      data: {
        documentId: data.documentId?.trim() || '',
        destination: destination || '',
        department: data.department?.trim() || '',
        title: data.title?.trim() || '',
        description: data.description?.trim() || '',
        fileName: data.fileName?.trim() || '',
        authorName: data.authorName?.trim() || '',
        version: data.version?.trim() || '',
        category: data.category?.trim() || '',
        drawingNumber: data.drawingNumber?.trim() || '',
        discipline: data.discipline?.trim() || '',
        area: data.area?.trim() || '',
        revision: data.revision?.trim() || '',
        isoStandards: data.isoStandards?.trim() || '',
        isoClauses: data.isoClauses?.trim() || '',
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
  const context = await buildValidationContext();
  const revalidated = await validateRows(
    rows.map((r) => ({ rowNumber: r.rowNumber, data: r.data })),
    context
  );

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
      const now = new Date();
      const doc = await documentService.createDocument({
        title: row.data.title,
        department: row.resolved.departmentId,
        type:
          row.data.destination === 'Read Site' || row.data.destination === 'Document Register'
            ? row.data.category
            : undefined,
        description: row.data.description,
        destination: row.data.destination,
        drawingNumber: row.data.drawingNumber,
        discipline: row.resolved.disciplineId,
        area: row.data.area,
        revision: row.data.revision,
        isoStandards: row.resolved.isoStandards || [],
        isoClauses: row.data.isoClauses,
        authorId: row.resolved.authorUserId,
        fileRef,
        // Document Register rows: the sheet's column supplies the Document
        // Register Reference, not the SMS docId — docId is auto-generated
        // (see createDocument), same as the single-document create form.
        docId: row.data.destination === 'Document Register' ? undefined : row.data.documentId,
        documentRegisterReference: row.data.destination === 'Document Register' ? row.data.documentId : undefined,
        status: 'Published',
        publishedAt: now,
        nextReviewDate: new Date(now.getTime() + ONE_YEAR_MS),
        versionNumber: row.data.version || undefined,
        changeNote: 'Bulk import',
      });

      await recordAudit({
        user: actorId,
        action: 'bulk_import',
        targetType: 'document',
        targetId: doc._id,
        metadata: { docId: doc.docId, sourceRow: row.rowNumber },
      });

      const destinationLabels = {
        'Read Site': 'the Read Site',
        'Drawing Register': 'the Drawing Register',
        'Document Register': 'the Document Register',
      };
      const destinationLabel = destinationLabels[doc.destination] || 'the Read Site';
      // Document Register documents show their documentRegisterReference
      // (STAC-QHSE-...) as the primary identifier everywhere, not the SMS
      // docId that's still generated alongside it for internal use.
      const displayedReference = doc.documentRegisterReference || doc.docId;
      await notifyUser(doc.author, {
        type: 'document_published',
        message: `"${doc.title}" (${displayedReference}) has been published and is now live on ${destinationLabel}.`,
        relatedDocument: doc._id,
      });

      results.push({ row: row.rowNumber, status: 'succeeded', docId: displayedReference });
      succeeded += 1;
    } catch (err) {
      results.push({ row: row.rowNumber, status: 'failed', error: err.message });
      failed += 1;
    }
  }

  if (succeeded > 0) {
    await notifyRole('controller', {
      type: 'document_published',
      message: `${succeeded} document${succeeded === 1 ? '' : 's'} ${succeeded === 1 ? 'was' : 'were'} bulk-imported and published.`,
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
  buildValidationContext,
  validateRows,
  commitImport,
};
