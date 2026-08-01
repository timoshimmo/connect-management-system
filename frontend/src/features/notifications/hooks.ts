import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';
import type { ApiNotification } from '@/lib/apiTypes';

const POLL_INTERVAL_MS = 20_000;

/**
 * Polls the notifications endpoint on an interval. Swapping this for a
 * real-time transport later (WebSocket/SSE) only means replacing the
 * `refetchInterval` polling here with a push-driven `queryClient.setQueryData`
 * call — every consumer (NotificationBell, NotificationPanel) reads from this
 * same TanStack Query cache key and doesn't need to change.
 */
export function useNotificationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      apiRequest<{ items: ApiNotification[]; unreadCount: number }>('/notifications'),
    enabled,
    refetchInterval: enabled ? POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ notification: ApiNotification }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<{ message: string }>('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
