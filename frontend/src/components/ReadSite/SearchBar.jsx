import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Search + filter row for the Read Site and Drawing Register: free-text
 * search plus department and type selects. Filtering itself is reactive
 * (handled by the parent via useDocumentFilters as the user types/selects);
 * the Search button and onSearch callback exist for parity with the
 * reference design and any future "submit search" analytics hook.
 *
 * The Department select is optional — pass `departments` to show it (Read
 * Site and Drawing Register both do); omit it (as the Document Register
 * does, which has no department-based browsing) and it doesn't render.
 *
 * The Discipline select is Drawing Register-only — pass `discipline`,
 * `onDisciplineChange` and `disciplines` to show it (see
 * DrawingRegisterPage.tsx); omit them (as ReadSitePage.tsx does) and it
 * doesn't render, since Read Site documents never have a discipline.
 *
 * The ISO Standard select is Document Register-only — pass `isoStandard`,
 * `onIsoStandardChange` and `isoStandards` to show it; omit them and it
 * doesn't render, since only Document Register documents carry ISO metadata.
 *
 * @param {{
 *   query: string,
 *   onQueryChange: (value: string) => void,
 *   department?: string,
 *   onDepartmentChange?: (value: string) => void,
 *   departments?: { id: string, name: string }[] | null,
 *   type: string,
 *   onTypeChange: (value: string) => void,
 *   types: string[],
 *   discipline?: string,
 *   onDisciplineChange?: (value: string) => void,
 *   disciplines?: string[] | null,
 *   isoStandard?: string,
 *   onIsoStandardChange?: (value: string) => void,
 *   isoStandards?: string[] | null,
 *   onSearch: () => void,
 * }} props
 */
export default function SearchBar({
  query,
  onQueryChange,
  department = 'all',
  onDepartmentChange = () => {},
  departments = null,
  type,
  onTypeChange,
  types,
  discipline = 'all',
  onDisciplineChange = () => {},
  disciplines = null,
  isoStandard = 'all',
  onIsoStandardChange = () => {},
  isoStandards = null,
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

      {departments && (
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
      )}

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

      {disciplines && (
        <select
          value={discipline}
          onChange={(event) => onDisciplineChange(event.target.value)}
          aria-label="Filter by discipline"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
        >
          <option value="all">All Disciplines</option>
          {disciplines.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      )}

      {isoStandards && (
        <select
          value={isoStandard}
          onChange={(event) => onIsoStandardChange(event.target.value)}
          aria-label="Filter by ISO standard"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
        >
          <option value="all">All ISO Standards</option>
          {isoStandards.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

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
