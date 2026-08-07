import { Download, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import type { ApiBulkImportCommitResult } from '@/lib/apiTypes';

interface ImportSummaryProps {
  result: ApiBulkImportCommitResult;
  onStartOver: () => void;
}

function downloadErrorReport(result: ApiBulkImportCommitResult) {
  const problemRows = result.results.filter((r) => r.status !== 'succeeded');
  const header = 'Row,Status,Error\n';
  const body = problemRows
    .map((r) => [r.row, r.status, `"${(r.error ?? '').replace(/"/g, '""')}"`].join(','))
    .join('\n');
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bulk-import-error-report.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Post-commit summary — totals plus a downloadable report of anything that didn't import. */
export function ImportSummary({ result, onStartOver }: ImportSummaryProps) {
  const problemRows = result.results.filter((r) => r.status !== 'succeeded');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{result.total}</p>
          <p className="text-xs text-gray-500">Total Rows</p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
          <p className="text-2xl font-bold text-brand-800">{result.succeeded}</p>
          <p className="text-xs text-brand-700">Succeeded</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{result.failed}</p>
          <p className="text-xs text-red-600">Failed</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{result.skipped}</p>
          <p className="text-xs text-gray-500">Skipped</p>
        </div>
      </div>

      {problemRows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Failed / Skipped Rows</h3>
            <button
              type="button"
              onClick={() => downloadErrorReport(result)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
            >
              <Download className="h-3.5 w-3.5" /> Download Error Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Row</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Reason</th>
                </tr>
              </thead>
              <tbody>
                {problemRows.map((r) => (
                  <tr key={r.row} className="border-b border-gray-50 last:border-b-0">
                    <td className="px-4 py-2.5 text-gray-600">{r.row}</td>
                    <td className="px-4 py-2.5">
                      {r.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                          <MinusCircle className="h-3.5 w-3.5" /> Skipped
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{r.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result.succeeded > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {result.succeeded} document{result.succeeded === 1 ? '' : 's'} published successfully.
        </div>
      )}

      <button
        type="button"
        onClick={onStartOver}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Start a New Import
      </button>
    </div>
  );
}
