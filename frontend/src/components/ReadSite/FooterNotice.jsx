/**
 * Light amber notice shown at the bottom of the page. Shared by the Read
 * Site and the Drawing Register — both pass their own copy; defaults match
 * the Read Site's original text.
 */
export default function FooterNotice({
  label = 'Read-only notice:',
  message = 'This site displays approved and published documents only. To submit a new document, request a revision, or report an error, please visit',
  linkHref = '/ms-publishing',
  linkLabel = 'MS Publishing',
  suffix = "or contact your department's document controller.",
}) {
  return (
    <div
      role="note"
      className="mx-auto mb-10 max-w-6xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 sm:px-6 sm:text-sm"
    >
      <span className="font-semibold">{label}</span> {message}{' '}
      <a href={linkHref} className="font-medium underline underline-offset-2 hover:text-amber-950">
        {linkLabel}
      </a>{' '}
      {suffix}
    </div>
  );
}
