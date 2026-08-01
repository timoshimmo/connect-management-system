/**
 * Small pill used to tag a document row with its owning department.
 */
export default function DepartmentBadge({ department }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
      {department}
    </span>
  );
}
