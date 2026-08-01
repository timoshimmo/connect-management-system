import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { useToast } from '@/features/toast';
import type { ApiComment } from '@/lib/apiTypes';

type TargetType = 'document' | 'drawing';

export function useCommentsQuery(targetType: TargetType, targetId: string, enabled = true) {
  return useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: () =>
      apiRequest<{ items: ApiComment[] }>(`/comments?targetType=${targetType}&targetId=${targetId}`).then(
        (r) => r.items
      ),
    enabled: enabled && !!targetId,
  });
}

export function useCreateCommentMutation(targetType: TargetType, targetId: string) {
  const queryClient = useQueryClient();
  const { showError } = useToast();
  return useMutation({
    mutationFn: (body: string) =>
      apiRequest<{ comment: ApiComment }>('/comments', { method: 'POST', body: { targetType, targetId, body } }).then(
        (r) => r.comment
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] }),
    onError: (err) =>
      showError(
        'Couldn’t post comment',
        err instanceof ApiError && err.message ? err.message : 'Please try again.'
      ),
  });
}
