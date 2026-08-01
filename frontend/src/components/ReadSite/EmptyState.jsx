import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Shown when a search/filter combination returns no documents.
 */
export default function EmptyState({ onClearFilters }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <DocumentMagnifyingGlassIcon className="h-10 w-10 text-gray-300" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-700">No documents match your search</p>
      <p className="max-w-sm text-sm text-gray-500">
        Try a different keyword, or clear your filters to see all published documents.
      </p>
      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-1 rounded-lg border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-800 transition-colors duration-200 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
