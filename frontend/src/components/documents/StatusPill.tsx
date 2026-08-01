interface StatusPillProps {
  label: string;
  overdue?: boolean;
  className: string;
}

/**
 * Generic status pill shared by MS Publishing and the Drawing Register —
 * each feature passes its own status label, overdue flag and color classes.
 */
export function StatusPill({ label, overdue, className }: StatusPillProps) {
  if (overdue) {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        ⚠ Overdue
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
