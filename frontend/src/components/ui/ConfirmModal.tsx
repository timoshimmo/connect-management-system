import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  isSubmitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const VARIANT_CLASSES: Record<NonNullable<ConfirmModalProps['variant']>, string> = {
  default: 'bg-brand-700 hover:bg-brand-800',
  danger: 'bg-red-600 hover:bg-red-700',
};

/**
 * Generic confirm-before-you-act dialog — used anywhere a destructive or
 * hard-to-reverse action (archive, restore, deactivate) needs an explicit
 * "are you sure" step instead of firing straight off a table action button.
 */
export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isSubmitting = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-brand-800 px-5 py-4">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5">
          <div className="text-sm text-gray-600">{message}</div>

          <div className="mt-5 flex justify-end gap-2.5 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]}`}
            >
              {isSubmitting ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
