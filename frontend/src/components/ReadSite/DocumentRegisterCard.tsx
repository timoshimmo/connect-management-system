import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useDocumentRegisterDocumentsQuery, useDocumentRegisterTypesQuery } from '@/features/document-register';

const PREVIEW_LIMIT = 3;

interface DocumentRegisterCardProps {
  /** The Read Site's own search box query — when non-empty, the mini preview table
   * on the right switches from "a few recent documents" to live Document Register
   * search matches, so a Read Site search that hits a controlled document surfaces
   * it here too. */
  searchQuery?: string;
}

/**
 * Read Site entry point into the dedicated Document Register page — title,
 * description, read-only indicator, a live document count, and a small
 * preview table of matching/recent Document Register documents. Clicking a
 * preview row deep-links into /document-register?doc=<id>, which opens that
 * document's details modal directly (see DocumentRegisterPage.tsx). This is
 * still just an entry point/preview — the full register lives on its own page.
 */
export default function DocumentRegisterCard({ searchQuery = '' }: DocumentRegisterCardProps) {
  const navigate = useNavigate();
  const { data: typeCounts = [] } = useDocumentRegisterTypesQuery();
  const totalCount = typeCounts.reduce((sum, t) => sum + t.count, 0);

  const { data: matchingDocs = [] } = useDocumentRegisterDocumentsQuery({
    search: searchQuery || undefined,
  });
  const previewDocs = matchingDocs.slice(0, PREVIEW_LIMIT);
  const isSearching = searchQuery.trim().length > 0;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-8">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col gap-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:flex-row"
      >
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            <FolderIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Controlled Documents
          </div>
          <h3 className="mt-2 text-lg font-bold text-gray-900">QHSE Management System — Document Register</h3>
          <p className="mt-2 text-sm text-gray-500">
            Browse the controlled Management System documents, revisions, references and issue
            information.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
            <LockClosedIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Read-only Access
          </div>

          <div className="mt-4 flex flex-1 items-end justify-between gap-3">
            <Link
              to="/document-register"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline"
            >
              Open Document Register
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
            <span className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {totalCount} controlled document{totalCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="w-full shrink-0 overflow-hidden rounded-lg border border-gray-200 sm:w-96">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-3 py-2 font-semibold uppercase tracking-wide text-gray-400">Reference</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide text-gray-400">Title</th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide text-gray-400">
                  Rev
                </th>
              </tr>
            </thead>
            <tbody>
              {previewDocs.map((doc) => (
                <tr
                  key={doc._id}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open ${doc.title} in the Document Register`}
                  className="cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-emerald-50/60 focus:bg-emerald-50/60 focus:outline-none"
                  onClick={() => navigate(`/document-register?doc=${doc._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/document-register?doc=${doc._id}`);
                    }
                  }}
                >
                  <td className="px-3 py-2 font-medium text-emerald-800">{doc.documentRegisterReference}</td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-gray-700">{doc.title}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-gray-500">
                    Rev {doc.revision || '0'}
                  </td>
                </tr>
              ))}
              {previewDocs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-gray-400">
                    {isSearching ? 'No matching controlled documents.' : 'No controlled documents yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </section>
  );
}
