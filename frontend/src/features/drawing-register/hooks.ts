import { useQuery } from '@tanstack/react-query';
import { drApiRequest } from '@/lib/drawingRegisterApiClient';
import type { ApiDepartment, ApiDocument, Paginated } from '@/lib/apiTypes';

/**
 * Gated — requires a Drawing Register session (drApiRequest carries the
 * Drawing Register access token, not MS Publishing's). Mirrors
 * features/read-site/hooks.ts's shape exactly, but reading from
 * /drawing-register/* (destination:'Drawing Register' documents only).
 */
export function useDrawingRegisterDocumentsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['drawing-register', 'documents'],
    queryFn: () =>
      drApiRequest<Paginated<ApiDocument>>('/drawing-register/documents?limit=500').then((r) => r.items),
    enabled,
  });
}

export function useDrawingRegisterDepartmentsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['drawing-register', 'departments'],
    queryFn: () => drApiRequest<{ items: ApiDepartment[] }>('/drawing-register/departments').then((r) => r.items),
    enabled,
  });
}
