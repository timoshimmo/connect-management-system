import { LockClosedIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

/**
 * Dark green hero banner shared by the Read Site and the Drawing Register —
 * both pages pass their own copy; defaults match the Read Site's original
 * text so no caller needs to change.
 */
export default function PageHeader({
  title = 'Management System Read Site',
  description = 'Browse and download all approved and published management system documents. This is the single source of truth for all STAC policies, procedures and standards.',
  badgeText = 'Read-only — contact MS Publishing to submit or revise documents',
}) {
  return (
    <header className="bg-emerald-950 px-4 py-10 sm:px-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mx-auto max-w-6xl"
      >
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
