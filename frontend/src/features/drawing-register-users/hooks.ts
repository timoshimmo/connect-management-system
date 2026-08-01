import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { useToast } from '@/features/toast';
import type { ApiDrawingRegisterUser, ApiUserStatus } from '@/lib/apiTypes';

/**
 * Controller-only admin CRUD for Drawing Register viewer accounts — goes
 * through the normal MS Publishing apiClient (Controller's own session),
 * NOT the separate drawingRegisterApiClient, which is only for a Drawing
 * Register account's own self-service login. See drawingRegisterUser.routes.js:
 * these endpoints require MS Publishing authenticate + requireRole('controller').
 */

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

export function useDrawingRegisterUsersQuery() {
  return useQuery({
    queryKey: ['drawing-register-users'],
    queryFn: () => apiRequest<{ items: ApiDrawingRegisterUser[] }>('/drawing-register-users').then((r) => r.items),
  });
}

export interface CreateDrawingRegisterUserPayload {
  name: string;
  email: string;
  password: string;
  status?: ApiUserStatus;
  jobTitle?: string;
}

export function useCreateDrawingRegisterUserMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (payload: CreateDrawingRegisterUserPayload) =>
      apiRequest<{ user: ApiDrawingRegisterUser }>('/drawing-register-users', { method: 'POST', body: payload }).then(
        (r) => r.user
      ),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['drawing-register-users'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showSuccess('Drawing Register user created', `${user.name} can now sign in to the Drawing Register.`);
    },
    onError: (err) =>
      showError('Couldn’t create user', errorMessage(err, 'The user could not be created. Please check the details and try again.')),
  });
}

export interface UpdateDrawingRegisterUserPayload {
  id: string;
  name?: string;
  email?: string;
  status?: ApiUserStatus;
  jobTitle?: string;
}

export function useUpdateDrawingRegisterUserMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ id, ...updates }: UpdateDrawingRegisterUserPayload) =>
      apiRequest<{ user: ApiDrawingRegisterUser }>(`/drawing-register-users/${id}`, {
        method: 'PATCH',
        body: updates,
      }).then((r) => r.user),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['drawing-register-users'] });
      showSuccess('User updated', `Changes to ${user.name}'s profile were saved.`);
    },
    onError: (err) =>
      showError('Couldn’t update user', errorMessage(err, 'The user could not be updated. Please check the details and try again.')),
  });
}

export function useResetDrawingRegisterUserPasswordMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiRequest<{ user: ApiDrawingRegisterUser }>(`/drawing-register-users/${id}/reset-password`, {
        method: 'PATCH',
        body: { password },
      }).then((r) => r.user),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['drawing-register-users'] });
      showSuccess('Password reset', `${user.name}'s password was changed and existing sessions were signed out.`);
    },
    onError: (err) => showError('Couldn’t reset password', errorMessage(err, 'Please try again.')),
  });
}
