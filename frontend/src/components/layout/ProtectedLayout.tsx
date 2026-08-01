import { ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { useAppSelector } from '@/hooks';
import { NotificationBell } from '@/features/notifications';

interface ProtectedLayoutProps {
  children: ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">STACconnect</span>
          </Link>
          <NotificationBell />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
