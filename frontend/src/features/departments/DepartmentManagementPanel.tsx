import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { ActionButton } from '@/features/ms-publishing';
import type { ApiDepartment, ApiEntityStatus } from '@/lib/apiTypes';
import {
  useDepartmentsAdminQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from './hooks';
import { DepartmentFormModal } from './DepartmentFormModal';

const PAGE_SIZE = 10;

const inputClasses =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30';

/** Admin Dashboard's Department Management section — view/create/edit/activate-deactivate/search/paginate. */
export function DepartmentManagementPanel() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApiEntityStatus | ''>('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<ApiDepartment | null>(null);

  const { data, isLoading } = useDepartmentsAdminQuery({
    search: search || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const createDepartment = useCreateDepartmentMutation();
  const updateDepartment = useUpdateDepartmentMutation();

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  function resetToFirstPage() {
    setPage(1);
  }

  function handleSave(payload: { name: string; code: string; status: ApiEntityStatus }) {
    if (editingDept) {
      updateDepartment.mutate(
        { id: editingDept.id, ...payload },
        { onSuccess: () => { setFormOpen(false); setEditingDept(null); } }
      );
    } else {
      createDepartment.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-gray-900">Departments {pagination ? `(${pagination.total})` : ''}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetToFirstPage(); }}
              placeholder="Search name or code..."
              className={`${inputClasses} w-52 pl-8`}
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as ApiEntityStatus | ''); resetToFirstPage(); }}
            className={inputClasses}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button
            type="button"
            onClick={() => { setEditingDept(null); setFormOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-brand-800"
          >
            <Plus className="h-3.5 w-3.5" /> New Department
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Code</th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Published Docs</th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-gray-500">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-gray-500">No departments match your filters.</td></tr>
            ) : (
              items.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-semibold text-gray-900">{d.name}</td>
                  <td className="px-5 py-3 text-gray-500">{d.code}</td>
                  <td className="px-5 py-3 text-gray-500">{d.publishedDocumentCount}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        d.status === 'Inactive'
                          ? 'border-gray-300 bg-gray-100 text-gray-600'
                          : 'border-brand-200 bg-brand-50 text-brand-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton onClick={() => { setEditingDept(d); setFormOpen(true); }}>Edit</ActionButton>
                      <ActionButton
                        variant={d.status === 'Active' ? 'danger' : 'primary'}
                        onClick={() =>
                          updateDepartment.mutate({ id: d.id, status: d.status === 'Active' ? 'Inactive' : 'Active' })
                        }
                      >
                        {d.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {formOpen && (
        <DepartmentFormModal
          department={editingDept ?? undefined}
          onClose={() => { setFormOpen(false); setEditingDept(null); }}
          onSave={handleSave}
          isSubmitting={createDepartment.isPending || updateDepartment.isPending}
        />
      )}
    </div>
  );
}
