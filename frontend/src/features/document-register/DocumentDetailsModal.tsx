import { X, Eye, Download, FileText } from 'lucide-react';
import { useDocumentPreview } from '@/features/document-preview';
import type { ApiDocument } from '@/lib/apiTypes';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// "ISO 9001 (Quality)" -> "9001" — condenses the full enum labels into the
// screenshot's "ISO 9001/14001/45001 Cl. 4-10" style summary line.
function isoStandardNumbers(standards: string[]): string {
  return standards.map((s) => s.match(/\d+/)?.[0]).filter(Boolean).join('/');
}

interface DocumentDetailsModalProps {
  doc: ApiDocument;
  onClose: () => void;
}

/**
 * Read-only metadata review step between the Document Register table and
 * the actual file preview — clicking "View" in the table opens this first,
 * not the preview directly, so users can check what a document is before
 * opening the file (see the Document Register spec's "two separate stages"
 * requirement). "Preview" here reuses the exact same
 * DocumentPreviewProvider/openPreview the Read Site, Drawing Register and MS
 * Publishing already share — there is only ever one preview implementation.
 */
export function DocumentDetailsModal({ doc, onClose }: DocumentDetailsModalProps) {
  const { openPreview } = useDocumentPreview();
  const fileUrl = doc.currentVersion?.file.url ?? null;
  const fileFormat = doc.currentVersion?.file.format ?? null;
  const fileName = doc.currentVersion?.file.originalFilename ?? null;

  function handlePreview() {
    if (!fileUrl) return;
    openPreview({ id: doc._id, title: doc.title, fileUrl, fileFormat });
    onClose();
  }

  const isoSummary = doc.isoStandards.length
    ? `ISO ${isoStandardNumbers(doc.isoStandards)}${doc.isoClauses ? ` Cl. ${doc.isoClauses}` : ''}`
    : doc.isoClauses || '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-emerald-950 px-5 py-4">
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
          <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Reference No.</p>
              <p className="mt-1 text-sm font-semibold text-emerald-800">{doc.docId}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Document Type</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{doc.type ?? '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Issue Date</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{formatDate(doc.publishedAt)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Revision</p>
              <p className="mt-1 text-sm font-medium text-gray-800">Rev {doc.revision || '0'}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">ISO Clauses Covered</p>
            <p className="mt-1 text-sm font-medium text-gray-800">{isoSummary}</p>
          </div>

          <div className="mb-4">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">File Name</p>
            {fileName ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                {fileName}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No file has been uploaded for this document yet.</p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4">
            <button
              type="button"
              disabled={!fileUrl}
              onClick={handlePreview}
              title={fileUrl ? undefined : 'No file has been uploaded for this document yet'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
            {fileUrl && (
              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
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
