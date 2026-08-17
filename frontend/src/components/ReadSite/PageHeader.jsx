import { Link } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

/**
 * Dark green hero banner shared by the Read Site, Drawing Register and
 * Document Register — each page passes its own copy; defaults match the
 * Read Site's original text so no caller needs to change.
 *
 * `backTo`/`backLabel` are optional — pass both to show a small back link
 * above the title (e.g. Document Register's "Back to Read Site"); omit them
 * and nothing renders, so Read Site/Drawing Register are unaffected.
 */
export default function PageHeader({
  title = 'Management System Read Site',
  description = 'Browse and download all approved and published management system documents. This is the single source of truth for all STAC policies, procedures and standards.',
  badgeText = 'Read-only — contact MS Publishing to submit or revise documents',
  backTo = '',
  backLabel = '',
}) {
  return (
    <header className="bg-emerald-950 px-4 py-10 sm:px-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mx-auto max-w-6xl"
      >
        {backTo && (
          <Link
            to={backTo}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-emerald-200 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-emerald-100 sm:text-base">{description}</p>

        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-900/60 px-4 py-1.5 text-xs font-medium text-emerald-100 ring-1 ring-inset ring-emerald-700/60 sm:text-sm">
          <LockClosedIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {badgeText}
        </span>
      </motion.div>
    </header>
  );
}
