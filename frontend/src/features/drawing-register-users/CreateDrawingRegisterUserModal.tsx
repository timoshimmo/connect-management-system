import { FormEvent, useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import type { ApiUserStatus } from '@/lib/apiTypes';
import type { CreateDrawingRegisterUserPayload } from './hooks';

interface CreateDrawingRegisterUserModalProps {
  onClose: () => void;
  onCreate: (payload: CreateDrawingRegisterUserPayload) => void;
  isSubmitting?: boolean;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  password: string;
  confirmPassword: string;
  status: ApiUserStatus;
}

const INITIAL_STATE: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  jobTitle: '',
  password: '',
  confirmPassword: '',
  status: 'Active',
};

/** Mirrors pages/CreateUserPage.tsx's form fields minus role/department — Drawing Register accounts have neither. */
export function CreateDrawingRegisterUserModal({ onClose, onCreate, isSubmitting }: CreateDrawingRegisterUserModalProps) {
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
    if (!validate()) return;
    onCreate({
      name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      password: form.password,
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
          <h3 className="text-sm font-bold text-white">Create Drawing Register User</h3>
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
                placeholder="e.g. Emeka"
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
                placeholder="e.g. Adeyemi"
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
              placeholder="emeka.adeyemi@stac.com"
              autoComplete="off"
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
              placeholder="e.g. Piping Engineer"
              className={fieldClasses('jobTitle')}
            />
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
              {isSubmitting ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
