import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DrawingRegisterProtectedLayout } from '@/components/layout';
import PageHeader from '@/components/ReadSite/PageHeader';
import SearchBar from '@/components/ReadSite/SearchBar';
import DepartmentGrid from '@/components/ReadSite/DepartmentGrid';
import DocumentTabs from '@/components/ReadSite/DocumentTabs';
import DocumentList from '@/components/ReadSite/DocumentList';
import FooterNotice from '@/components/ReadSite/FooterNotice';
import { ContactControllerModal } from '@/components/ReadSite/ContactControllerModal';
import { DEPARTMENT_ICON_BY_NAME } from '@/data/departments';
import { defaultDepartmentIcon } from '@/components/ReadSite/departmentIconMap';
import { useDocumentFilters } from '@/hooks/useDocumentFilters';
import { useAppSelector } from '@/hooks';
import {
  useDrawingRegisterDocumentsQuery,
  useDrawingRegisterDepartmentsQuery,
  useDrawingRegisterDisciplinesQuery,
  useDrawingRegisterContactMutation,
} from '@/features/drawing-register';
import { refName } from '@/lib/apiTypes';
import type { ApiDocumentLocation } from '@/lib/apiTypes';

// Drawing Register documents have no `type` field (that's Read Site-only —
// see document.model.js) so, unlike ReadSitePage.tsx, "type" here stays the
// Location enum, fixed rather than derived from currently-loaded documents.
const DOCUMENT_LOCATIONS: ApiDocumentLocation[] = ['Onshore', 'Offshore – Mayo ABO', 'Both'];

function fileTypeFromFormat(format: string | undefined): string {
  if (!format) return 'pdf';
  const ext = format.toLowerCase();
  if (ext === 'doc' || ext === 'docx') return 'docx';
  return 'pdf';
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+&\s+|\s+/g, '-');
}

export function DrawingRegisterPage() {
  return (
    <DrawingRegisterProtectedLayout>
      <DrawingRegisterContent />
    </DrawingRegisterProtectedLayout>
  );
}

/**
 * Requires a Drawing Register session (gated by DrawingRegisterProtectedLayout,
 * which redirects unauthenticated visitors to /drawing-register/login).
 * Otherwise a near-exact mirror of ReadSitePage — same components, same
 * filtering hook — just reading from the separate, gated /drawing-register/*
 * endpoints (destination:'Drawing Register' documents only).
 */
function DrawingRegisterContent() {
  const isAuthenticated = useAppSelector((state) => state.drawingRegisterAuth.isAuthenticated);
  const { data: publishedDocs = [], isLoading } = useDrawingRegisterDocumentsQuery(isAuthenticated);
  const { data: apiDepartments = [] } = useDrawingRegisterDepartmentsQuery(isAuthenticated);
  const { data: apiDisciplines = [] } = useDrawingRegisterDisciplinesQuery(isAuthenticated);

  const documents = useMemo(
    () =>
      publishedDocs.map((doc) => ({
        id: doc._id,
        title: doc.title,
        docId: doc.docId,
        version: doc.currentVersion?.versionNumber ?? '—',
        approvedBy: refName(doc.approver),
        department: refName(doc.department),
        publishedDate: doc.publishedAt as string,
        type: doc.location,
        location: doc.location,
        discipline: refName(doc.discipline),
        fileType: fileTypeFromFormat(doc.currentVersion?.file.format),
        fileUrl: doc.currentVersion?.file.url ?? null,
        originalFilename: doc.currentVersion?.file.originalFilename ?? null,
        mongoId: doc._id,
      })),
    [publishedDocs]
  );

  // Live departments are the source of truth — see ReadSitePage.tsx for why.
  const departments = useMemo(
    () =>
      apiDepartments.map((d) => ({
        id: slugify(d.name),
        name: d.name,
        documentCount: d.publishedDocumentCount,
        icon: (DEPARTMENT_ICON_BY_NAME as Record<string, string>)[d.name] ?? defaultDepartmentIcon,
      })),
    [apiDepartments]
  );

  const {
    query,
    setQuery,
    department,
    setDepartment,
    type,
    setType,
    discipline,
    setDiscipline,
    activeTab,
    setActiveTab,
    sortValue,
    setSortValue,
    filteredDocuments,
    clearFilters,
  } = useDocumentFilters(documents, 'all');

  // Live from the Discipline collection, not derived from documents —
  // otherwise a fresh instance with no published drawings yet would show an
  // empty filter even though disciplines exist (used when creating documents).
  const disciplineOptions = useMemo(() => apiDisciplines.map((d) => d.name), [apiDisciplines]);

  const handleSelectDepartment = (dept: { name: string }) => {
    setDepartment(slugify(dept.name));
  };

  const [contactOpen, setContactOpen] = useState(false);
  const contactMutation = useDrawingRegisterContactMutation();
  const preselectedDepartmentId = apiDepartments.find((d) => slugify(d.name) === department)?.id;

  return (
    <main aria-label="STAC Drawing Register">
      <PageHeader
        title="STAC Drawing Register"
        description="Browse and download engineering documents published to the Drawing Register. Sign-in required — this content is not available on the public Read Site."
        badgeText="Drawing Register — authenticated access only"
      />

      <section className="border-b border-gray-100 bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            department={department}
            onDepartmentChange={setDepartment}
            departments={departments}
            type={type}
            onTypeChange={setType}
            types={DOCUMENT_LOCATIONS}
            discipline={discipline}
            onDisciplineChange={setDiscipline}
            disciplines={disciplineOptions}
            onSearch={() => {}}
          />
        </div>
      </section>

      <DepartmentGrid
        departments={departments}
        onSelectDepartment={handleSelectDepartment}
        onContactController={() => setContactOpen(true)}
        showDrawingRegisterLink={false}
      />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        aria-labelledby="document-list-heading"
        className="mx-auto max-w-6xl px-4 pb-4 sm:px-8"
      >
        <h2 id="document-list-heading" className="sr-only">
          Drawing Register documents
        </h2>
        <DocumentTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-4">
          <DocumentList
            documents={filteredDocuments}
            totalCount={documents.length}
            sortValue={sortValue}
            onSortChange={setSortValue}
            isLoading={isLoading}
            onClearFilters={clearFilters}
          />
        </div>
      </motion.section>

      <div className="pt-6">
        <FooterNotice
          label="Drawing Register notice:"
          message="This page displays documents published to the Drawing Register only. To submit a new document or request a revision, please visit"
          suffix="or contact your department's document controller."
        />
      </div>

      {contactOpen && (
        <ContactControllerModal
          departments={apiDepartments}
          documents={publishedDocs.map((d) => ({ id: d._id, title: d.title }))}
          preselectedDepartmentId={preselectedDepartmentId}
          onClose={() => setContactOpen(false)}
          isSubmitting={contactMutation.isPending}
          onSubmit={(payload) => contactMutation.mutate(payload, { onSuccess: () => setContactOpen(false) })}
        />
      )}
    </main>
  );
}
