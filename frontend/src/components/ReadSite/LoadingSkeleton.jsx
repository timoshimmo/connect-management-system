/**
 * Skeleton placeholder rows shown while the document list is loading.
 */
export default function LoadingSkeleton({ rows = 5 }) {
  return (
    <ul aria-hidden="true" className="animate-pulse divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-gray-100" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
          </div>
          <div className="hidden h-6 w-24 rounded-full bg-gray-100 sm:block" />
          <div className="h-8 w-32 rounded-lg bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}
