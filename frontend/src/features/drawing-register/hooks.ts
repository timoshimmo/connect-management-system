import { useMutation, useQuery } from '@tanstack/react-query';
import { drApiRequest, ApiError } from '@/lib/drawingRegisterApiClient';
import { useToast } from '@/features/toast';
import type { ApiDepartment, ApiDocument, Paginated } from '@/lib/apiTypes';
import type { ContactControllerPayload } from '@/features/read-site';

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

/**
 * Gated — "Contact Document Controller" from the Drawing Register, carries
 * the submitter's Drawing Register session. Mirrors
 * features/read-site/hooks.ts's public counterpart — both are consumed by
 * the same shared ContactControllerModal component.
 */
export function useDrawingRegisterContactMutation() {
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (payload: ContactControllerPayload) =>
      drApiRequest<{ id: string }>('/drawing-register/contact', { method: 'POST', body: payload }),
    onSuccess: () => showSuccess('Message sent', 'The Document Controller has been notified.'),
    onError: (err) =>
      showError('Couldn’t send message', err instanceof ApiError && err.message ? err.message : 'Please try again.'),
  });
}
