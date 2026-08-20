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

/** Controls whether the "Sign in with Microsoft" button (and Profile page's Connect option) render at all. */
export function useMicrosoftSsoEnabledQuery() {
  return useQuery({
    queryKey: ['auth', 'microsoft', 'enabled'],
    queryFn: () => apiRequest<{ enabled: boolean }>('/auth/microsoft/enabled').then((r) => r.enabled),
    staleTime: Infinity,
  });
}

/**
 * Authenticated "Connect Microsoft" from the Profile page — a plain
 * navigation can't carry the Bearer token, so this fetches the Microsoft
 * URL (which also sets the short-lived OAuth cookie via Set-Cookie on this
 * same response) and the caller does the actual `window.location.href`
 * navigation. See auth/microsoft.controller.js's linkStart.
 */
export function useMicrosoftLinkMutation() {
  const { showError } = useToast();
  return useMutation({
    mutationFn: () => apiRequest<{ url: string }>('/auth/microsoft/link/start', { method: 'POST' }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => showError('Couldn’t connect Microsoft', errorMessage(err, 'Please try again shortly.')),
  });
}

export function useMicrosoftUnlinkMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: () => apiRequest<{ user: ApiUser }>('/auth/microsoft/unlink', { method: 'POST' }).then((r) => r.user),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      showSuccess('Microsoft disconnected', 'You can still sign in with your password.');
    },
    onError: (err) => showError('Couldn’t disconnect Microsoft', errorMessage(err, 'Please try again shortly.')),
  });
}

/** Short machine codes from auth/microsoft.controller.js's callback redirect — see the plan's "never leak raw backend errors" requirement. */
export const SSO_ERROR_MESSAGES: Record<string, string> = {
  unauthorized_tenant: 'That Microsoft account belongs to a different organization and cannot sign in here.',
  inactive: 'This account has been deactivated. Contact your Document Controller.',
  cancelled: 'Microsoft sign-in was cancelled.',
  link_conflict: 'That Microsoft account is already linked to a different STAC Management System user.',
  config_error: 'Microsoft sign-in is not configured correctly. Contact your administrator.',
  unknown: 'Something went wrong signing in with Microsoft. Please try again.',
};
