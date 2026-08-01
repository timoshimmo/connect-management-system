import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useForgotPasswordMutation } from '@/features/auth/hooks';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const mutation = useForgotPasswordMutation();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    mutation.mutate(email.trim());
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
              <KeyRound className="h-5 w-5 text-white" />
              <span className="text-base font-bold text-white">STACconnect</span>
            </div>
            <p className="text-sm text-white/70">Forgot your password?</p>
          </div>

          <div className="p-6">
            {mutation.isSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-9 w-9 text-brand-600" />
                <p className="text-sm font-semibold text-gray-800">Check your email</p>
                <p className="text-sm text-gray-500">
                  If an account exists for <span className="font-medium text-gray-700">{email}</span>,
                  we've sent a link to reset your password.
                </p>
                <Link
                  to="/login"
                  className="mt-2 text-sm font-semibold text-brand-700 hover:underline"
                >
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="mb-4 text-sm text-gray-500">
                  Enter the email address associated with your account and we'll send you a link to
                  reset your password.
                </p>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@stac.com"
                  autoComplete="username"
                  required
                  className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                />

                {mutation.isError && (
                  <p className="mb-4 text-sm text-red-600">
                    Couldn't send the reset link. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {mutation.isPending ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
