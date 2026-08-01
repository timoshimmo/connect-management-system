import { X } from 'lucide-react';
import type { ApiDrawingRegisterUser } from '@/lib/apiTypes';

interface DrawingRegisterUserDetailModalProps {
  user: ApiDrawingRegisterUser;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Read-only "View" panel — mirrors features/users/UserDetailModal.tsx minus role/department. */
export function DrawingRegisterUserDetailModal({ user, onClose }: DrawingRegisterUserDetailModalProps) {
  const meta: [string, string][] = [
    ['Email', user.email],
    ['Job Title', user.jobTitle || '—'],
    ['Status', user.status],
    ['Created', formatDate(user.createdAt)],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-brand-800 px-5 py-4">
          <h3 className="text-sm font-bold text-white">{user.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5">
          <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {meta.map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex justify-end border-t border-gray-100 pt-4">
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
