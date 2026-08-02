import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import type { ApiDepartment, ApiEntityStatus } from '@/lib/apiTypes';

interface DepartmentFormModalProps {
  department?: ApiDepartment;
  onClose: () => void;
  onSave: (payload: { name: string; code: string; status: ApiEntityStatus }) => void;
  isSubmitting?: boolean;
}

/** Create or edit a Department — used by Department Management in the Admin Dashboard. */
export function DepartmentFormModal({ department, onClose, onSave, isSubmitting }: DepartmentFormModalProps) {
  const [name, setName] = useState(department?.name ?? '');
  const [code, setCode] = useState(department?.code ?? '');
  const [status, setStatus] = useState<ApiEntityStatus>(department?.status ?? 'Active');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Name and code are both required.');
      return;
    }
    onSave({ name: name.trim(), code: code.trim().toUpperCase(), status });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md overflow-y-auto rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-brand-800 px-5 py-4">
          <h3 className="text-sm font-bold text-white">{department ? 'Edit Department' : 'New Department'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Health, Safety & Environment"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. HSE"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Status</label>
            <div className="flex gap-2">
              {(['Active', 'Inactive'] as ApiEntityStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    status === s
                      ? s === 'Active'
                        ? 'border-brand-700 bg-brand-50 text-brand-800'
                        : 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              Inactive departments drop out of dropdowns and Read Site/Drawing Register browsing.
            </p>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? 'Saving…' : department ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
