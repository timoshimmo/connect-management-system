import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, apiUpload, ApiError } from '@/lib/apiClient';
import { useToast } from '@/features/toast';
import type { ApiDocument, ApiDocumentDestination, ApiDocumentType, Paginated } from '@/lib/apiTypes';

export interface DocumentFilters {
  department?: string;
  type?: ApiDocumentType;
  status?: string;
  search?: string;
  limit?: number;
}

function toQueryString(filters: DocumentFilters): string {
  const params = new URLSearchParams();
  if (filters.department) params.set('department', filters.department);
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  params.set('limit', String(filters.limit ?? 500));
  return params.toString();
}

/** All documents the current user is allowed to see, fetched once per page and filtered client-side by view. */
export function useDocumentsQuery(filters: DocumentFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () =>
      apiRequest<Paginated<ApiDocument>>(`/documents?${toQueryString(filters)}`).then((r) => r.items),
    enabled,
  });
}

function useInvalidateDocuments() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
}

/** Extracts a meaningful message from an ApiError, falling back to a specific (never generic) default. */
function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

export function useCreateDocumentMutation() {
  const invalidate = useInvalidateDocuments();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      department: string;
      destination: ApiDocumentDestination;
      /** Read Site only. */
      type?: ApiDocumentType;
      description?: string;
      location?: string;
      /** Drawing Register only. */
      drawingNumber?: string;
      discipline?: string;
      area?: string;
      revision?: string;
      file?: File | null;
    }) => {
      const form = new FormData();
      form.set('title', payload.title);
      form.set('department', payload.department);
      form.set('destination', payload.destination);
      if (payload.type) form.set('type', payload.type);
      if (payload.description) form.set('description', payload.description);
      if (payload.location) form.set('location', payload.location);
      if (payload.drawingNumber) form.set('drawingNumber', payload.drawingNumber);
      if (payload.discipline) form.set('discipline', payload.discipline);
      if (payload.area) form.set('area', payload.area);
      if (payload.revision) form.set('revision', payload.revision);
      if (payload.file) form.set('file', payload.file);
      return apiUpload<{ document: ApiDocument }>('/documents', form).then((r) => r.document);
    },
    onSuccess: (doc) => {
      invalidate();
      showSuccess('Document created', `"${doc.title}" was saved as a draft (${doc.docId}).`);
    },
    onError: (err) => showError('Couldn’t create document', errorMessage(err, 'The document could not be saved. Please try again.')),
  });
}

export interface UpdateDocumentPayload {
  id: string;
  title?: string;
  department?: string;
  type?: ApiDocumentType;
  description?: string;
  location?: string;
  destination?: ApiDocumentDestination;
  drawingNumber?: string;
  discipline?: string;
  area?: string;
  revision?: string;
  /** Only sent alongside `file` — a note on the replacement version, never part of the document's own fields. */
  changeNote?: string;
  file?: File | null;
}

/**
 * Updates a draft's metadata (PATCH /documents/:id) and, if a replacement
 * file is given, uploads it as a new version (POST /documents/:id/versions)
 * — reusing the same versioning endpoint document creation and manual
 * re-uploads already use, so editing never overwrites or duplicates a
 * document, it only ever adds a new version.
 */
export function useUpdateDocumentMutation() {
  const invalidate = useInvalidateDocuments();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ id, file, changeNote, ...metadata }: UpdateDocumentPayload) => {
      const hasMetadata = Object.values(metadata).some((v) => v !== undefined);
      const metadataUpdate = hasMetadata
        ? apiRequest<{ document: ApiDocument }>(`/documents/${id}`, { method: 'PATCH', body: metadata }).then(
            (r) => r.document
          )
        : Promise.resolve(undefined);

      return metadataUpdate.then((updated) => {
        if (!file) return updated as ApiDocument;
        const form = new FormData();
        form.set('file', file);
        if (changeNote) form.set('changeNote', changeNote);
        return apiUpload<{ version: unknown }>(`/documents/${id}/versions`, form).then(() =>
          apiRequest<{ document: ApiDocument }>(`/documents/${id}`).then((r) => r.document)
        );
      });
    },
    onSuccess: (doc) => {
      invalidate();
      if (doc) showSuccess('Document updated', `Changes to "${doc.title}" were saved.`);
    },
    onError: (err) => showError('Couldn’t save changes', errorMessage(err, 'The document could not be updated. Please try again.')),
  });
}

