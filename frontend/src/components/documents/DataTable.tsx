import { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  title: string;
  rows: T[];
  getRowKey: (row: T) => string;
  columns: DataTableColumn<T>[];
  renderActions?: (row: T) => ReactNode;
  onTitleClick?: (row: T) => void;
  headerAction?: ReactNode;
  banner?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

/**
 * Generic table shell shared by every list view across MS Publishing and the
 * Drawing Register — each feature supplies its own row type, columns and a
 * row-key getter instead of a bespoke table component per module.
 */
export function DataTable<T>({
  title,
  rows,
  getRowKey,
  columns,
  renderActions,
  onTitleClick,
  headerAction,
  banner,
  emptyTitle = 'Nothing here',
  emptyDescription = 'There is nothing to show in this view right now.',
  emptyAction,
}: DataTableProps<T>) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      {banner}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-gray-900">
          {title} ({rows.length})
        </h2>
        {headerAction}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <CheckCircle2 className="h-8 w-8 text-gray-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-gray-900">{emptyTitle}</p>
          <p className="max-w-sm text-sm text-gray-500">{emptyDescription}</p>
          {emptyAction}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 ${col.headerClassName ?? ''}`}
                  >
                    {col.header}
                  </th>
                ))}
                {renderActions && (
                  <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={getRowKey(row)} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60">
                  {columns.map((col, i) => (
                    <td key={col.key} className={`px-5 py-3 align-middle ${col.cellClassName ?? ''}`}>
                      {i === 0 && onTitleClick ? (
                        <button
                          type="button"
                          onClick={() => onTitleClick(row)}
                          className="text-left hover:underline"
                        >
                          {col.render(row)}
                        </button>
                      ) : (
                        col.render(row)
                      )}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-5 py-3 align-middle">
                      <div className="flex flex-wrap gap-2">{renderActions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
