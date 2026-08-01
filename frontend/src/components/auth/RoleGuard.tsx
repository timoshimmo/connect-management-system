import { ReactNode } from 'react';
import { AccessDenied } from '@/components/ui';

interface RoleGuardProps<R extends string> {
  /** Roles permitted to see `children`. */
  allow: R[];
  /** The current user's role (pass `user?.role`). */
  role: R | null | undefined;
  message?: string;
  children: ReactNode;
}

function titleCase(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Authorization gate for a section of an already-authenticated page — the
 * counterpart to ProtectedLayout/DrawingRegisterProtectedLayout (which only
 * gate on "is logged in"). Generic over the role string type so it works for
 * both MS Publishing's UserRole and the Drawing Register's DrawingRole.
 */
export function RoleGuard<R extends string>({ allow, role, message, children }: RoleGuardProps<R>) {
  if (!role || !allow.includes(role)) {
    const allowedLabel = allow.map((r) => `${titleCase(r)}s`).join(' and ');
    return <AccessDenied message={message ?? `This section is available to ${allowedLabel} only.`} />;
  }
  return <>{children}</>;
}
