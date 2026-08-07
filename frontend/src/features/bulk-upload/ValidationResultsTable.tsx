import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { ApiBulkImportRow } from '@/lib/apiTypes';

interface ValidationResultsTableProps {
  rows: ApiBulkImportRow[];
  includedRowNumbers: Set<number>;
  onToggleRow: (rowNumber: number) => void;
  fileFoundByRow: Map<number, boolean>;
}

/** Preview table shown after parsing the Excel sheet — Title/Destination/Department/Status/File Found/Validation Result, per row. */
export function ValidationResultsTable({ rows, includedRowNumbers, onToggleRow, fileFoundByRow }: ValidationResultsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Include</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Title</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Destination</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Department</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">File Found</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Validation Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const fileFound = fileFoundByRow.get(row.rowNumber) ?? false;
              const included = includedRowNumbers.has(row.rowNumber);
              return (
                <tr key={row.rowNumber} className="border-b border-gray-50 last:border-b-0 align-top hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={included}
                      disabled={row.status === 'invalid'}
                      onChange={() => onToggleRow(row.rowNumber)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-700/30 disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.data.title || <span className="text-gray-400">—</span>}
                    <div className="text-xs font-normal text-gray-400">Row {row.rowNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.data.destination || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{row.data.department || '—'}</td>
                  <td className="px-4 py-3">
                    {row.status === 'valid' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <XCircle className="h-3.5 w-3.5" /> Invalid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {fileFound ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Found
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" /> Missing
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {row.errors.length > 0 ? (
                      <ul className="list-disc space-y-0.5 pl-4 text-red-600">
                        {row.errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-brand-700">No issues</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
