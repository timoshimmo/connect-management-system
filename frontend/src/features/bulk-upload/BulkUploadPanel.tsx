import { useMemo, useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import type { ApiBulkImportCommitResult, ApiBulkImportParseResult, ApiBulkImportRow } from '@/lib/apiTypes';
import { useCommitBulkImportMutation, useDownloadTemplate, useParseBulkImportMutation } from './hooks';
import { ValidationResultsTable } from './ValidationResultsTable';
import { ImportSummary } from './ImportSummary';

type Step = 'upload-excel' | 'review' | 'summary';

function fileKey(name: string) {
  return name.trim().toLowerCase();
}

/**
 * Document Controller-only wizard: download the Excel template, upload it
 * for validation, upload the matching document files, then import — every
 * valid row is published immediately (bypasses the normal draft/review
 * workflow). See backend/src/modules/documents/bulkImport.service.js.
 */
export function BulkUploadPanel() {
  const [step, setStep] = useState<Step>('upload-excel');
  const [parseResult, setParseResult] = useState<ApiBulkImportParseResult | null>(null);
  const [includedRowNumbers, setIncludedRowNumbers] = useState<Set<number>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [commitResult, setCommitResult] = useState<ApiBulkImportCommitResult | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const { download: downloadTemplate, isDownloading } = useDownloadTemplate();
  const parseMutation = useParseBulkImportMutation();
  const commitMutation = useCommitBulkImportMutation();

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
    const rows: ApiBulkImportRow[] = parseResult.rows.filter((r) => includedRowNumbers.has(r.rowNumber));
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
            <h2 className="text-base font-semibold text-gray-900">Bulk Upload Documents</h2>
            <p className="mt-1 text-sm text-gray-500">
              Onboard existing/historical documents in bulk. Every valid row is published immediately — this
              skips the normal draft/review/approval workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={isDownloading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-700 px-3.5 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {isDownloading ? 'Downloading…' : 'Download Excel Template'}
          </button>
        </div>
      </div>

      {step === 'upload-excel' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Step 1 — Upload the filled-in Excel sheet</h3>
          <p className="mb-4 text-sm text-gray-500">
            We'll validate every row (required fields, department/discipline/author lookups, duplicate numbers)
            before anything is imported.
          </p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center hover:border-brand-400 hover:bg-brand-50/30">
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
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              {files.length} file{files.length === 1 ? '' : 's'} selected. Each row's "File Name" column must
              exactly match one of these filenames.
            </p>
          </div>

          <ValidationResultsTable
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
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
