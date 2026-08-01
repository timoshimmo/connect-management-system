import { Lock } from 'lucide-react';

interface AccessDeniedProps {
  message?: string;
}

/** Shared "Access Restricted" panel — used by RoleGuard and anywhere else a role lacks permission. */
export function AccessDenied({ message = "You don't have permission to view this section." }: AccessDeniedProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-card">
      <Lock className="mx-auto mb-3 h-7 w-7 text-gray-300" />
      <p className="mb-1 text-sm font-bold text-gray-800">Access Restricted</p>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
