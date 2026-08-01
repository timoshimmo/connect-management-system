import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';
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
