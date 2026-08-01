import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useResetPasswordMutation } from '@/features/auth/hooks';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const mutation = useResetPasswordMutation();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }
    if (!token) {
      setValidationError('This reset link is invalid or has expired.');
      return;
    }
    mutation.mutate({ token, password });
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          <div className="bg-brand-800 px-6 py-5">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-white" />
              <span className="text-base font-bold text-white">STACconnect</span>
            </div>
            <p className="text-sm text-white/70">Choose a new password</p>
          </div>

          <div className="p-6">
            {mutation.isSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-9 w-9 text-brand-600" />
                <p className="text-sm font-semibold text-gray-800">Password updated</p>
                <p className="text-sm text-gray-500">
                  Your password has been reset. You can now sign in with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="mt-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900"
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                />

                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                  className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                />

                {(validationError || mutation.isError) && (
                  <p className="mb-4 text-sm text-red-600">
                    {validationError ?? "Couldn't reset your password. The link may have expired."}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {mutation.isPending ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
