import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, LogOut, Plus } from 'lucide-react';
import { ProtectedLayout } from '@/components/layout';
import { RoleGuard } from '@/components/auth';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useDocumentPreview } from '@/features/document-preview';
import { useMeQuery, useLogoutMutation } from '@/features/auth/hooks';
import { sessionEnded } from '@/store/slices/authSlice';
import {
  useDocumentsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useSubmitForReviewMutation,
  useForwardMutation,
  useReturnToAuthorMutation,
  useApproveMutation,
  useRejectMutation,
  usePublishMutation,
  useRejectPublishingMutation,
  useInitiateRevisionMutation,
  useArchiveMutation,
  useRestoreMutation,
  useReassignMutation,
} from '@/features/documents/hooks';
import { isDocumentOverdue, isPublishedThisMonth } from '@/features/documents/utils';
import { UserManagementPanel } from '@/features/users';
import { DepartmentManagementPanel } from '@/features/departments/DepartmentManagementPanel';
import { DisciplineManagementPanel } from '@/features/disciplines/DisciplineManagementPanel';
import { BulkUploadPanel } from '@/features/bulk-upload';
import {
  CreateDocumentRegisterDocumentPanel,
  ManageDocumentRegisterPanel,
  EditDocumentRegisterModal,
  DocumentRegisterBulkUploadPanel,
} from '@/features/document-register';
import { refId, refName } from '@/lib/apiTypes';
import type { ApiDocument } from '@/lib/apiTypes';
import { ROLES, ViewKey, CountKey } from '@/data/roles';
import {
  MSPublishingSidebar,
  WorkflowBar,
  KpiCards,
  KpiStat,
  DocumentsTable,
  ActionButton,
  AssignmentAction,
  NewDocumentModal,
  EditDocumentModal,
  DocumentDetailModal,
  ArchiveConfirmModal,
  RestoreConfirmModal,
  ArchivedDocumentsPanel,
  ReassignModal,
  titleColumn,
  departmentColumn,
  typeColumn,
  authorColumn,
  reviewerColumn,
  approverColumn,
  dateColumn,
  statusColumn,
  nextReviewColumn,
} from '@/features/ms-publishing';

const ACTIVE_PIPELINE_STATUSES = [
  'Pending Assignment',
  'Under Review',
  'Pending Approval',
  'Pending Publishing',
] as const;

// "Pending Assignment" is deliberately excluded — that initial assignment
// is what AssignmentAction/useAssignMutation already handles, and it also
// transitions status to "Under Review". Reassign only ever changes who's
// assigned on a document that's already been assigned once, and never
// touches status (see reassignReviewerApprover in the backend).
const REASSIGNABLE_STATUSES = ['Under Review', 'Pending Approval', 'Pending Publishing'] as const;
function canReassign(doc: ApiDocument): boolean {
  return (REASSIGNABLE_STATUSES as readonly string[]).includes(doc.status) || (doc.status === 'Draft' && doc.returned);
}

export function MSPublishingPage() {
  return (
    <ProtectedLayout>
      <MSPublishingContent />
    </ProtectedLayout>
  );
}

/**
 * All the hooks/state/view logic live here, inside ProtectedLayout's
 * children — ProtectedLayout only mounts this once isAuthenticated is true,
 * so `useMeQuery` is guaranteed to be allowed to run by the time this
 * renders.
 */
