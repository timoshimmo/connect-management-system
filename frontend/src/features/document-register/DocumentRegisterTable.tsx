import type { ApiDocument } from '@/lib/apiTypes';
import { DataTable, DataTableColumn } from '@/components/documents';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface DocumentRegisterTableProps {
  documents: ApiDocument[];
  isLoading?: boolean;
  /** Opens the Document Details Modal for this row — the file preview itself only opens from there, never directly. */
  onView: (doc: ApiDocument) => void;
}

/**
 * Read-only Document Register listing — no Edit/Delete, only View/Download,
 * per Section 2 ("documents read-only from this page"). Reuses the shared
 * DataTable shell rather than MS Publishing's title+docId combined column,
 * since the screenshot calls for Reference and Document Title as separate
 * columns.
 */
export function DocumentRegisterTable({ documents, isLoading, onView }: DocumentRegisterTableProps) {
  const columns: DataTableColumn<ApiDocument>[] = [
    {
      key: 'documentRegisterReference',
      header: 'Reference',
      render: (doc) => <span className="text-sm font-semibold text-gray-900">{doc.documentRegisterReference}</span>,
    },
    {
      key: 'title',
      header: 'Document Title',
      render: (doc) => <span className="text-sm text-gray-700">{doc.title}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (doc) => (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {doc.type ?? '—'}
        </span>
      ),
    },
    {
      key: 'isoClauses',
      header: 'ISO Clauses',
      render: (doc) => <span className="text-sm text-gray-700">{doc.isoClauses || '—'}</span>,
    },
    {
      key: 'revision',
      header: 'Rev.',
      render: (doc) => <span className="text-sm text-gray-700">{doc.revision || '0'}</span>,
    },
    {
      key: 'issued',
      header: 'Issued',
      render: (doc) => <span className="text-sm text-gray-700">{formatDate(doc.publishedAt)}</span>,
    },
  ];

  const renderActions = (doc: ApiDocument) => {
    const fileUrl = doc.currentVersion?.file.url ?? null;
    const fileName = doc.currentVersion?.file.originalFilename;
    return (
      <>
        <button
          type="button"
          onClick={() => onView(doc)}
          className="inline-flex items-center rounded-lg border border-emerald-800 px-2.5 py-1 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-800 hover:text-white"
        >
          View
        </button>
        {fileUrl && (
          <a
            href={fileUrl}
            download={fileName}
            className="inline-flex items-center rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Download
          </a>
        )}
      </>
    );
  };

  return (
    <DataTable
      title="Document Register"
      rows={documents}
      getRowKey={(doc) => doc._id}
      columns={columns}
      renderActions={renderActions}
      emptyTitle={isLoading ? 'Loading…' : 'No documents found'}
      emptyDescription={isLoading ? 'Fetching documents from the Document Register…' : 'Try adjusting your search or filters.'}
    />
  );
}
