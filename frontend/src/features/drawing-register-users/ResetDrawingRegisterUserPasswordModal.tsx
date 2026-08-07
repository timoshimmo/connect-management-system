import { FormEvent, useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import type { ApiDrawingRegisterUser } from '@/lib/apiTypes';

interface ResetDrawingRegisterUserPasswordModalProps {
  user: ApiDrawingRegisterUser;
  onClose: () => void;
  onReset: (password: string) => void;
  isSubmitting?: boolean;
}

/**
 * Controller sets a new password directly — no email infrastructure exists
 * in this app for a self-service reset token flow (matches
 * drawingRegisterUser.service.js's resetPassword, which also signs the
 * account out of every existing session).
 */
export function ResetDrawingRegisterUserPasswordModal({
  user,
  onClose,
  onReset,
  isSubmitting,
}: ResetDrawingRegisterUserPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    onReset(password);
  }

  const inputClasses =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-brand-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-white">Reset Password</h3>
            <p className="mt-0.5 text-xs text-white/70">{user.name}</p>
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
          <p className="text-sm text-gray-600">
            Set a new password for <span className="font-semibold text-gray-800">{user.name}</span>. Their existing
            sessions will be signed out.
          </p>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">New Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className={`${inputClasses} pr-10`}
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
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Confirm New Password *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                className={`${inputClasses} pr-10`}
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
              {isSubmitting ? 'Saving…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
