import type { ApiDocument } from '@/lib/apiTypes';
import { isDocumentOverdue } from '@/features/documents/utils';
import { StatusPill } from '@/components/documents';

const STATUS_STYLES: Record<ApiDocument['status'], string> = {
  Draft: 'bg-amber-50 text-amber-700 border-amber-200',
  'Pending Assignment': 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Review': 'bg-blue-50 text-blue-700 border-blue-200',
  'Pending Approval': 'bg-blue-50 text-blue-700 border-blue-200',
  'Pending Publishing': 'bg-purple-50 text-purple-700 border-purple-200',
  Published: 'bg-brand-50 text-brand-800 border-brand-200',
  Archived: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function StatusBadge({ doc }: { doc: ApiDocument }) {
  return <StatusPill label={doc.status} overdue={isDocumentOverdue(doc)} className={STATUS_STYLES[doc.status]} />;
}
