import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface DepartmentLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  count?: number;
}

export function DepartmentLink({
  to,
  icon: Icon,
  label,
  count,
}: DepartmentLinkProps) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3 transition-all hover:border-brand-200 hover:bg-brand-50/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-gray-100 transition-colors group-hover:bg-brand-100 group-hover:ring-brand-200">
          <Icon className="h-4 w-4 text-gray-600 group-hover:text-brand-700" />
        </div>
        <span className="text-sm font-medium text-gray-900 group-hover:text-brand-900">
          {label}
        </span>
      </div>
      {count !== undefined && (
        <span className="text-xs font-medium text-gray-400">{count}</span>
      )}
    </Link>
  );
}
