import { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

interface PublicLayoutProps {
  children?: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-900">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-900"></span>
              <span className="ml-1.5 text-sm text-gray-500">
                Management System
              </span>
            </div>
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            Sign In
          </Link>
        </div>
      </header>
      <main>{children ?? <Outlet />}</main>
    </div>
  );
}