function MSPublishingContent() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { data: user } = useMeQuery(isAuthenticated);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openPreview } = useDocumentPreview();
  const logoutMutation = useLogoutMutation();

  const { data: allDocuments = [] } = useDocumentsQuery();
  const createDocument = useCreateDocumentMutation();
  const updateDocument = useUpdateDocumentMutation();
  const submitForReview = useSubmitForReviewMutation();
  const forwardToApproval = useForwardMutation();
  const returnToAuthor = useReturnToAuthorMutation();
  const approve = useApproveMutation();
  const reject = useRejectMutation();
  const publish = usePublishMutation();
  const rejectPublishing = useRejectPublishingMutation();
  const initiateRevision = useInitiateRevisionMutation();
  const archiveDocument = useArchiveMutation();
  const restoreDocument = useRestoreMutation();
  const reassignDocument = useReassignMutation();

  const [view, setView] = useState<ViewKey>('dashboard');
  const [activeFilter, setActiveFilter] = useState<string | undefined>();
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [detailDoc, setDetailDoc] = useState<ApiDocument | null>(null);
  const [editDoc, setEditDoc] = useState<ApiDocument | null>(null);
  const [editRegisterDoc, setEditRegisterDoc] = useState<ApiDocument | null>(null);
  const [archiveDoc, setArchiveDoc] = useState<ApiDocument | null>(null);
  const [restoreDoc, setRestoreDoc] = useState<ApiDocument | null>(null);
  const [reassignDoc, setReassignDoc] = useState<ApiDocument | null>(null);

  // Deep-link support for the notification bell's "navigate to related
  // document" — /ms-publishing?doc=<mongoId> opens that document's detail
  // modal as soon as the documents list has loaded.
  useEffect(() => {
    const docId = searchParams.get('doc');
    if (!docId || allDocuments.length === 0) return;
    const target = allDocuments.find((d) => d._id === docId);
    if (target) setDetailDoc(target);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('doc');
      return next;
    });
  }, [allDocuments, searchParams, setSearchParams]);

  const myDocuments = useMemo(() => {
    if (!user) return [];
    if (user.role === 'controller') return allDocuments;
    if (user.role === 'author') return allDocuments.filter((d) => refId(d.author) === user.id);
    if (user.role === 'reviewer') return allDocuments.filter((d) => refId(d.reviewer) === user.id);
    if (user.role === 'approver') return allDocuments.filter((d) => refId(d.approver) === user.id);
    return [];
  }, [allDocuments, user]);

  function handleNavigate(nextView: ViewKey, filterValue?: string) {
    setView(nextView);
    setActiveFilter(filterValue);
  }

  function handleSignOut() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        dispatch(sessionEnded());
        navigate('/');
      },
    });
  }

  const counts = useMemo(() => {
    const c: Partial<Record<CountKey, number>> = {};
    if (user?.role === 'author') {
      c.drafts = myDocuments.filter((d) => d.status === 'Draft' && !d.returned).length;
      c.submitted = myDocuments.filter((d) =>
        (ACTIVE_PIPELINE_STATUSES as readonly string[]).includes(d.status)
      ).length;
      c.returned = myDocuments.filter((d) => d.status === 'Draft' && d.returned).length;
    } else if (user?.role === 'reviewer') {
      c.assigned = myDocuments.filter((d) => d.status === 'Under Review').length;
    } else if (user?.role === 'approver') {
      c.pendingApproval = myDocuments.filter((d) => d.status === 'Pending Approval').length;
      c.due = myDocuments.filter(isDocumentOverdue).length;
    } else if (user?.role === 'controller') {
      c.pendingAssignment = allDocuments.filter((d) => d.status === 'Pending Assignment').length;
      c.pendingPublishing = allDocuments.filter((d) => d.status === 'Pending Publishing').length;
      c.due = allDocuments.filter(isDocumentOverdue).length;
    }
    return c;
  }, [user?.role, myDocuments, allDocuments]);

  const kpiStats: KpiStat[] = useMemo(() => {
    if (user?.role === 'author') {
      return [
        { label: 'My Drafts', value: counts.drafts ?? 0, sub: 'not yet submitted' },
        { label: 'In Workflow', value: counts.submitted ?? 0, sub: 'submitted by me', tone: 'amber' },
        {
          label: 'Published by Me',
          value: myDocuments.filter((d) => d.status === 'Published').length,
          sub: 'all time',
        },
      ];
    }
    if (user?.role === 'reviewer') {
      return [
        { label: 'Assigned to Me', value: counts.assigned ?? 0, sub: 'awaiting your review', tone: 'amber' },
        {
          label: 'Completed Reviews',
          value: myDocuments.filter((d) => !['Under Review', 'Draft', 'Pending Assignment'].includes(d.status)).length,
          sub: 'forwarded so far',
        },
      ];
    }
    if (user?.role === 'approver') {
      return [
        { label: 'Awaiting My Approval', value: counts.pendingApproval ?? 0, sub: 'need your sign-off', tone: 'amber' },
        {
          label: 'Approved',
          value: myDocuments.filter((d) => ['Pending Publishing', 'Published'].includes(d.status)).length,
          sub: 'all time',
        },
        { label: 'Due for Review', value: counts.due ?? 0, sub: 'action required', tone: 'red' },
      ];
    }
    return [
      { label: 'Total Documents', value: allDocuments.length, sub: 'all departments' },
      { label: 'Pending Assignment', value: counts.pendingAssignment ?? 0, sub: 'need reviewer/approver', tone: 'amber' },
      { label: 'Pending Publishing', value: counts.pendingPublishing ?? 0, sub: 'awaiting sign-off', tone: 'amber' },
      { label: 'Due for Review', value: counts.due ?? 0, sub: 'action required', tone: 'red' },
    ];
  }, [user?.role, counts, myDocuments, allDocuments]);

  if (!user) return null;

  if (!user.role) {
    // First-time Microsoft SSO signup (or a manually-created placeholder
    // account) with no role assigned yet — see auth/microsoft.service.js.
    // No sidebar/workflow view makes sense until a Controller assigns one.
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-lg font-bold text-gray-900">Awaiting Role Assignment</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your account has been created, but a Document Controller hasn't assigned you a role or department yet.
          You'll be able to access STAC Management System as soon as that's done.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign Out
        </button>
      </div>
    );
  }
  const role = ROLES[user.role];

  function openNewDoc() {
    setNewDocOpen(true);
  }

  function handleCreate(payload: Parameters<Parameters<typeof NewDocumentModal>[0]['onCreate']>[0]) {
    createDocument.mutate(payload, {
      onSuccess: () => {
        setNewDocOpen(false);
        setView('drafts');
      },
    });
  }

  const viewOnlyActions = (doc: ApiDocument) => (
    <ActionButton onClick={() => setDetailDoc(doc)}>View</ActionButton>
  );

  // Admin Controller-only — self-guards on both role and eligibility, so
  // callers can use it unconditionally inside any renderActions callback.
  const reassignButton = (doc: ApiDocument) =>
    user.role === 'controller' && canReassign(doc) ? (
      <ActionButton onClick={() => setReassignDoc(doc)}>Reassign</ActionButton>
    ) : null;

  const reviewAction = (doc: ApiDocument) => (
    <ActionButton
      disabled={!doc.currentVersion}
      onClick={() =>
        doc.currentVersion &&
        openPreview({
          id: doc.docId,
          title: doc.title,
          fileUrl: doc.currentVersion.file.url,
          fileFormat: doc.currentVersion.file.format,
          originalFilename: doc.currentVersion.file.originalFilename,
        })
      }
    >
      Review
    </ActionButton>
  );

  let content: ReactNode = null;

  if (view === 'dashboard') {
    let dashboardBody: ReactNode;
    if (user.role === 'author') {
      const drafts = myDocuments.filter((d) => d.status === 'Draft' && !d.returned);
      const inWorkflow = myDocuments.filter((d) =>
        (ACTIVE_PIPELINE_STATUSES as readonly string[]).includes(d.status)
      );
      dashboardBody = (
        <>
          <DocumentsTable
            title="My Drafts"
            documents={drafts}
            columns={[titleColumn, departmentColumn, dateColumn('createdAt', 'Last Modified'), statusColumn]}
            onTitleClick={setDetailDoc}
            headerAction={
              <button onClick={openNewDoc} className="text-xs font-semibold text-brand-700 hover:underline">
                + New Document
              </button>
            }
            renderActions={(doc) => (
              <>
                <ActionButton onClick={() => setEditDoc(doc)}>Edit</ActionButton>
                <ActionButton variant="primary" onClick={() => submitForReview.mutate({ id: doc._id })}>
                  Submit for Review
                </ActionButton>
              </>
            )}
            emptyTitle="No drafts yet"
            emptyDescription='Click "+ New Document" to start.'
          />
          {inWorkflow.length > 0 && (
            <DocumentsTable
              title="Submitted for Review"
              documents={inWorkflow}
              columns={[titleColumn, departmentColumn, typeColumn, dateColumn('createdAt', 'Date'), statusColumn]}
              onTitleClick={setDetailDoc}
              renderActions={viewOnlyActions}
            />
          )}
        </>
      );
    } else if (user.role === 'reviewer') {
      const assigned = myDocuments.filter((d) => d.status === 'Under Review');
      dashboardBody = (
        <DocumentsTable
          title="Assigned to Me for Review"
          documents={assigned}
          columns={[titleColumn, departmentColumn, authorColumn, dateColumn('createdAt', 'Date'), statusColumn]}
          onTitleClick={setDetailDoc}
          renderActions={(doc) => (
            <>
              {reviewAction(doc)}
              <ActionButton variant="primary" onClick={() => forwardToApproval.mutate({ id: doc._id })}>
                Forward to Approver
              </ActionButton>
              <ActionButton onClick={() => returnToAuthor.mutate({ id: doc._id })}>Return to Author</ActionButton>
            </>
          )}
          emptyTitle="Nothing assigned to you"
          emptyDescription="Documents submitted for your review will appear here."
        />
      );
    } else if (user.role === 'approver') {
      const pending = myDocuments.filter((d) => d.status === 'Pending Approval');
      const due = myDocuments.filter(isDocumentOverdue);
      dashboardBody = (
        <>
          <DocumentsTable
            title="Pending Approvals"
            documents={pending}
            columns={[titleColumn, departmentColumn, authorColumn, dateColumn('createdAt', 'Date'), statusColumn]}
            onTitleClick={setDetailDoc}
            renderActions={(doc) => (
              <>
                {reviewAction(doc)}
                <ActionButton variant="primary" onClick={() => approve.mutate({ id: doc._id })}>
                  Approve
                </ActionButton>
                <ActionButton variant="danger" onClick={() => reject.mutate({ id: doc._id })}>
                  Reject
                </ActionButton>
              </>
            )}
            emptyTitle="Nothing awaiting your approval"
            emptyDescription="All caught up."
          />
          {due.length > 0 && (
            <DocumentsTable
              title="Due for Review"
              documents={due}
              columns={[titleColumn, departmentColumn, authorColumn, dateColumn('publishedAt', 'Published'), nextReviewColumn]}
              onTitleClick={setDetailDoc}
              banner={
                <div className="border-b border-red-100 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-700">
                  ⚠ These published documents have passed their review date.
                </div>
              }
              renderActions={(doc) => (
                <>
                  <ActionButton variant="primary" onClick={() => initiateRevision.mutate({ id: doc._id })}>
                    Initiate Revision
                  </ActionButton>
                  <ActionButton onClick={() => setDetailDoc(doc)}>View</ActionButton>
                </>
              )}
            />
          )}
        </>
      );
    } else {
      const pendingAssignment = allDocuments.filter((d) => d.status === 'Pending Assignment').slice(0, 5);
      const pendingPublishing = allDocuments.filter((d) => d.status === 'Pending Publishing').slice(0, 5);
      const drafts = allDocuments.filter((d) => d.status === 'Draft').slice(0, 4);
      const due = allDocuments.filter(isDocumentOverdue);
      dashboardBody = (
        <>
          <DocumentsTable
            title="Pending Assignment"
            documents={pendingAssignment}
            columns={[titleColumn, departmentColumn, typeColumn, authorColumn]}
            onTitleClick={setDetailDoc}
            renderActions={(doc) => <AssignmentAction doc={doc} />}
            emptyTitle="No documents awaiting assignment"
          />
          <DocumentsTable
            title="Pending Publishing"
            documents={pendingPublishing}
            columns={[titleColumn, departmentColumn, authorColumn, reviewerColumn, approverColumn]}
            onTitleClick={setDetailDoc}
            renderActions={(doc) => (
              <>
                <ActionButton variant="primary" onClick={() => publish.mutate({ id: doc._id })}>
                  Publish
                </ActionButton>
                <ActionButton variant="danger" onClick={() => rejectPublishing.mutate({ id: doc._id })}>
                  Reject
                </ActionButton>
                {reassignButton(doc)}
              </>
            )}
            emptyTitle="No documents awaiting publishing"
          />
          {drafts.length > 0 && (
            <DocumentsTable
              title="Drafts"
              documents={drafts}
              columns={[titleColumn, departmentColumn, dateColumn('createdAt', 'Last Modified'), statusColumn]}
              onTitleClick={setDetailDoc}
              renderActions={(doc) => (
                <>
                  <ActionButton variant="primary" onClick={() => submitForReview.mutate({ id: doc._id })}>
                    Submit for Review
                  </ActionButton>
                  {reassignButton(doc)}
                </>
              )}
            />
          )}
          {due.length > 0 && (
            <DocumentsTable
              title="Due for Review"
              documents={due}
              columns={[titleColumn, departmentColumn, authorColumn, dateColumn('publishedAt', 'Published'), nextReviewColumn]}
              onTitleClick={setDetailDoc}
              renderActions={(doc) => (
                <ActionButton variant="primary" onClick={() => initiateRevision.mutate({ id: doc._id })}>
                  Initiate Revision
                </ActionButton>
              )}
            />
          )}
        </>
      );
    }
    content = (
      <>
        <KpiCards stats={kpiStats} />
        <WorkflowBar activeStep={role.wfStep} />
        {dashboardBody}
      </>
    );
  } else if (view === 'drafts') {
    const drafts = (user.role === 'controller' ? allDocuments : myDocuments).filter(
      (d) => d.status === 'Draft' && !d.returned
    );
    content = (
      <DocumentsTable
        title="My Drafts"
        documents={drafts}
        columns={[titleColumn, departmentColumn, dateColumn('createdAt', 'Last Modified'), statusColumn]}
        onTitleClick={setDetailDoc}
        renderActions={(doc) => (
          <>
            <ActionButton onClick={() => setEditDoc(doc)}>Edit</ActionButton>
            <ActionButton variant="primary" onClick={() => submitForReview.mutate({ id: doc._id })}>
              Submit for Review
            </ActionButton>
          </>
        )}
        emptyTitle="No drafts"
        emptyDescription="All drafts have been submitted."
      />
    );
  } else if (view === 'submitted') {
    const docs = myDocuments.filter((d) => (ACTIVE_PIPELINE_STATUSES as readonly string[]).includes(d.status));
    content = (
      <DocumentsTable
        title="Submitted for Review"
        documents={docs}
        columns={[titleColumn, departmentColumn, typeColumn, dateColumn('createdAt', 'Date'), statusColumn]}
        onTitleClick={setDetailDoc}
        renderActions={viewOnlyActions}
        emptyTitle="No submitted documents"
        emptyDescription="Documents you submit will appear here."
      />
    );
  } else if (view === 'returned') {
    const docs = myDocuments.filter((d) => d.status === 'Draft' && d.returned);
    content = (
      <DocumentsTable
        title="Returned to Me"
        documents={docs}
        columns={[titleColumn, departmentColumn, dateColumn('createdAt', 'Last Modified'), statusColumn]}
        onTitleClick={setDetailDoc}
        renderActions={(doc) => (
          <>
            <ActionButton onClick={() => setEditDoc(doc)}>Edit</ActionButton>
            <ActionButton variant="primary" onClick={() => submitForReview.mutate({ id: doc._id })}>
              Resubmit
            </ActionButton>
          </>
        )}
        emptyTitle="No returned documents"
        emptyDescription="Documents returned with reviewer comments will appear here."
      />
    );
  } else if (view === 'assigned') {
    const docs = myDocuments.filter((d) => d.status === 'Under Review');
    content = (
      <DocumentsTable
        title="Assigned to Me for Review"
        documents={docs}
        columns={[titleColumn, departmentColumn, authorColumn, dateColumn('createdAt', 'Date'), statusColumn]}
        onTitleClick={setDetailDoc}
        renderActions={(doc) => (
          <>
            {reviewAction(doc)}
            <ActionButton variant="primary" onClick={() => forwardToApproval.mutate({ id: doc._id })}>
              Forward to Approver
            </ActionButton>
            <ActionButton onClick={() => returnToAuthor.mutate({ id: doc._id })}>Return to Author</ActionButton>
          </>
        )}
        emptyTitle="Nothing assigned to you"
        emptyDescription="Documents submitted for your review will appear here."
      />
    );
  } else if (view === 'recent') {
    const docs =
      user.role === 'reviewer'
        ? myDocuments.filter((d) => !['Under Review', 'Draft', 'Pending Assignment'].includes(d.status))
        : user.role === 'approver'
          ? myDocuments.filter((d) => ['Pending Publishing', 'Published'].includes(d.status))
          : allDocuments.filter(isPublishedThisMonth);
    content = (
      <DocumentsTable
        title={user.role === 'controller' ? 'Recently Published (This Month)' : 'Completed'}
        documents={docs}
        columns={[titleColumn, departmentColumn, typeColumn, dateColumn('publishedAt', 'Published'), statusColumn]}
        onTitleClick={setDetailDoc}
        renderActions={
          user.role === 'controller'
            ? (doc) => (
                <>
                  <ActionButton onClick={() => setDetailDoc(doc)}>View</ActionButton>
                  {doc.status === 'Published' && (
                    <ActionButton variant="danger" onClick={() => setArchiveDoc(doc)}>
                      Archive
                    </ActionButton>
                  )}
                </>
              )
            : viewOnlyActions
        }
        emptyTitle="Nothing here yet"
      />
    );
  } else if (view === 'approvals') {
    const docs = myDocuments.filter((d) => d.status === 'Pending Approval');
    content = (
      <DocumentsTable
        title="Awaiting My Approval"
        documents={docs}
        columns={[titleColumn, departmentColumn, authorColumn, dateColumn('createdAt', 'Date'), statusColumn]}
        onTitleClick={setDetailDoc}
        renderActions={(doc) => (
          <>
            {reviewAction(doc)}
            <ActionButton variant="primary" onClick={() => approve.mutate({ id: doc._id })}>
              Approve
            </ActionButton>
            <ActionButton variant="danger" onClick={() => reject.mutate({ id: doc._id })}>
              Reject
            </ActionButton>
          </>
        )}
        emptyTitle="No documents awaiting approval"
        emptyDescription="All caught up."
      />
    );
  } else if (view === 'due') {
    const docs = (user.role === 'controller' ? allDocuments : myDocuments).filter(isDocumentOverdue);
    content = (
      <DocumentsTable
        title="Due for Review"
        documents={docs}
        columns={[titleColumn, departmentColumn, authorColumn, dateColumn('publishedAt', 'Published'), nextReviewColumn]}
        onTitleClick={setDetailDoc}
        banner={
          docs.length > 0 ? (
            <div className="border-b border-red-100 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-700">
              ⚠ These published documents have passed their review date and need revision initiated.
            </div>
          ) : undefined
        }
        renderActions={(doc) => (
          <>
            <ActionButton variant="primary" onClick={() => initiateRevision.mutate({ id: doc._id })}>
              Initiate Revision
            </ActionButton>
            <ActionButton onClick={() => setDetailDoc(doc)}>View</ActionButton>
          </>
        )}
        emptyTitle="No documents overdue"
        emptyDescription="All published documents are within their review period."
      />
    );
  } else if (view === 'assignment') {
    const docs = allDocuments.filter((d) => d.status === 'Pending Assignment');
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <DocumentsTable
          title="Pending Assignment"
          documents={docs}
          columns={[titleColumn, departmentColumn, typeColumn, authorColumn, dateColumn('createdAt', 'Submitted')]}
          onTitleClick={setDetailDoc}
          renderActions={(doc) => <AssignmentAction doc={doc} />}
          emptyTitle="No documents awaiting assignment"
          emptyDescription="Newly submitted drafts will appear here for reviewer/approver assignment."
        />
      </RoleGuard>
    );
  } else if (view === 'publishing') {
    const docs = allDocuments.filter((d) => d.status === 'Pending Publishing');
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <DocumentsTable
          title="Pending Publishing"
          documents={docs}
          columns={[titleColumn, departmentColumn, authorColumn, reviewerColumn, approverColumn]}
          onTitleClick={setDetailDoc}
          renderActions={(doc) => (
            <>
              <ActionButton variant="primary" onClick={() => publish.mutate({ id: doc._id })}>
                Publish
              </ActionButton>
              <ActionButton variant="danger" onClick={() => rejectPublishing.mutate({ id: doc._id })}>
                Reject
              </ActionButton>
              {reassignButton(doc)}
            </>
          )}
          emptyTitle="No documents awaiting publishing"
          emptyDescription="Approved documents will appear here for final sign-off."
        />
      </RoleGuard>
    );
  } else if (view === 'archive') {
    const docs = allDocuments.filter((d) => d.status === 'Archived');
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <ArchivedDocumentsPanel documents={docs} onView={setDetailDoc} onRestore={setRestoreDoc} />
      </RoleGuard>
    );
  } else if (view === 'authors') {
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <UserManagementPanel currentUserId={user.id} />
      </RoleGuard>
    );
  } else if (view === 'departments') {
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <DepartmentManagementPanel />
      </RoleGuard>
    );
  } else if (view === 'disciplines') {
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <DisciplineManagementPanel />
      </RoleGuard>
    );
  } else if (view === 'bulkUpload') {
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <BulkUploadPanel />
      </RoleGuard>
    );
  } else if (view === 'documentRegisterCreate') {
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <CreateDocumentRegisterDocumentPanel />
      </RoleGuard>
    );
  } else if (view === 'documentRegisterBulkUpload') {
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <DocumentRegisterBulkUploadPanel />
      </RoleGuard>
    );
  } else if (view === 'documentRegisterManage') {
    const registerDocs = allDocuments.filter((d) => d.destination === 'Document Register' && d.status === 'Published');
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        <ManageDocumentRegisterPanel documents={registerDocs} onEdit={setEditRegisterDoc} onArchive={setArchiveDoc} />
      </RoleGuard>
    );
  } else if (view === 'dept' && activeFilter) {
    const deptDocs = allDocuments.filter((d) => refName(d.department) === activeFilter);
    const due = deptDocs.filter(isDocumentOverdue);
    const inProgress = deptDocs.filter((d) =>
      (['Draft', 'Pending Assignment', ...ACTIVE_PIPELINE_STATUSES] as readonly string[]).includes(d.status)
    );
    const publishedCount = deptDocs.filter((d) => d.status === 'Published').length;
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        {due.length > 0 && (
          <DocumentsTable
            title="Due for Review"
            documents={due}
            columns={[titleColumn, authorColumn, dateColumn('publishedAt', 'Published'), nextReviewColumn]}
            onTitleClick={setDetailDoc}
            renderActions={(doc) => (
              <ActionButton variant="primary" onClick={() => initiateRevision.mutate({ id: doc._id })}>
                Initiate Revision
              </ActionButton>
            )}
          />
        )}
        <DocumentsTable
          title={`${activeFilter} — In Progress`}
          documents={inProgress}
          columns={[titleColumn, typeColumn, authorColumn, statusColumn]}
          onTitleClick={setDetailDoc}
          renderActions={(doc) => (
            <>
              {viewOnlyActions(doc)}
              {reassignButton(doc)}
            </>
          )}
          emptyTitle={`Nothing in progress for ${activeFilter}`}
        />
        <p className="text-center text-xs text-gray-400">
          {publishedCount} published document{publishedCount !== 1 ? 's' : ''} available on the{' '}
          <Link to="/read-site" className="font-semibold text-brand-700 hover:underline">
            Read Site →
          </Link>
        </p>
      </RoleGuard>
    );
  } else if (view === 'discipline' && activeFilter) {
    // Discipline is Drawing Register-only metadata, so this naturally only
    // ever matches Drawing Register documents (see document.model.js).
    const disciplineDocs = allDocuments.filter((d) => refName(d.discipline) === activeFilter);
    const due = disciplineDocs.filter(isDocumentOverdue);
    const inProgress = disciplineDocs.filter((d) =>
      (['Draft', 'Pending Assignment', ...ACTIVE_PIPELINE_STATUSES] as readonly string[]).includes(d.status)
    );
    const publishedCount = disciplineDocs.filter((d) => d.status === 'Published').length;
    content = (
      <RoleGuard allow={['controller']} role={user.role}>
        {due.length > 0 && (
          <DocumentsTable
            title="Due for Review"
            documents={due}
            columns={[titleColumn, authorColumn, dateColumn('publishedAt', 'Published'), nextReviewColumn]}
            onTitleClick={setDetailDoc}
            renderActions={(doc) => (
              <ActionButton variant="primary" onClick={() => initiateRevision.mutate({ id: doc._id })}>
                Initiate Revision
              </ActionButton>
            )}
          />
        )}
        <DocumentsTable
          title={`${activeFilter} — In Progress`}
          documents={inProgress}
          columns={[titleColumn, departmentColumn, authorColumn, statusColumn]}
          onTitleClick={setDetailDoc}
          renderActions={(doc) => (
            <>
              {viewOnlyActions(doc)}
              {reassignButton(doc)}
            </>
          )}
          emptyTitle={`Nothing in progress for ${activeFilter}`}
        />
        <p className="text-center text-xs text-gray-400">
          {publishedCount} published document{publishedCount !== 1 ? 's' : ''} available on the{' '}
          <Link to="/drawing-register" className="font-semibold text-brand-700 hover:underline">
            Drawing Register →
          </Link>
        </p>
      </RoleGuard>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl bg-brand-800 p-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-white">MS Publishing</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/70">{role.heroDescription}</p>
        </div>
        <div className="flex shrink-0 gap-2.5">
          {role.canCreate && (
            <button
              onClick={openNewDoc}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" /> New Document
            </button>
          )}
          <Link
            to="/read-site"
            className="inline-flex items-center rounded-lg border-2 border-white px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            View Read Site
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <MSPublishingSidebar
          role={role}
          activeView={view}
          activeFilter={activeFilter}
          counts={counts}
          onNavigate={handleNavigate}
        />
        <main className="min-w-0 flex-1">{content}</main>
      </div>

      {newDocOpen && (
        <NewDocumentModal
          onClose={() => setNewDocOpen(false)}
          onCreate={handleCreate}
          isSubmitting={createDocument.isPending}
        />
      )}
      {detailDoc && (
        <DocumentDetailModal
          doc={detailDoc}
          onClose={() => setDetailDoc(null)}
          onArchive={
            user.role === 'controller'
              ? () => {
                  setArchiveDoc(detailDoc);
                  setDetailDoc(null);
                }
              : undefined
          }
          onRestore={
            user.role === 'controller'
              ? () => {
                  setRestoreDoc(detailDoc);
                  setDetailDoc(null);
                }
              : undefined
          }
        />
      )}
      {archiveDoc && (
        <ArchiveConfirmModal
          doc={archiveDoc}
          isSubmitting={archiveDocument.isPending}
          onClose={() => setArchiveDoc(null)}
          onConfirm={() =>
            archiveDocument.mutate({ id: archiveDoc._id }, { onSuccess: () => setArchiveDoc(null) })
          }
        />
      )}
      {restoreDoc && (
        <RestoreConfirmModal
          doc={restoreDoc}
          isSubmitting={restoreDocument.isPending}
          onClose={() => setRestoreDoc(null)}
          onConfirm={() =>
            restoreDocument.mutate({ id: restoreDoc._id }, { onSuccess: () => setRestoreDoc(null) })
          }
        />
      )}
      {editDoc && (
        <EditDocumentModal
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSave={(payload) =>
            updateDocument.mutate(
              { id: editDoc._id, ...payload },
              { onSuccess: () => setEditDoc(null) }
            )
          }
          isSubmitting={updateDocument.isPending}
        />
      )}
      {editRegisterDoc && (
        <EditDocumentRegisterModal
          doc={editRegisterDoc}
          onClose={() => setEditRegisterDoc(null)}
          onSave={(payload) =>
            updateDocument.mutate(
              { id: editRegisterDoc._id, ...payload },
              { onSuccess: () => setEditRegisterDoc(null) }
            )
          }
          isSubmitting={updateDocument.isPending}
        />
      )}
      {reassignDoc && (
        <ReassignModal
          doc={reassignDoc}
          onClose={() => setReassignDoc(null)}
          isSubmitting={reassignDocument.isPending}
          onSave={(payload) =>
            reassignDocument.mutate(
              { id: reassignDoc._id, body: payload },
              { onSuccess: () => setReassignDoc(null) }
            )
          }
        />
      )}
    </>
  );
}
