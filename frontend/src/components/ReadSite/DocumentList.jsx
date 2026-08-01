import DocumentRow from './DocumentRow';
import SortDropdown from './SortDropdown';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';

/**
 * Document list container: "Showing X of Y" summary, sort control, and the
 * list of DocumentRow items (or a loading/empty state in their place).
 */
export default function DocumentList({
  documents,
  totalCount,
  sortValue,
  onSortChange,
  isLoading = false,
  onClearFilters,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-gray-500">
          Showing {documents.length} of {totalCount} published documents
        </p>
        <SortDropdown value={sortValue} onChange={onSortChange} />
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : documents.length === 0 ? (
        <EmptyState onClearFilters={onClearFilters} />
      ) : (
        <ul>
          {documents.map((document) => (
            <DocumentRow key={document.id} document={document} />
          ))}
        </ul>
      )}
    </div>
  );
}
