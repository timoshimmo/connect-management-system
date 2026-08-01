import { X, Download, ExternalLink, FileWarning } from 'lucide-react';
import type { PreviewSource } from './types';
import { PdfPreview } from './PdfPreview';
import { DocxPreview } from './DocxPreview';

interface DocumentPreviewModalProps {
  source: PreviewSource;
  onClose: () => void;
}

/**
 * Reusable, large responsive preview modal for PDF/DOCX attachments — shared
 * across MS Publishing, the Read Site and the Drawing Register so preview
 * logic lives in exactly one place.
 */
export function DocumentPreviewModal({ source, onClose }: DocumentPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 rounded-t-xl bg-brand-800 px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-white">{source.title}</h3>
            <p className="mt-0.5 text-xs text-white/70">
              Doc ID: {source.refId} · {source.fileName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/15 text-white hover:bg-white/25"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1">
          {source.fileType === 'pdf' && <PdfPreview url={source.url} />}
          {source.fileType === 'docx' && <DocxPreview url={source.url} fileName={source.fileName} />}
          {source.fileType === 'unsupported' && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-gray-500">
              <FileWarning className="h-6 w-6 text-amber-500" />
              <p className="font-medium text-gray-700">Preview isn't supported for this file type.</p>
              <p>Download it to view the full content.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-gray-100 px-5 py-3">
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
          </a>
          <a
            href={source.url}
            download={source.fileName}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
