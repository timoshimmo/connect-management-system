import { ReactNode } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useDrawingRegisterLogoutMutation } from '@/features/drawing-register-auth/hooks';
import { drawingRegisterSessionEnded } from '@/store/slices/drawingRegisterAuthSlice';

interface DrawingRegisterProtectedLayoutProps {
  children: ReactNode;
}

/**
 * Mirrors ProtectedLayout's shell, but gated on the separate
 * `drawingRegisterAuth` slice — a Drawing Register session is completely
 * independent of MS Publishing's, so this never shares state with
 * ProtectedLayout. No NotificationBell here: Drawing Register accounts have
 * no MS Publishing notifications (they can't authenticate against that API
 * at all — see middlewares/auth.js's cross-token rejection).
 */
export function DrawingRegisterProtectedLayout({ children }: DrawingRegisterProtectedLayoutProps) {
  const isAuthenticated = useAppSelector((state) => state.drawingRegisterAuth.isAuthenticated);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const logoutMutation = useDrawingRegisterLogoutMutation();

  if (!isAuthenticated) {
    return <Navigate to="/drawing-register/login" replace />;
  }

  function handleSignOut() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        dispatch(drawingRegisterSessionEnded());
        navigate('/drawing-register/login');
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">STAC Management System</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
