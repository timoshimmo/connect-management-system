import { X, AlertTriangle, Download, Eye, Archive, ArchiveRestore } from 'lucide-react';
import type { ApiDocument } from '@/lib/apiTypes';
import { refName } from '@/lib/apiTypes';
import { isDocumentOverdue } from '@/features/documents/utils';
import { useDocumentPreview } from '@/features/document-preview';
import { CommentsSection } from '@/features/comments';
import { StatusBadge } from './StatusBadge';
import { formatDate } from './columns';

interface DocumentDetailModalProps {
  doc: ApiDocument;
  onClose: () => void;
  /** Only passed by the Controller — shows an Archive button on Published documents. */
  onArchive?: () => void;
  /** Only passed by the Controller — shows a Restore button on Archived documents. */
  onRestore?: () => void;
}

export function DocumentDetailModal({ doc, onClose, onArchive, onRestore }: DocumentDetailModalProps) {
  const overdue = isDocumentOverdue(doc);
  const { openPreview } = useDocumentPreview();
  const currentVersion = doc.currentVersion;

  const isDrawingRegister = doc.destination === 'Drawing Register';

  const meta: [string, string][] = [
    ['Doc ID', doc.docId],
    ['Department', refName(doc.department)],
    ...(isDrawingRegister
      ? ([
          ['Drawing Number', doc.drawingNumber || '—'],
          ['Discipline', refName(doc.discipline)],
          ['Revision', doc.revision || '—'],
          ...(doc.area ? [['Area', doc.area]] : []),
        ] as [string, string][])
      : ([['Type', doc.type ?? '—']] as [string, string][])),
    ['Destination', doc.destination],
    ['Version', currentVersion?.versionNumber ?? '—'],
    ['Location', doc.location],
    ['Author', refName(doc.author)],
    ['Reviewer', refName(doc.reviewer)],
    ['Approver', refName(doc.approver)],
    ['Created', formatDate(doc.createdAt)],
    ['Published', doc.publishedAt ? formatDate(doc.publishedAt) : 'Not yet published'],
    ...(doc.status === 'Archived'
      ? ([
          ['Archived By', refName(doc.archivedBy)],
          ['Archived On', doc.archivedAt ? formatDate(doc.archivedAt) : '—'],
        ] as [string, string][])
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-brand-800 px-5 py-4">
          <h3 className="pr-3 text-sm font-bold leading-snug text-white">{doc.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5">
          {overdue && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              This document is overdue for review. Contact the author or Document Controller.
            </div>
          )}

          <div className="mb-3">
            <StatusBadge doc={doc} />
          </div>

          <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {meta.map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-800">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Next Review</dt>
              <dd className={`mt-0.5 text-sm font-medium ${overdue ? 'font-bold text-red-600' : 'text-gray-800'}`}>
                {doc.nextReviewDate ? formatDate(doc.nextReviewDate) : '—'}
              </dd>
            </div>
          </dl>

          {currentVersion && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3.5 py-2.5 text-xs text-gray-600">
              <Download className="h-3.5 w-3.5 shrink-0" />
              Attached file: <span className="font-medium text-gray-800">v{currentVersion.versionNumber} ({currentVersion.file.format})</span>
            </div>
          )}

          {doc.description && (
            <p className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{doc.description}</p>
          )}
          {doc.notes && (
            <p className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{doc.notes}</p>
          )}

          <div className="mb-4">
            <CommentsSection targetType="document" targetId={doc._id} />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4">
            <button
              type="button"
              disabled={!currentVersion}
              onClick={() =>
                currentVersion &&
                openPreview({
                  id: doc.docId,
                  title: doc.title,
                  fileUrl: currentVersion.file.url,
                  fileFormat: currentVersion.file.format,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-700 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
            {(doc.status === 'Published' || doc.status === 'Archived') && currentVersion && (
              <a
                href={currentVersion.file.url}
                download
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            )}
            {doc.status === 'Published' && onArchive && (
              <button
                type="button"
                onClick={onArchive}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            )}
            {doc.status === 'Archived' && onRestore && (
              <button
                type="button"
                onClick={onRestore}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-700 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                <ArchiveRestore className="h-3.5 w-3.5" /> Restore
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
