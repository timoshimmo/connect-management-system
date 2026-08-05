import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import { useAppDispatch } from '@/hooks';
import { sessionEstablished } from '@/store/slices/authSlice';
import { useLoginMutation } from '@/features/auth/hooks';
import type { ApiRole } from '@/lib/apiTypes';

const ROLE_LABELS: Record<ApiRole, string> = {
  author: 'Author',
  reviewer: 'Reviewer',
  approver: 'Approver',
  controller: 'Controller',
};

/** Matches management_app/backend/src/database/seed.js — all seeded accounts share this password. */
const DEMO_ACCOUNTS: { role: ApiRole; email: string; name: string }[] = [
  { role: 'author', email: 'l.sule@stac.com', name: 'L. Sule' },
  { role: 'reviewer', email: 'a.musa@stac.com', name: 'A. Musa' },
  { role: 'approver', email: 'f.aliyu@stac.com', name: 'F. Aliyu' },
  { role: 'controller', email: 'admin@stac.com', name: 'Admin' },
];
const DEMO_PASSWORD = 'password123';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedRole = searchParams.get('role') as ApiRole | null;
  const dispatch = useAppDispatch();
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function signIn(loginEmail: string, loginPassword: string) {
    loginMutation.mutate(
      { email: loginEmail, password: loginPassword },
      {
        onSuccess: () => {
          dispatch(sessionEstablished());
          navigate('/ms-publishing');
        },
      }
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          <div className="bg-brand-800 px-6 py-5">
            <div className="mb-2 flex items-center gap-2">
              <LogIn className="h-5 w-5 text-white" />
              <span className="text-base font-bold text-white">STACconnect</span>
            </div>
            <p className="text-sm text-white/70">Management System — Sign in to continue</p>
          </div>

          <div className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                signIn(email, password);
              }}
            >
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@stac.com"
                autoComplete="username"
                className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
              />

              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="mb-5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
              />

              {loginMutation.isError && (
                <p className="mb-4 text-sm text-red-600">Invalid email or password.</p>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Quick Sign-In (Demo Accounts)
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {DEMO_ACCOUNTS.map((account) => {
                  const isRequested = requestedRole === account.role;
                  return (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => signIn(account.email, DEMO_PASSWORD)}
                      disabled={loginMutation.isPending}
                      className={`rounded-lg border px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        isRequested
                          ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                          : 'border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/50'
                      }`}
                    >
                      <p className="text-[11px] font-bold text-gray-800">{ROLE_LABELS[account.role]}</p>
                      <p className="text-[11px] text-gray-500">{account.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-gray-400">
              Demo accounts share the password "{DEMO_PASSWORD}" 
              {/* --— seeded by management_app/backend's seed script. */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
