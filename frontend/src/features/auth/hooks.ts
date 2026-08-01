import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { setAccessToken } from '@/lib/tokenStore';
import { useToast } from '@/features/toast';
import type { ApiUser } from '@/lib/apiTypes';

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      apiRequest<{ accessToken: string; user: ApiUser }>('/auth/login', { method: 'POST', body: payload }),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(['auth', 'me'], data.user);
      showSuccess('Signed in', `Welcome back, ${data.user.name}.`);
    },
    onError: (err) => showError('Sign in failed', errorMessage(err, 'Invalid email or password.')),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { showSuccess } = useToast();
  return useMutation({
    mutationFn: () => apiRequest<{ message: string }>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      setAccessToken(null);
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      showSuccess('Signed out', 'You have been signed out successfully.');
    },
  });
}

/** Cached "who am I" — the single source of truth for the current user's profile/role. */
export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest<{ user: ApiUser }>('/auth/me').then((r) => r.user),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}

export function useForgotPasswordMutation() {
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (email: string) =>
      apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
    onSuccess: (data) => showSuccess('Reset link sent', data.message),
    onError: (err) => showError('Couldn’t send reset link', errorMessage(err, 'Please try again shortly.')),
  });
}

export function useResetPasswordMutation() {
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      apiRequest<{ message: string }>(`/auth/reset-password/${token}`, {
        method: 'POST',
        body: { password },
      }),
    onSuccess: () => showSuccess('Password reset', 'You can now sign in with your new password.'),
    onError: (err) => showError('Couldn’t reset password', errorMessage(err, 'This reset link may have expired.')),
  });
}
