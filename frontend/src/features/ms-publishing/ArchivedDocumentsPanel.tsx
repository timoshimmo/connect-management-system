import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import { refId } from '@/lib/apiTypes';
import type { ApiDocument, ApiDocumentType } from '@/lib/apiTypes';
import { DocumentsTable } from './DocumentsTable';
import { ActionButton } from './ActionButton';
import { titleColumn, departmentColumn, archivedByColumn, archiveReasonColumn, dateColumn } from './columns';

const DOCUMENT_TYPES: ApiDocumentType[] = ['Policy', 'Procedure', 'Standard', 'Work Instruction', 'Form'];

const inputClasses =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30';

interface ArchivedDocumentsPanelProps {
  documents: ApiDocument[];
  onView: (doc: ApiDocument) => void;
  onRestore: (doc: ApiDocument) => void;
}

/**
 * Controller-only Archived Documents view — search, department/type/archived-date
 * filters over the already-fetched document list (same client-side filtering
 * pattern the rest of MS Publishing's views use), plus View/Download/Restore
 * actions per row.
 */
export function ArchivedDocumentsPanel({ documents, onView, onRestore }: ArchivedDocumentsPanelProps) {
  const { data: departments = [] } = useDepartmentsQuery();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState<ApiDocumentType | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (term && !doc.title.toLowerCase().includes(term) && !doc.docId.toLowerCase().includes(term)) return false;
      if (department && refId(doc.department) !== department) return false;
      if (type && doc.type !== type) return false;
      if (doc.archivedAt) {
        const archived = new Date(doc.archivedAt).getTime();
        if (fromDate && archived < new Date(fromDate).getTime()) return false;
        if (toDate && archived > new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
      } else if (fromDate || toDate) {
        return false;
      }
      return true;
    });
  }, [documents, search, department, type, fromDate, toDate]);

  return (
    <DocumentsTable
      title="Archived Documents"
      documents={filtered}
      columns={[titleColumn, departmentColumn, archivedByColumn, dateColumn('archivedAt', 'Archived On'), archiveReasonColumn]}
      onTitleClick={onView}
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or Doc ID..."
              className={`${inputClasses} w-48 pl-8`}
            />
          </div>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClasses}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as ApiDocumentType | '')} className={inputClasses}>
            <option value="">All Categories</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            From
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClasses} />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            To
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClasses} />
          </label>
        </div>
      }
      renderActions={(doc) => (
        <>
          <ActionButton onClick={() => onView(doc)}>View</ActionButton>
          {doc.currentVersion && (
            <a
              href={doc.currentVersion.file.url}
              download
              className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Download
            </a>
          )}
          <ActionButton variant="primary" onClick={() => onRestore(doc)}>
            Restore
          </ActionButton>
        </>
      )}
      emptyTitle="No archived documents"
      emptyDescription="Documents you archive will appear here and can be restored at any time."
    />
  );
}
