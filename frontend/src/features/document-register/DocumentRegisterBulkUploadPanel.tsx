import { useMemo, useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { ImportSummary } from '@/features/bulk-upload';
import type {
  ApiDocumentRegisterBulkImportCommitResult,
  ApiDocumentRegisterBulkImportParseResult,
  ApiDocumentRegisterBulkImportRow,
} from '@/lib/apiTypes';
import {
  useCommitDocumentRegisterBulkImportMutation,
  useDownloadDocumentRegisterTemplate,
  useParseDocumentRegisterBulkImportMutation,
} from './bulkImportHooks';
import { DocumentRegisterValidationResultsTable } from './DocumentRegisterValidationResultsTable';

type Step = 'upload-excel' | 'review' | 'summary';

function fileKey(name: string) {
  return name.trim().toLowerCase();
}

/**
 * Document Controller-only wizard, dedicated to the Document Register's own
 * register-file format (Reference No. / Document Title / Version (Rev.) /
 * Issue Date / Document Type / ISO Clauses Covered / File Name — no
 * Department or Author column). Same step flow as the generic
 * features/bulk-upload/BulkUploadPanel.tsx (download template → upload
 * Excel → review + upload files → import → summary) and reuses its
 * ImportSummary component directly — only the template/endpoints/columns
 * differ. See backend/src/modules/documents/documentRegisterBulkImport.service.js.
 */
export function DocumentRegisterBulkUploadPanel() {
  const [step, setStep] = useState<Step>('upload-excel');
  const [parseResult, setParseResult] = useState<ApiDocumentRegisterBulkImportParseResult | null>(null);
  const [includedRowNumbers, setIncludedRowNumbers] = useState<Set<number>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [commitResult, setCommitResult] = useState<ApiDocumentRegisterBulkImportCommitResult | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const { download: downloadTemplate, isDownloading } = useDownloadDocumentRegisterTemplate();
  const parseMutation = useParseDocumentRegisterBulkImportMutation();
  const commitMutation = useCommitDocumentRegisterBulkImportMutation();

  const fileFoundByRow = useMemo(() => {
    const uploadedKeys = new Set(files.map((f) => fileKey(f.name)));
    const map = new Map<number, boolean>();
    for (const row of parseResult?.rows ?? []) {
      map.set(row.rowNumber, row.data.fileName ? uploadedKeys.has(fileKey(row.data.fileName)) : false);
    }
    return map;
  }, [parseResult, files]);

  function resetAll() {
    setStep('upload-excel');
    setParseResult(null);
    setIncludedRowNumbers(new Set());
    setFiles([]);
    setCommitResult(null);
    if (excelInputRef.current) excelInputRef.current.value = '';
    if (filesInputRef.current) filesInputRef.current.value = '';
  }

  function handleExcelSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    parseMutation.mutate(file, {
      onSuccess: (result) => {
        setParseResult(result);
        setIncludedRowNumbers(new Set(result.rows.filter((r) => r.status === 'valid').map((r) => r.rowNumber)));
        setStep('review');
      },
    });
  }

  function toggleRow(rowNumber: number) {
    setIncludedRowNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  function handleImport() {
    if (!parseResult) return;
    const rows: ApiDocumentRegisterBulkImportRow[] = parseResult.rows.filter((r) => includedRowNumbers.has(r.rowNumber));
    commitMutation.mutate(
      { rows, files },
      {
        onSuccess: (result) => {
          setCommitResult(result);
          setStep('summary');
        },
      }
    );
  }

  const includedCount = includedRowNumbers.size;
  const invalidCount = parseResult ? parseResult.rows.length - parseResult.summary.valid : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Document Register Bulk Upload</h2>
            <p className="mt-1 text-sm text-gray-500">
              Import from your own QHSE Document Register file — Reference No., Document Title, Version, Issue
              Date, Document Type, ISO Clauses Covered and File Name. No Department needed (organized by Type)
              and every document is registered under your own account. Every valid row is published immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={isDownloading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-800 px-3.5 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {isDownloading ? 'Downloading…' : 'Download Excel Template'}
          </button>
        </div>
      </div>

      {step === 'upload-excel' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Step 1 — Upload your Document Register sheet</h3>
          <p className="mb-4 text-sm text-gray-500">
            We'll validate every row (reference format, Document Type, duplicate references) before anything is
            imported. Rows without a Reference No. (e.g. section-header rows like "POLICIES") are skipped
            automatically.
          </p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center hover:border-emerald-400 hover:bg-emerald-50/30">
            <FileSpreadsheet className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {parseMutation.isPending ? 'Validating…' : 'Click to choose an .xlsx file'}
            </span>
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              disabled={parseMutation.isPending}
              onChange={(e) => handleExcelSelected(e.target.files)}
            />
          </label>
        </div>
      )}

      {step === 'review' && parseResult && (
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Step 2 — Review validation & upload files</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {parseResult.summary.valid} of {parseResult.summary.total} rows are valid
                  {invalidCount > 0 ? ` (${invalidCount} invalid row${invalidCount === 1 ? '' : 's'} shown below)` : ''}.
                </p>
              </div>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Re-upload Excel sheet
              </button>
            </div>

            <label className="mb-1 block text-xs font-semibold text-gray-600">Document Files (PDF / DOC / DOCX)</label>
            <input
              ref={filesInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-800 hover:file:bg-emerald-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              {files.length} file{files.length === 1 ? '' : 's'} selected. Each row's "File Name" column must
              exactly match one of these filenames.
            </p>
          </div>

          <DocumentRegisterValidationResultsTable
            rows={parseResult.rows}
            includedRowNumbers={includedRowNumbers}
            onToggleRow={toggleRow}
            fileFoundByRow={fileFoundByRow}
          />

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-card">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{includedCount}</span> row{includedCount === 1 ? '' : 's'} will
              be imported.
            </p>
            <button
              type="button"
              onClick={handleImport}
              disabled={includedCount === 0 || commitMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Upload className="h-4 w-4" />
              {commitMutation.isPending ? `Importing… ${commitMutation.progress}%` : `Import ${includedCount} Document${includedCount === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}

      {step === 'summary' && commitResult && <ImportSummary result={commitResult} onStartOver={resetAll} />}
    </div>
  );
}
