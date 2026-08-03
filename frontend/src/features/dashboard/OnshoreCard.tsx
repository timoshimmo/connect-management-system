import { Link } from 'react-router-dom';
import { useReadSiteDepartmentsQuery } from '@/features/read-site';

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+&\s+|\s+/g, '-');
}

/**
 * Plain department directory for the Dashboard landing page — links straight
 * into the Read Site's department-filtered view. Departments come live from
 * the Department collection (see Department Management); "STAC MOC" is a
 * fixed, informational-only entry, not wired to anything yet.
 */
export function OnshoreCard() {
  const { data: departments = [] } = useReadSiteDepartmentsQuery();

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <h3 className="border-b border-gray-100 pb-2.5 text-sm font-semibold text-gray-900">
        Management System Onshore
      </h3>
      <ul className="mt-3 space-y-2.5">
        {departments.map((dept) => (
          <li key={dept.id}>
            <Link
              to={`/read-site/${slugify(dept.name)}`}
              className="text-sm text-gray-700 transition-colors hover:text-brand-700 hover:underline"
            >
              {dept.name}
            </Link>
          </li>
        ))}
        <li>
          <span className="text-sm text-gray-400">STAC MOC</span>
        </li>
      </ul>
    </div>
  );
}
