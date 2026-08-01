import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../components/ReadSite/PageHeader';
import SearchBar from '../components/ReadSite/SearchBar';
import DepartmentGrid from '../components/ReadSite/DepartmentGrid';
import DocumentTabs from '../components/ReadSite/DocumentTabs';
import DocumentList from '../components/ReadSite/DocumentList';
import FooterNotice from '../components/ReadSite/FooterNotice';
import { departments as departmentIcons } from '../data/departments';
import { useDocumentFilters } from '../hooks/useDocumentFilters';
import { useReadSitePublishedDocumentsQuery, useReadSiteDepartmentsQuery } from '@/features/read-site';
import { refName } from '@/lib/apiTypes';

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
        type: doc.location,
        category: doc.type,
        fileType: fileTypeFromFormat(doc.currentVersion?.file.format),
        fileUrl: doc.currentVersion?.file.url ?? null,
        mongoId: doc._id,
      })),
    [publishedDocs]
  );

  const departments = useMemo(
    () =>
      departmentIcons.map((iconMeta) => {
        const apiDept = apiDepartments.find((d) => d.name === iconMeta.name);
        return { ...iconMeta, documentCount: apiDept?.publishedDocumentCount ?? 0 };
      }),
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

  const documentTypes = useMemo(
    () => [...new Set(documents.map((doc) => doc.type))],
    [documents]
  );

  const handleSelectDepartment = (dept: { name: string }) => {
    setDepartment(slugify(dept.name));
  };

  const handleContactController = () => {
    window.location.href = '/ms-publishing/contact';
  };

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
            types={documentTypes}
            onSearch={() => {}}
          />
        </div>
      </section>

      <DepartmentGrid
        departments={departments}
        onSelectDepartment={handleSelectDepartment}
        onContactController={handleContactController}
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
    </main>
  );
}
