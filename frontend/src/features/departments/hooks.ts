import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { useToast } from '@/features/toast';
import type { ApiDepartment, ApiEntityStatus, Paginated } from '@/lib/apiTypes';

/** Dropdown/browse use — only Active departments, no pagination noise. */
export function useDepartmentsQuery(enabled = true) {
  return useQuery({
    queryKey: ['departments', 'active'],
    queryFn: () =>
      apiRequest<{ items: ApiDepartment[] }>('/departments?status=Active&limit=100').then((r) => r.items),
    enabled,
  });
}

export interface DepartmentAdminFilters {
  search?: string;
  status?: ApiEntityStatus;
  page?: number;
  limit?: number;
}

function toQueryString(filters: DepartmentAdminFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));
  return params.toString();
}

/** Department Management admin table — searchable/paginated, includes Inactive. */
export function useDepartmentsAdminQuery(filters: DepartmentAdminFilters = {}) {
  return useQuery({
    queryKey: ['departments', 'admin', filters],
    queryFn: () => apiRequest<Paginated<ApiDepartment>>(`/departments?${toQueryString(filters)}`),
  });
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

function useInvalidateDepartments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['departments'] });
}

export function useCreateDepartmentMutation() {
  const invalidate = useInvalidateDepartments();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (payload: { name: string; code: string; status?: ApiEntityStatus }) =>
      apiRequest<{ department: ApiDepartment }>('/departments', { method: 'POST', body: payload }).then(
        (r) => r.department
      ),
    onSuccess: (dept) => {
      invalidate();
      showSuccess('Department created', `"${dept.name}" was added.`);
    },
    onError: (err) => showError('Couldn’t create department', errorMessage(err, 'Please try again.')),
  });
}

export function useUpdateDepartmentMutation() {
  const invalidate = useInvalidateDepartments();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      code?: string;
      status?: ApiEntityStatus;
    }) =>
      apiRequest<{ department: ApiDepartment }>(`/departments/${id}`, { method: 'PATCH', body: updates }).then(
        (r) => r.department
      ),
    onSuccess: (dept) => {
      invalidate();
      showSuccess('Department updated', `"${dept.name}" was saved.`);
    },
    onError: (err) => showError('Couldn’t update department', errorMessage(err, 'Please try again.')),
  });
}
