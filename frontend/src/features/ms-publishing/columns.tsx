import type { ApiDocument } from '@/lib/apiTypes';
import { refName } from '@/lib/apiTypes';
import { DocumentColumn } from './DocumentsTable';
import { StatusBadge } from './StatusBadge';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const titleColumn: DocumentColumn = {
  key: 'title',
  header: 'Document',
  render: (doc) => (
    <div>
      <p className="text-sm font-semibold text-gray-900">{doc.title}</p>
      <p className="mt-0.5 text-xs text-gray-500">Doc ID: {doc.docId}</p>
    </div>
  ),
};

const DESTINATION_BADGE_CLASSES: Record<string, string> = {
  'Read Site': 'bg-brand-50 text-brand-700',
  'Drawing Register': 'bg-amber-50 text-amber-700',
  'Document Register': 'bg-emerald-50 text-emerald-700',
};

export const destinationColumn: DocumentColumn = {
  key: 'destination',
  header: 'Destination',
  render: (doc) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        DESTINATION_BADGE_CLASSES[doc.destination] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {doc.destination}
    </span>
  ),
};

export const departmentColumn: DocumentColumn = {
  key: 'department',
  header: 'Department',
  render: (doc) => <span className="text-sm text-gray-700">{refName(doc.department)}</span>,
};

export const typeColumn: DocumentColumn = {
  key: 'type',
  header: 'Type',
  // Read Site documents have a Type; Drawing Register documents don't (they
  // have a Drawing Number instead) — this column is shared across both since
  // MS Publishing's workflow tables list documents from either destination.
  render: (doc) => <span className="text-sm text-gray-700">{doc.type ?? doc.drawingNumber ?? '—'}</span>,
};

export const authorColumn: DocumentColumn = {
  key: 'author',
  header: 'Author',
  render: (doc) => <span className="text-sm text-gray-700">{refName(doc.author)}</span>,
};

export const reviewerColumn: DocumentColumn = {
  key: 'reviewer',
  header: 'Reviewer',
  render: (doc) => <span className="text-sm text-gray-700">{refName(doc.reviewer)}</span>,
};

export const approverColumn: DocumentColumn = {
  key: 'approver',
  header: 'Approver',
  render: (doc) => <span className="text-sm text-gray-700">{refName(doc.approver)}</span>,
};

export const archivedByColumn: DocumentColumn = {
  key: 'archivedBy',
  header: 'Archived By',
  render: (doc) => <span className="text-sm text-gray-700">{refName(doc.archivedBy)}</span>,
};

export const archiveReasonColumn: DocumentColumn = {
  key: 'archiveReason',
  header: 'Reason',
  render: (doc) => <span className="text-sm text-gray-700">{doc.archiveReason || '—'}</span>,
};

export const versionColumn: DocumentColumn = {
  key: 'version',
  header: 'Ver.',
  render: (doc) => <span className="text-sm text-gray-700">{doc.currentVersion?.versionNumber ?? '—'}</span>,
};

export const statusColumn: DocumentColumn = {
  key: 'status',
  header: 'Status',
  render: (doc) => <StatusBadge doc={doc} />,
};

export function dateColumn(key: 'createdAt' | 'publishedAt' | 'archivedAt', header: string): DocumentColumn {
  return {
    key,
    header,
    render: (doc: ApiDocument) => <span className="text-sm text-gray-700">{formatDate(doc[key])}</span>,
  };
}

export const nextReviewColumn: DocumentColumn = {
  key: 'nextReviewDate',
  header: 'Review Was Due',
  render: (doc) => (
    <span className="text-sm font-semibold text-red-600">
      {formatDate(doc.nextReviewDate)} ⚠
    </span>
  ),
};

export { formatDate };
