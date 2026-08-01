import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { PreviewableRecord, PreviewSource } from './types';
import { resolvePreviewSource } from './resolveDocumentFileUrl';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface DocumentPreviewContextValue {
  openPreview: (record: PreviewableRecord) => void;
  closePreview: () => void;
}

const DocumentPreviewContext = createContext<DocumentPreviewContextValue | null>(null);

/**
 * Mounted once near the app root. Owns which document/drawing is currently
 * being previewed and renders the single shared DocumentPreviewModal —
 * callers anywhere in the tree just call `openPreview(record)`, no
 * prop-drilling or per-page modal state needed.
 */
export function DocumentPreviewProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<PreviewSource | null>(null);

  const openPreview = useCallback((record: PreviewableRecord) => {
    setSource(resolvePreviewSource(record));
  }, []);

  const closePreview = useCallback(() => setSource(null), []);

  const value = useMemo(() => ({ openPreview, closePreview }), [openPreview, closePreview]);

  return (
    <DocumentPreviewContext.Provider value={value}>
      {children}
      {source && <DocumentPreviewModal source={source} onClose={closePreview} />}
    </DocumentPreviewContext.Provider>
  );
}

export function useDocumentPreview() {
  const ctx = useContext(DocumentPreviewContext);
  if (!ctx) throw new Error('useDocumentPreview must be used within a DocumentPreviewProvider');
  return ctx;
}
