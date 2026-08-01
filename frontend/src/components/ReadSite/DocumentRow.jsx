import { DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import DepartmentBadge from './DepartmentBadge';
import { useDocumentPreview } from '@/features/document-preview';

const FILE_TYPE_LABEL = {
  pdf: 'PDF',
  docx: 'Word',
};

/**
 * Single document row. The action button label reflects the underlying
 * file type (Word or PDF) so users know what they're about to open.
 */
export default function DocumentRow({ document }) {
  const { openPreview } = useDocumentPreview();
  const fileLabel = FILE_TYPE_LABEL[document.fileType] ?? document.fileType.toUpperCase();
  const publishedDate = new Date(document.publishedDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.li
      whileHover={{ backgroundColor: 'rgba(6, 78, 59, 0.03)' }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
          <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900">{document.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Doc ID: {document.docId} · Version: {document.version} · Approved By:{' '}
            {document.approvedBy}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <DepartmentBadge department={document.department} />
        <span className="hidden text-sm text-gray-500 sm:inline">{publishedDate}</span>
        <button
          type="button"
          onClick={() =>
            openPreview({
              id: document.docId,
              title: document.title,
              attachedFileName: `${document.docId}.${document.fileType}`,
              fileUrl: document.fileUrl,
              fileFormat: document.fileType,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800 px-3.5 py-1.5 text-sm font-medium text-emerald-800 transition-colors duration-200 hover:bg-emerald-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
        >
          <EyeIcon className="h-4 w-4" aria-hidden="true" />
          View / Download ({fileLabel})
        </button>
      </div>
    </motion.li>
  );
}
