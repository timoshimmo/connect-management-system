import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { useToast } from '@/features/toast';
import type { ApiRole, ApiUser, ApiUserStatus } from '@/lib/apiTypes';

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

export function useUsersQuery(role?: ApiRole, enabled = true) {
  return useQuery({
    queryKey: ['users', role ?? 'all'],
    queryFn: () => apiRequest<{ items: ApiUser[] }>(`/users${role ? `?role=${role}` : ''}`).then((r) => r.items),
    enabled,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      password: string;
      role: ApiRole;
      department?: string | null;
      status?: ApiUserStatus;
    }) => apiRequest<{ user: ApiUser }>('/users', { method: 'POST', body: payload }).then((r) => r.user),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showSuccess('User created', `${user.name} was added as ${user.role}.`);
    },
    onError: (err) => showError('Couldn’t create user', errorMessage(err, 'The user could not be created. Please check the details and try again.')),
  });
}

export interface UpdateUserPayload {
  id: string;
  name?: string;
  email?: string;
  role?: ApiRole;
  department?: string | null;
  status?: ApiUserStatus;
  jobTitle?: string;
}

/** Full profile edit — name/email/department/role/status/job title. Never touches the password (see forgot/reset password). */
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ id, ...updates }: UpdateUserPayload) =>
      apiRequest<{ user: ApiUser }>(`/users/${id}`, { method: 'PATCH', body: updates }).then((r) => r.user),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('User updated', `Changes to ${user.name}'s profile were saved.`);
    },
    onError: (err) => showError('Couldn’t update user', errorMessage(err, 'The user could not be updated. Please check the details and try again.')),
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: ApiRole }) =>
      apiRequest<{ user: ApiUser }>(`/users/${id}/role`, { method: 'PATCH', body: { role } }).then((r) => r.user),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('User updated', `${user.name}'s role is now ${user.role}.`);
    },
    onError: (err) => showError('Couldn’t update user', errorMessage(err, 'The role could not be changed. Please try again.')),
  });
}
