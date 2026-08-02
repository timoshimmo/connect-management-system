import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { useToast } from '@/features/toast';
import type { ApiDiscipline, ApiEntityStatus, Paginated } from '@/lib/apiTypes';

/** Discipline dropdown — Drawing Register documents only, never hardcoded. */
export function useDisciplinesQuery(enabled = true) {
  return useQuery({
    queryKey: ['disciplines', 'active'],
    queryFn: () =>
      apiRequest<{ items: ApiDiscipline[] }>('/disciplines?status=Active&limit=100').then((r) => r.items),
    enabled,
  });
}

export interface DisciplineAdminFilters {
  search?: string;
  status?: ApiEntityStatus;
  page?: number;
  limit?: number;
}

function toQueryString(filters: DisciplineAdminFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));
  return params.toString();
}

/** Discipline Management admin table — searchable/paginated, includes Inactive. */
export function useDisciplinesAdminQuery(filters: DisciplineAdminFilters = {}) {
  return useQuery({
    queryKey: ['disciplines', 'admin', filters],
    queryFn: () => apiRequest<Paginated<ApiDiscipline>>(`/disciplines?${toQueryString(filters)}`),
  });
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

function useInvalidateDisciplines() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['disciplines'] });
}

export function useCreateDisciplineMutation() {
  const invalidate = useInvalidateDisciplines();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (payload: { name: string; status?: ApiEntityStatus }) =>
      apiRequest<{ discipline: ApiDiscipline }>('/disciplines', { method: 'POST', body: payload }).then(
        (r) => r.discipline
      ),
    onSuccess: (disc) => {
      invalidate();
      showSuccess('Discipline created', `"${disc.name}" was added.`);
    },
    onError: (err) => showError('Couldn’t create discipline', errorMessage(err, 'Please try again.')),
  });
}

export function useUpdateDisciplineMutation() {
  const invalidate = useInvalidateDisciplines();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; name?: string; status?: ApiEntityStatus }) =>
      apiRequest<{ discipline: ApiDiscipline }>(`/disciplines/${id}`, { method: 'PATCH', body: updates }).then(
        (r) => r.discipline
      ),
    onSuccess: (disc) => {
      invalidate();
      showSuccess('Discipline updated', `"${disc.name}" was saved.`);
    },
    onError: (err) => showError('Couldn’t update discipline', errorMessage(err, 'Please try again.')),
  });
}
