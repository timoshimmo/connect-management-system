import { ConfirmModal } from '@/components/ui';
import type { ApiDocument } from '@/lib/apiTypes';

interface ArchiveConfirmModalProps {
  doc: ApiDocument;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation step before a Controller archives a Published document. */
export function ArchiveConfirmModal({ doc, isSubmitting, onConfirm, onClose }: ArchiveConfirmModalProps) {
  return (
    <ConfirmModal
      title="Archive Document"
      confirmLabel="Archive"
      variant="danger"
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
      onClose={onClose}
      message={
        <>
          <p>
            You are about to archive <span className="font-semibold text-gray-800">"{doc.title}"</span> ({doc.docId}
            ).
          </p>
          <p className="mt-3 font-semibold text-gray-800">Archived documents:</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>Will no longer appear on the Read Site.</li>
            <li>Will not be available to staff.</li>
            <li>Will remain available in the Admin Portal.</li>
            <li>Can be restored at any time.</li>
          </ul>
        </>
      }
    />
  );
}
