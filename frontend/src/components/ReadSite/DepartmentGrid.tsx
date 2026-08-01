import { Link } from 'react-router-dom';
import { Squares2X2Icon } from '@heroicons/react/24/outline';
import DepartmentCard, { Department } from './DepartmentCard';
import { FEATURES } from '@/config/features';

interface DepartmentGridProps {
  departments: Department[];
  onSelectDepartment: (department: Department) => void;
  onContactController: () => void;
  /** False on the Drawing Register page itself, so it doesn't link back to where it already is. */
  showDrawingRegisterLink?: boolean;
}

/**
 * "Browse by Department" section: a section title, the reusable
 * "Contact Document Controller" action, and a responsive card grid
 * (4 cols desktop / 2 cols tablet / 1 col mobile). Shared by the Read Site
 * and the Drawing Register pages.
 */
export default function DepartmentGrid({
  departments,
  onSelectDepartment,
  onContactController,
  showDrawingRegisterLink = true,
}: DepartmentGridProps) {
  return (
    <section aria-labelledby="browse-by-department-heading" className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="browse-by-department-heading" className="text-lg font-semibold text-gray-900">
          Browse by Department
        </h2>

        <div className="flex flex-col gap-2.5 self-start sm:flex-row sm:self-auto">
          {FEATURES.drawingRegister && showDrawingRegisterLink && (
            <Link
              to="/drawing-register"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-800 transition-colors duration-200 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
              Drawings and Diagrams
            </Link>
          )}
          <button
            type="button"
            onClick={onContactController}
            className="inline-flex items-center justify-center rounded-lg border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-800 transition-colors duration-200 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          >
            Contact Document Controller
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {departments.map((department) => (
          <DepartmentCard
            key={department.id}
            department={department}
            onSelect={onSelectDepartment}
          />
        ))}
      </div>
    </section>
  );
}
