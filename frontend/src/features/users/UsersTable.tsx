import { ReactNode, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import { ActionButton } from '@/features/ms-publishing';
import type { ApiRole, ApiUser, ApiUserStatus } from '@/lib/apiTypes';

const ROLE_LABELS: Record<ApiRole, string> = {
  author: 'Author',
  reviewer: 'Reviewer',
  approver: 'Approver',
  controller: 'Controller',
};

const PAGE_SIZE = 10;

type SortKey = 'name' | 'department' | 'createdAt';

function departmentName(department: ApiUser['department']): string {
  if (!department) return '—';
  return typeof department === 'string' ? department : department.name;
}

const inputClasses =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30';

interface UsersTableProps {
  users: ApiUser[];
  onView: (user: ApiUser) => void;
  onEdit: (user: ApiUser) => void;
  onToggleStatus: (user: ApiUser) => void;
  headerAction?: ReactNode;
}

/** Searchable, filterable, sortable, paginated user roster — the Controller's user-management table. */
export function UsersTable({ users, onView, onEdit, onToggleStatus, headerAction }: UsersTableProps) {
  const { data: departments = [] } = useDepartmentsQuery();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<ApiRole | ''>('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<ApiUserStatus | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = users.filter((u) => {
      if (term && !u.name.toLowerCase().includes(term) && !u.email.toLowerCase().includes(term)) return false;
      if (role && u.role !== role) return false;
      if (status && u.status !== status) return false;
      if (department) {
        const deptId = typeof u.department === 'string' ? u.department : u.department?.id;
        if (deptId !== department) return false;
      }
      return true;
    });

    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'department') cmp = departmentName(a.department).localeCompare(departmentName(b.department));
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [users, search, role, department, status, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetToFirstPage() {
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortHeader({ label, sortKeyValue }: { label: string; sortKeyValue: SortKey }) {
    const active = sortKey === sortKeyValue;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKeyValue)}
        className="inline-flex items-center gap-1 hover:text-gray-700"
      >
        {label}
        {active && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Users ({filtered.length})</h2>
          {headerAction}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetToFirstPage();
              }}
              placeholder="Search name or email..."
              className={`${inputClasses} w-52 pl-8`}
            />
          </div>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as ApiRole | '');
              resetToFirstPage();
            }}
            className={inputClasses}
          >
            <option value="">All Roles</option>
            {(Object.keys(ROLE_LABELS) as ApiRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              resetToFirstPage();
            }}
            className={inputClasses}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ApiUserStatus | '');
              resetToFirstPage();
            }}
            className={inputClasses}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <SortHeader label="Name" sortKeyValue="name" />
              </th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <SortHeader label="Department" sortKeyValue="department" />
              </th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Role
              </th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <SortHeader label="Created" sortKeyValue="createdAt" />
              </th>
              <th className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-sm text-gray-500">
                  No users match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-semibold text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3 text-gray-500">{departmentName(u.department)}</td>
                  <td className="px-5 py-3 text-gray-700">{ROLE_LABELS[u.role]}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        u.status === 'Inactive'
                          ? 'border-gray-300 bg-gray-100 text-gray-600'
                          : 'border-brand-200 bg-brand-50 text-brand-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton onClick={() => onView(u)}>View</ActionButton>
                      <ActionButton onClick={() => onEdit(u)}>Edit</ActionButton>
                      <ActionButton variant={u.status === 'Active' ? 'danger' : 'primary'} onClick={() => onToggleStatus(u)}>
                        {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
