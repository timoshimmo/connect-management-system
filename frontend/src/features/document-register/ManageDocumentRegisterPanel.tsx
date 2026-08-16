import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { ApiDocument, ApiDocumentType, ApiIsoStandard } from '@/lib/apiTypes';
import { DocumentsTable, DocumentColumn, ActionButton, statusColumn, formatDate } from '@/features/ms-publishing';
import { DocumentDetailsModal } from './DocumentDetailsModal';

const DOCUMENT_TYPES: ApiDocumentType[] = [
  'Manual',
  'Policy',
  'Procedure',
  'Standard',
  'Goal',
  'Org Chart',
  'Policy Change',
  'Functional Description',
  'Form',
];

const ISO_STANDARDS: ApiIsoStandard[] = ['ISO 9001 (Quality)', 'ISO 14001 (Environment)', 'ISO 45001 (OH&S)'];

const inputClasses =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30';

const referenceColumn: DocumentColumn = {
  key: 'docId',
  header: 'Reference',
  render: (doc) => <span className="text-sm font-semibold text-gray-900">{doc.docId}</span>,
};

const registerTitleColumn: DocumentColumn = {
  key: 'title',
  header: 'Document Title',
  render: (doc) => <span className="text-sm text-gray-700">{doc.title}</span>,
};

const registerTypeColumn: DocumentColumn = {
  key: 'type',
  header: 'Type',
  render: (doc) => <span className="text-sm text-gray-700">{doc.type ?? '—'}</span>,
};

const revisionColumn: DocumentColumn = {
  key: 'revision',
  header: 'Revision',
  render: (doc) => <span className="text-sm text-gray-700">{doc.revision || '0'}</span>,
};

const issueDateColumn: DocumentColumn = {
  key: 'publishedAt',
  header: 'Issue Date',
  render: (doc) => <span className="text-sm text-gray-700">{formatDate(doc.publishedAt)}</span>,
};

// dateColumn() from ms-publishing/columns.tsx only covers createdAt/publishedAt/archivedAt —
// a separate small column here rather than widening that shared helper's key union.
const lastUpdatedColumn: DocumentColumn = {
  key: 'updatedAt',
  header: 'Last Updated',
  render: (doc) => <span className="text-sm text-gray-700">{formatDate(doc.updatedAt)}</span>,
};

interface ManageDocumentRegisterPanelProps {
  documents: ApiDocument[];
  onEdit: (doc: ApiDocument) => void;
  onArchive: (doc: ApiDocument) => void;
}

/**
 * "Created Documents" — every active (Published) Document Register document,
 * with View/Edit/Archive actions. `documents` is the already-fetched,
 * destination-filtered slice of MSPublishingContent's shared `allDocuments`
 * (useDocumentsQuery) — no separate network call. Search + Type + ISO
 * Standard filters mirror ArchivedDocumentsPanel's existing inline
 * header-filter convention (client-side, same input styling).
 */
export function ManageDocumentRegisterPanel({ documents, onEdit, onArchive }: ManageDocumentRegisterPanelProps) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<ApiDocumentType | ''>('');
  const [isoStandard, setIsoStandard] = useState<ApiIsoStandard | ''>('');
  const [detailsDoc, setDetailsDoc] = useState<ApiDocument | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (term && !doc.title.toLowerCase().includes(term) && !doc.docId.toLowerCase().includes(term)) return false;
      if (type && doc.type !== type) return false;
      if (isoStandard && !doc.isoStandards.includes(isoStandard)) return false;
      return true;
    });
  }, [documents, search, type, isoStandard]);

  return (
    <>
      <DocumentsTable
        title="Created Documents"
        documents={filtered}
        columns={[referenceColumn, registerTitleColumn, registerTypeColumn, revisionColumn, issueDateColumn, statusColumn, lastUpdatedColumn]}
        onTitleClick={setDetailsDoc}
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or Reference..."
                className={`${inputClasses} w-48 pl-8`}
              />
            </div>
            <select value={type} onChange={(e) => setType(e.target.value as ApiDocumentType | '')} className={inputClasses}>
              <option value="">All Types</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={isoStandard}
              onChange={(e) => setIsoStandard(e.target.value as ApiIsoStandard | '')}
              className={inputClasses}
            >
              <option value="">All ISO Standards</option>
              {ISO_STANDARDS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        }
        renderActions={(doc) => (
          <>
            <ActionButton onClick={() => setDetailsDoc(doc)}>View</ActionButton>
            <ActionButton onClick={() => onEdit(doc)}>Edit</ActionButton>
            <ActionButton variant="danger" onClick={() => onArchive(doc)}>
              Archive
            </ActionButton>
          </>
        )}
        emptyTitle="No Document Register documents yet"
        emptyDescription="Documents you create or bulk-import will appear here."
      />

      {detailsDoc && <DocumentDetailsModal doc={detailsDoc} onClose={() => setDetailsDoc(null)} />}
    </>
  );
}
