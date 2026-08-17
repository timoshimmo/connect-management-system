import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/ReadSite/PageHeader';
import SearchBar from '@/components/ReadSite/SearchBar';
import {
  useDocumentRegisterDocumentsQuery,
  useDocumentRegisterTypesQuery,
  useDocumentRegisterIsoStandardsQuery,
  DocumentRegisterTable,
  DocumentDetailsModal,
} from '@/features/document-register';
import type { ApiDocument } from '@/lib/apiTypes';

/**
 * Public "Document Register" page — a dedicated, read-only view of
 * controlled QHSE Management System documents. No authentication is
 * required, matching Read Site/Drawing Register's public read model;
 * creation happens elsewhere and is Document Controller-only.
 *
 * Layout deliberately mirrors the Read Site (top search + dropdown filters,
 * via the same shared SearchBar) rather than a permanent sidebar — see
 * ReadSitePage.tsx for the pattern this follows. Document Type and ISO
 * Standard option lists come from the live counts endpoints (never a
 * hardcoded list), same as the documents themselves.
 */
export function DocumentRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [isoStandard, setIsoStandard] = useState('all');
  const [detailsDoc, setDetailsDoc] = useState<ApiDocument | null>(null);

  const { data: documents = [], isLoading } = useDocumentRegisterDocumentsQuery({
    search: search || undefined,
    type: type !== 'all' ? type : undefined,
    isoStandard: isoStandard !== 'all' ? isoStandard : undefined,
  });
  const { data: typeCounts = [] } = useDocumentRegisterTypesQuery();
  const { data: isoCounts = [] } = useDocumentRegisterIsoStandardsQuery();

  const documentTypes = typeCounts.map((t) => t.type);
  const isoStandardOptions = isoCounts.map((s) => s.standard);

  // Deep-link support for the Read Site's Document Register preview table —
  // /document-register?doc=<mongoId> opens that document's details modal as
  // soon as the (unfiltered, so it's guaranteed to be present) documents list
  // has loaded. Mirrors MSPublishingPage.tsx's notification deep-link pattern.
  useEffect(() => {
    const docId = searchParams.get('doc');
    if (!docId || documents.length === 0) return;
    const target = documents.find((d) => d._id === docId);
    if (target) setDetailsDoc(target);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('doc');
      return next;
    });
  }, [documents, searchParams, setSearchParams]);

  return (
    <main aria-label="Document Register">
      <PageHeader
        title="Document Register"
        description="Browse and download all controlled QHSE Management System documents — manuals, procedures and standards mapped to ISO 9001, ISO 14001 and ISO 45001 clauses."
        badgeText="Read-only — controlled documents"
        backTo="/read-site"
        backLabel="Back to Read Site"
      />

      <section className="border-b border-gray-100 bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SearchBar
            query={search}
            onQueryChange={setSearch}
            type={type}
            onTypeChange={setType}
            types={documentTypes}
            isoStandard={isoStandard}
            onIsoStandardChange={setIsoStandard}
            isoStandards={isoStandardOptions}
            onSearch={() => {}}
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <DocumentRegisterTable documents={documents} isLoading={isLoading} onView={setDetailsDoc} />
      </div>

      {detailsDoc && <DocumentDetailsModal doc={detailsDoc} onClose={() => setDetailsDoc(null)} />}
    </main>
  );
}
