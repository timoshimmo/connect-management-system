import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Search + filter row for the Read Site: free-text search plus department
 * and type selects. Filtering itself is reactive (handled by the parent via
 * useDocumentFilters as the user types/selects); the Search button and
 * onSearch callback exist for parity with the reference design and any
 * future "submit search" analytics hook.
 */
export default function SearchBar({
  query,
  onQueryChange,
  department,
  onDepartmentChange,
  departments,
  type,
  onTypeChange,
  types,
  onSearch,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search documents by title, keyword or Doc ID..."
          aria-label="Search documents"
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
        />
      </div>

      <select
        value={department}
        onChange={(event) => onDepartmentChange(event.target.value)}
        aria-label="Filter by department"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
      >
        <option value="all">All Departments</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>

      <select
        value={type}
        onChange={(event) => onTypeChange(event.target.value)}
        aria-label="Filter by type"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
      >
        <option value="all">All Types</option>
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onSearch}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
      >
        Search
      </button>
    </div>
  );
}
