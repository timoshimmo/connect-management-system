import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { useToast } from '@/features/toast';
import type { ApiDepartment, ApiDocument, Paginated } from '@/lib/apiTypes';

/** Public — no authentication required, matches the backend's read-site routes. */
export function useReadSitePublishedDocumentsQuery() {
  return useQuery({
    queryKey: ['read-site', 'documents'],
    queryFn: () =>
      apiRequest<Paginated<ApiDocument>>('/read-site/documents?limit=500').then((r) => r.items),
  });
}

export function useReadSiteDepartmentsQuery() {
  return useQuery({
    queryKey: ['read-site', 'departments'],
    queryFn: () => apiRequest<{ items: ApiDepartment[] }>('/read-site/departments').then((r) => r.items),
  });
}

export interface ReadSiteStats {
  totalDocuments: number;
  pendingApproval: number;
  publishedThisMonth: number;
  dueForReview: number;
}

/** Public — org-wide aggregate counts for the Dashboard hero. */
export function useReadSiteStatsQuery() {
  return useQuery({
    queryKey: ['read-site', 'stats'],
    queryFn: () => apiRequest<ReadSiteStats>('/read-site/stats'),
  });
}

export interface ContactControllerPayload {
  subject: string;
  message: string;
  department?: string;
  relatedDocument?: string;
}

/**
 * Public — "Contact Document Controller" from the Read Site, no auth
 * required. See features/drawing-register/hooks.ts's gated counterpart —
 * both are consumed by the same shared ContactControllerModal component.
 */
export function useReadSiteContactMutation() {
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (payload: ContactControllerPayload) =>
      apiRequest<{ id: string }>('/read-site/contact', { method: 'POST', body: payload }),
    onSuccess: () => showSuccess('Message sent', 'The Document Controller has been notified.'),
    onError: (err) =>
      showError('Couldn’t send message', err instanceof ApiError && err.message ? err.message : 'Please try again.'),
  });
}
