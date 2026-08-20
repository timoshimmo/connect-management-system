import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Squares2X2Icon } from '@heroicons/react/24/outline';
import { FEATURES } from '@/config/features';
import PageHeader from '../components/ReadSite/PageHeader';
import SearchBar from '../components/ReadSite/SearchBar';
import DepartmentGrid from '../components/ReadSite/DepartmentGrid';
import DocumentRegisterCard from '../components/ReadSite/DocumentRegisterCard';
import DocumentTabs from '../components/ReadSite/DocumentTabs';
import DocumentList from '../components/ReadSite/DocumentList';
import FooterNotice from '../components/ReadSite/FooterNotice';
import { ContactControllerModal } from '../components/ReadSite/ContactControllerModal';
import { DEPARTMENT_ICON_BY_NAME } from '../data/departments';
import { defaultDepartmentIcon } from '../components/ReadSite/departmentIconMap';
import { useDocumentFilters } from '../hooks/useDocumentFilters';
import {
  useReadSitePublishedDocumentsQuery,
  useReadSiteDepartmentsQuery,
  useReadSiteContactMutation,
} from '@/features/read-site';
import { refName } from '@/lib/apiTypes';
import type { ApiDocumentType } from '@/lib/apiTypes';

// Fixed enum, not derived from currently-loaded documents — otherwise a
// fresh instance with 0 published documents would show an empty "All
// Types" filter (same bug class as the Discipline filter, see
// DrawingRegisterPage.tsx). Mirrors backend/src/modules/documents/document.model.js's DOCUMENT_TYPES.
const DOCUMENT_TYPES: ApiDocumentType[] = [
  'Manual',
  'Policy',
  'Procedure',
  'Standard',
  'Goal',
  'Org Chart',
  'Policy Change',
  'Functional Description',
  'Form',
];

function fileTypeFromFormat(format: string | undefined): string {
  if (!format) return 'pdf';
  const ext = format.toLowerCase();
  if (ext === 'doc' || ext === 'docx') return 'docx';
  return 'pdf';
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+&\s+|\s+/g, '-');
}

/**
 * Public "Management System Read Site" page. No authentication is required —
 * it reads live from the backend's public /read-site/* endpoints, so a
 * Controller's "Publish" action in MS Publishing shows up here immediately.
 */
export function ReadSitePage() {
  const { department: departmentParam } = useParams<{ department?: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const { data: publishedDocs = [], isLoading } = useReadSitePublishedDocumentsQuery();
  const { data: apiDepartments = [] } = useReadSiteDepartmentsQuery();

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
        // Read Site documents always have a type (enforced for this
        // destination in document.validation.js) — the `?? ''` is just to
        // satisfy ApiDocumentType | null.
        type: doc.type ?? '',
        location: doc.location,
        fileType: fileTypeFromFormat(doc.currentVersion?.file.format),
        fileUrl: doc.currentVersion?.file.url ?? null,
        originalFilename: doc.currentVersion?.file.originalFilename ?? null,
        mongoId: doc._id,
      })),
    [publishedDocs]
  );

  // Live departments are the source of truth — any Active department created
  // via Department Management shows up here, not just the original curated
  // seven. Icon is a nice-to-have looked up by name; anything else falls
  // back to a generic icon (see departmentIconMap.js).
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
    activeTab,
    setActiveTab,
    sortValue,
    setSortValue,
    filteredDocuments,
    clearFilters,
  } = useDocumentFilters(documents, departmentParam ?? 'all');

  // Keep the department filter in sync if the user navigates between two
  // different `/read-site/:department` deep links without an intervening
  // full reload (e.g. clicking department links on the Dashboard in sequence).
  useEffect(() => {
    if (departmentParam) setDepartment(departmentParam);
  }, [departmentParam, setDepartment]);

  // Dashboard tiles (e.g. "All Policies") deep-link here with ?type=Policy —
  // same sync-on-change reasoning as the department param above.
  useEffect(() => {
    if (typeParam) setType(typeParam);
  }, [typeParam, setType]);

  const handleSelectDepartment = (dept: { name: string }) => {
    setDepartment(slugify(dept.name));
  };

  const [contactOpen, setContactOpen] = useState(false);
  const contactMutation = useReadSiteContactMutation();
  const preselectedDepartmentId = apiDepartments.find((d) => slugify(d.name) === department)?.id;

  return (
    <main aria-label="Management System Read Site">
      <PageHeader />

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
            types={DOCUMENT_TYPES}
            onSearch={() => {}}
          />
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 pt-6 sm:flex-row sm:justify-end sm:px-8">
        {FEATURES.drawingRegister && (
          <Link
            to="/drawing-register"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-800 transition-colors duration-200 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          >
            <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
            Drawings and Diagrams
          </Link>
        )}
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className="inline-flex items-center justify-center rounded-lg border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-800 transition-colors duration-200 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
        >
          Contact Document Controller
        </button>
      </div>

      <div className="pt-4">
        <DocumentRegisterCard searchQuery={query} />
      </div>

      <DepartmentGrid
        departments={departments}
        onSelectDepartment={handleSelectDepartment}
        onContactController={() => setContactOpen(true)}
        hideActionsRow
      />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        aria-labelledby="document-list-heading"
        className="mx-auto max-w-6xl px-4 pb-4 sm:px-8"
      >
        <h2 id="document-list-heading" className="sr-only">
          Published documents
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
        <FooterNotice />
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