const ACTION_MESSAGES: Record<string, { success: (doc: ApiDocument) => [string, string]; error: string }> = {
  submit: {
    success: (doc) => ['Submitted for review', `"${doc.title}" is now awaiting reviewer/approver assignment.`],
    error: 'Couldn’t submit this document for review.',
  },
  assign: {
    success: (doc) => ['Reviewer & approver assigned', `"${doc.title}" moved to Under Review.`],
    error: 'Couldn’t assign a reviewer and approver.',
  },
  forward: {
    success: (doc) => ['Forwarded to approver', `"${doc.title}" moved to Pending Approval.`],
    error: 'Couldn’t forward this document to the approver.',
  },
  return: {
    success: (doc) => ['Changes requested', `"${doc.title}" was returned to the author.`],
    error: 'Couldn’t return this document to the author.',
  },
  approve: {
    success: (doc) => ['Document approved', `"${doc.title}" moved to Pending Publishing.`],
    error: 'Couldn’t approve this document.',
  },
  reject: {
    success: (doc) => ['Document rejected', `"${doc.title}" was sent back to Under Review.`],
    error: 'Couldn’t reject this document.',
  },
  publish: {
    success: (doc) => ['Document published', `"${doc.title}" is now live on the Read Site.`],
    error: 'Couldn’t publish this document.',
  },
  'reject-publishing': {
    success: (doc) => ['Publishing rejected', `"${doc.title}" was sent back to Pending Approval.`],
    error: 'Couldn’t reject publishing for this document.',
  },
  archive: {
    success: (doc) => ['Document archived', `"${doc.title}" was moved to the archive and removed from the Read Site.`],
    error: 'Couldn’t archive this document.',
  },
  restore: {
    success: (doc) => ['Document restored', `"${doc.title}" is published on the Read Site again.`],
    error: 'Couldn’t restore this document.',
  },
  'initiate-revision': {
    success: (doc) => ['Revision started', `"${doc.title}" is back in Draft for updates.`],
    error: 'Couldn’t start a revision for this document.',
  },
};

function useDocumentAction(action: keyof typeof ACTION_MESSAGES) {
  const invalidate = useInvalidateDocuments();
  const { showSuccess, showError } = useToast();
  const messages = ACTION_MESSAGES[action];
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: unknown }) =>
      apiRequest<{ document: ApiDocument }>(`/documents/${id}/${action}`, { method: 'POST', body }).then(
        (r) => r.document
      ),
    onSuccess: (doc) => {
      invalidate();
      const [title, message] = messages.success(doc);
      showSuccess(title, message);
    },
    onError: (err) => showError(messages.error, errorMessage(err, 'Please try again.')),
  });
}

export function useSubmitForReviewMutation() {
  return useDocumentAction('submit');
}
export function useAssignMutation() {
  return useDocumentAction('assign');
}
export function useForwardMutation() {
  return useDocumentAction('forward');
}
export function useReturnToAuthorMutation() {
  return useDocumentAction('return');
}
export function useApproveMutation() {
  return useDocumentAction('approve');
}
export function useRejectMutation() {
  return useDocumentAction('reject');
}
export function usePublishMutation() {
  return useDocumentAction('publish');
}
export function useRejectPublishingMutation() {
  return useDocumentAction('reject-publishing');
}
export function useArchiveMutation() {
  return useDocumentAction('archive');
}
export function useRestoreMutation() {
  return useDocumentAction('restore');
}
export function useInitiateRevisionMutation() {
  return useDocumentAction('initiate-revision');
}
