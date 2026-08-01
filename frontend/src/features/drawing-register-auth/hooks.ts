import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { drApiRequest, ApiError } from '@/lib/drawingRegisterApiClient';
import { setDrawingRegisterAccessToken } from '@/lib/drawingRegisterTokenStore';
import { useToast } from '@/features/toast';
import type { ApiDrawingRegisterUser } from '@/lib/apiTypes';

/** Mirrors features/auth/hooks.ts, but talking to the separate /drawing-register-auth/* endpoints via drApiRequest. */

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

export function useDrawingRegisterLoginMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      drApiRequest<{ accessToken: string; user: ApiDrawingRegisterUser }>('/drawing-register-auth/login', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data) => {
      setDrawingRegisterAccessToken(data.accessToken);
      queryClient.setQueryData(['drawing-register-auth', 'me'], data.user);
      showSuccess('Signed in', `Welcome back, ${data.user.name}.`);
    },
    onError: (err) => showError('Sign in failed', errorMessage(err, 'Invalid email or password.')),
  });
}

export function useDrawingRegisterLogoutMutation() {
  const queryClient = useQueryClient();
  const { showSuccess } = useToast();
  return useMutation({
    mutationFn: () => drApiRequest<{ message: string }>('/drawing-register-auth/logout', { method: 'POST' }),
    onSettled: () => {
      setDrawingRegisterAccessToken(null);
      queryClient.setQueryData(['drawing-register-auth', 'me'], null);
      queryClient.removeQueries({ queryKey: ['drawing-register-auth'] });
      queryClient.removeQueries({ queryKey: ['drawing-register'] });
      showSuccess('Signed out', 'You have been signed out successfully.');
    },
  });
}

/** Cached "who am I" for the Drawing Register session — separate cache key from MS Publishing's. */
export function useDrawingRegisterMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['drawing-register-auth', 'me'],
    queryFn: () =>
      drApiRequest<{ user: ApiDrawingRegisterUser }>('/drawing-register-auth/me').then((r) => r.user),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}
