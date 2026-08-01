import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './pdfWorker';

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.15;

interface PdfPreviewProps {
  url: string;
}

export function PdfPreview({ url }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  function handleLoadSuccess({ numPages: total }: { numPages: number }) {
    setNumPages(total);
    setPageNumber(1);
    setError(null);
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-gray-500">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <p className="font-medium text-gray-700">Couldn't load this PDF for preview.</p>
        <p>Use Download or Open in new tab instead.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3 py-2">
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))}
          disabled={scale <= MIN_SCALE}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="w-12 text-center text-xs font-medium text-gray-600">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))}
          disabled={scale >= MAX_SCALE}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        <div className="mx-2 h-4 w-px bg-gray-300" />

        <button
          type="button"
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[92px] text-center text-xs font-medium text-gray-600">
          Page {pageNumber} of {numPages ?? '—'}
        </span>
        <button
          type="button"
          onClick={() => setPageNumber((p) => Math.min(numPages ?? p, p + 1))}
          disabled={!numPages || pageNumber >= numPages}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 px-4 py-6">
        <div className="flex justify-center">
          <Document
            file={url}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={() => setError('load-failed')}
            loading={<p className="py-16 text-sm text-gray-400">Loading document…</p>}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-lg"
              renderAnnotationLayer
              renderTextLayer
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
