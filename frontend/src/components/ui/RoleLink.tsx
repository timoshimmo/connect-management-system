import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface RoleLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  description?: string;
}

export function RoleLink({ to, icon: Icon, label, description }: RoleLinkProps) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-all hover:border-brand-200 hover:bg-brand-50/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100 transition-colors group-hover:bg-brand-100 group-hover:ring-brand-200">
        <Icon className="h-4 w-4 text-gray-600 group-hover:text-brand-700" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 group-hover:text-brand-900">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
    </Link>
  );
}
