import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'new' | 'default' | 'warning' | 'success';
}

const variantStyles = {
  new: 'bg-brand-100 text-brand-800 border-brand-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
