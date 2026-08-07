import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import { ProtectedLayout } from '@/components/layout';
import { RoleGuard } from '@/components/auth';
import { useAppSelector } from '@/hooks';
import { useMeQuery } from '@/features/auth/hooks';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import { useCreateUserMutation } from '@/features/users/hooks';
import type { ApiRole, ApiUserStatus } from '@/lib/apiTypes';

const ROLE_OPTIONS: { value: ApiRole; label: string }[] = [
  { value: 'author', label: 'Author' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'approver', label: 'Approver' },
  { value: 'controller', label: 'Controller' },
];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: ApiRole | '';
  password: string;
  confirmPassword: string;
  status: ApiUserStatus;
}

const INITIAL_STATE: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  department: '',
  role: '',
  password: '',
  confirmPassword: '',
  status: 'Active',
};

export function CreateUserPage() {
  return (
    <ProtectedLayout>
      <CreateUserContent />
    </ProtectedLayout>
  );
}

function CreateUserContent() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { data: user } = useMeQuery(isAuthenticated);

  if (!user || !user.role) return null;

  return (
    <RoleGuard allow={['controller']} role={user.role}>
      <CreateUserForm />
    </RoleGuard>
  );
}

function CreateUserForm() {
  const navigate = useNavigate();
  const { data: departments = [] } = useDepartmentsQuery();
  const createUser = useCreateUserMutation();

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    if (!form.role) next.role = 'Select a role.';
    if (!form.password) {
      next.password = 'Password is required.';
    } else if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Passwords do not match.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !form.role) return;

    createUser.mutate(
      {
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        department: form.department,
        status: form.status,
      },
      {
        onSuccess: () => navigate('/ms-publishing'),
      }
    );
  }

  const inputClasses =
    'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30';

  function fieldClasses(field: keyof FormState) {
    return `${inputClasses} ${errors[field] ? 'border-red-400' : 'border-gray-300 focus:border-brand-700'}`;
  }

  return (
    <>
      <Link
        to="/ms-publishing"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to MS Publishing
      </Link>

      <div className="mx-auto max-w-2xl">
        <div className="mb-6 rounded-xl bg-brand-800 p-6">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-5 w-5 text-white" />
            <h1 className="text-xl font-bold text-white">Create New User</h1>
          </div>
          <p className="mt-1 text-sm text-white/70">
            Document Controllers can create accounts and assign roles/departments here.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-card"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                placeholder="e.g. Amina"
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
                placeholder="e.g. Bello"
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
              placeholder="amina.bello@stac.com"
              autoComplete="off"
              className={fieldClasses('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
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
                <option value="">Select...</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className={`${fieldClasses('password')} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className={`${fieldClasses('confirmPassword')} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Status</label>
            <div className="flex gap-2">
              {(['Active', 'Inactive'] as ApiUserStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setField('status', status)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    form.status === status
                      ? status === 'Active'
                        ? 'border-brand-700 bg-brand-50 text-brand-800'
                        : 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-5">
            <Link
              to="/ms-publishing"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createUser.isPending}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {createUser.isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
