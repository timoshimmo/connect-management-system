import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAppDispatch } from '@/hooks';
import { sessionEstablished } from '@/store/slices/authSlice';
import { useLoginMutation } from '@/features/auth/hooks';

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
              <div className="relative mb-5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
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
          </div>
        </div>
      </div>
    </div>
  );
}
