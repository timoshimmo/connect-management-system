import { ConfirmModal } from '@/components/ui';
import type { ApiDocument } from '@/lib/apiTypes';

interface RestoreConfirmModalProps {
  doc: ApiDocument;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation step before a Controller restores an archived document. */
export function RestoreConfirmModal({ doc, isSubmitting, onConfirm, onClose }: RestoreConfirmModalProps) {
  return (
    <ConfirmModal
      title="Restore Document"
      confirmLabel="Restore"
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
      onClose={onClose}
      message={
        <p>
          Restore <span className="font-semibold text-gray-800">"{doc.title}"</span> ({doc.docId})? It will be
          published and visible on the Read Site again immediately.
        </p>
      }
    />
  );
}
