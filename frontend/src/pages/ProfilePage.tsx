import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, ShieldCheck, User } from 'lucide-react';
import { ProtectedLayout } from '@/components/layout';
import { useAppSelector } from '@/hooks';
import {
  useMeQuery,
  useForgotPasswordMutation,
  useMicrosoftSsoEnabledQuery,
  useMicrosoftLinkMutation,
  useMicrosoftUnlinkMutation,
} from '@/features/auth/hooks';
import type { ApiRole } from '@/lib/apiTypes';

const ROLE_LABELS: Record<ApiRole, string> = {
  author: 'Author',
  reviewer: 'Reviewer',
  approver: 'Approver',
  controller: 'Controller',
};

function departmentName(department: { name: string } | string | null): string {
  if (!department) return '—';
  return typeof department === 'string' ? department : department.name;
}

export function ProfilePage() {
  return (
    <ProtectedLayout>
      <ProfileContent />
    </ProtectedLayout>
  );
}

/**
 * Self-service account page — the "Authentication" section from spec §12.
 * Deliberately has no role gate: this is exactly where a first-time
 * Microsoft SSO signup with no role yet (see MSPublishingPage.tsx's
 * "Awaiting Role Assignment" screen) can still see their own account state
 * and set up a password if they want a second way in.
 */
function ProfileContent() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { data: user } = useMeQuery(isAuthenticated);
  const { data: ssoEnabled } = useMicrosoftSsoEnabledQuery();
  const forgotPassword = useForgotPasswordMutation();
  const linkMicrosoft = useMicrosoftLinkMutation();
  const unlinkMicrosoft = useMicrosoftUnlinkMutation();

  if (!user) return null;

  const canDisconnectMicrosoft = user.microsoftLinked && user.hasPassword;

  return (
    <>
      <Link
        to="/ms-publishing"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to MS Publishing
      </Link>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          <div className="bg-brand-800 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <User className="h-5 w-5 text-white" />
              <h1 className="text-lg font-bold text-white">My Profile</h1>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 p-6 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Name</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">{user.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Email</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Role</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">
                {user.role ? ROLE_LABELS[user.role] : <span className="italic text-amber-600">Awaiting assignment</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Department</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">{departmentName(user.department)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Job Title</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">{user.jobTitle || '—'}</dd>
            </div>
          </dl>
          <p className="border-t border-gray-100 px-6 py-3 text-xs text-gray-500">
            Role, department, and job title are managed by your Document Controller.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-bold text-gray-900">Authentication</h2>
            <p className="mt-0.5 text-xs text-gray-500">How you sign in to STACconnect.</p>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Email &amp; Password</p>
                  <p className="text-xs text-gray-500">{user.hasPassword ? 'Enabled' : 'Not set'}</p>
                </div>
              </div>
              {!user.hasPassword && (
                <button
                  type="button"
                  disabled={forgotPassword.isPending || forgotPassword.isSuccess}
                  onClick={() => forgotPassword.mutate(user.email)}
                  className="whitespace-nowrap rounded-lg border border-brand-700 px-3.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {forgotPassword.isSuccess ? 'Check Your Email' : forgotPassword.isPending ? 'Sending…' : 'Set Password'}
                </button>
              )}
            </div>

            {ssoEnabled && (
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Microsoft Account</p>
                    <p className="text-xs text-gray-500">{user.microsoftLinked ? 'Connected' : 'Not connected'}</p>
                  </div>
                </div>
                {user.microsoftLinked ? (
                  <button
                    type="button"
                    disabled={!canDisconnectMicrosoft || unlinkMicrosoft.isPending}
                    title={!canDisconnectMicrosoft ? 'Set a password first — otherwise you would be locked out.' : undefined}
                    onClick={() => unlinkMicrosoft.mutate()}
                    className="whitespace-nowrap rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {unlinkMicrosoft.isPending ? 'Disconnecting…' : 'Disconnect Microsoft'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={linkMicrosoft.isPending}
                    onClick={() => linkMicrosoft.mutate()}
                    className="whitespace-nowrap rounded-lg border border-brand-700 px-3.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {linkMicrosoft.isPending ? 'Redirecting…' : 'Connect Microsoft'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
