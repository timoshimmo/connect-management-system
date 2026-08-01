import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';
import type { ApiDepartment } from '@/lib/apiTypes';

export function useDepartmentsQuery(enabled = true) {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => apiRequest<{ items: ApiDepartment[] }>('/departments').then((r) => r.items),
    enabled,
  });
}
