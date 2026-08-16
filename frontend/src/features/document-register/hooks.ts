import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';
import type {
  ApiDocument,
  ApiDocumentRegisterTypeCount,
  ApiDocumentRegisterIsoCount,
  Paginated,
} from '@/lib/apiTypes';

export interface DocumentRegisterFilters {
  search?: string;
  type?: string;
  isoStandard?: string;
}

function toQueryString(filters: DocumentRegisterFilters): string {
  const params = new URLSearchParams({ limit: '500' });
  if (filters.search) params.set('search', filters.search);
  if (filters.type) params.set('type', filters.type);
  if (filters.isoStandard) params.set('isoStandard', filters.isoStandard);
  return params.toString();
}

/** Public — no authentication required, matches the backend's document-register routes. */
export function useDocumentRegisterDocumentsQuery(filters: DocumentRegisterFilters) {
  return useQuery({
    queryKey: ['document-register', 'documents', filters],
    queryFn: () =>
      apiRequest<Paginated<ApiDocument>>(`/document-register/documents?${toQueryString(filters)}`).then(
        (r) => r.items
      ),
  });
}

/** Live per-type counts for the "Document Type" filter sidebar — never hardcoded, see documentRegister.controller.js. */
export function useDocumentRegisterTypesQuery() {
  return useQuery({
    queryKey: ['document-register', 'types'],
    queryFn: () =>
      apiRequest<{ items: ApiDocumentRegisterTypeCount[] }>('/document-register/types').then((r) => r.items),
  });
}

/** Live per-standard counts for the "ISO Standard" filter sidebar. */
export function useDocumentRegisterIsoStandardsQuery() {
  return useQuery({
    queryKey: ['document-register', 'iso-standards'],
    queryFn: () =>
      apiRequest<{ items: ApiDocumentRegisterIsoCount[] }>('/document-register/iso-standards').then(
        (r) => r.items
      ),
  });
}

export function useDocumentRegisterDocumentQuery(id: string | null) {
  return useQuery({
    queryKey: ['document-register', 'document', id],
    queryFn: () => apiRequest<{ document: ApiDocument }>(`/document-register/${id}`).then((r) => r.document),
    enabled: Boolean(id),
  });
}
