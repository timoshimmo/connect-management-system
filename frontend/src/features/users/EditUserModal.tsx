import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import type { ApiRole, ApiUser, ApiUserStatus } from '@/lib/apiTypes';

function departmentId(department: ApiUser['department']): string {
  if (!department) return '';
  return typeof department === 'string' ? department : department.id;
}
import type { UpdateUserPayload } from './hooks';

const ROLE_OPTIONS: { value: ApiRole; label: string }[] = [
  { value: 'author', label: 'Author' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'approver', label: 'Approver' },
  { value: 'controller', label: 'Controller' },
];

interface EditUserModalProps {
  user: ApiUser;
  /** True when editing the signed-in Controller's own account — they can't deactivate themselves. */
  isOwnAccount?: boolean;
  onClose: () => void;
  onSave: (payload: Omit<UpdateUserPayload, 'id'>) => void;
  isSubmitting?: boolean;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: ApiRole;
  jobTitle: string;
  status: ApiUserStatus;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName: firstName ?? '', lastName: rest.join(' ') };
}

/**
 * Edit an existing user's profile — everything Create User collects except
 * password, which stays a separate reset/forgot-password concern (per the
 * "do not require password changes when editing" requirement).
 */
export function EditUserModal({ user, isOwnAccount, onClose, onSave, isSubmitting }: EditUserModalProps) {
  const { data: departments = [] } = useDepartmentsQuery();
  const { firstName: initialFirst, lastName: initialLast } = splitName(user.name);

  const [form, setForm] = useState<FormState>({
    firstName: initialFirst,
    lastName: initialLast,
    email: user.email,
    department: departmentId(user.department),
    role: user.role,
    jobTitle: user.jobTitle ?? '',
    status: user.status,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!form.email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!form.department) next.department = 'Select a department.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      department: form.department,
      role: form.role,
      jobTitle: form.jobTitle.trim(),
      status: form.status,
    });
  }

  const inputClasses =
    'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30';

  function fieldClasses(field: keyof FormState) {
    return `${inputClasses} ${errors[field] ? 'border-red-400' : 'border-gray-300 focus:border-brand-700'}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-brand-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-white">Edit User</h3>
            <p className="mt-0.5 text-xs text-white/70">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                className={fieldClasses('firstName')}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Last Name *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                className={fieldClasses('lastName')}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              className={fieldClasses('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Job Title</label>
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => setField('jobTitle', e.target.value)}
              placeholder="e.g. HSE Coordinator"
              className={fieldClasses('jobTitle')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Department *</label>
              <select
                value={form.department}
                onChange={(e) => setField('department', e.target.value)}
                className={fieldClasses('department')}
              >
                <option value="">Select...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setField('role', e.target.value as ApiRole)}
                className={fieldClasses('role')}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Status</label>
            <div className="flex gap-2">
              {(['Active', 'Inactive'] as ApiUserStatus[]).map((status) => {
                const disabled = status === 'Inactive' && isOwnAccount;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={disabled}
                    title={disabled ? 'You cannot deactivate your own account' : undefined}
                    onClick={() => setField('status', status)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      form.status === status
                        ? status === 'Active'
                          ? 'border-brand-700 bg-brand-50 text-brand-800'
                          : 'border-gray-400 bg-gray-100 text-gray-700'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            {isOwnAccount && (
              <p className="mt-1.5 text-xs text-gray-500">You cannot deactivate your own account.</p>
            )}
          </div>

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
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
