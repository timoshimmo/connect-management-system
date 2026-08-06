import { ButtonHTMLAttributes } from 'react';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
}

const VARIANT_CLASSES: Record<NonNullable<ActionButtonProps['variant']>, string> = {
  default: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  primary: 'border border-brand-700 bg-brand-700 text-white hover:bg-brand-800',
  danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
};

/** Small pill action button used across MS Publishing tables (Edit, Approve, Reject, ...). */
export function ActionButton({ variant = 'default', className = '', ...props }: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
