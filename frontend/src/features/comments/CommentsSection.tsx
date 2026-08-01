import { FormEvent, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useCommentsQuery, useCreateCommentMutation } from './hooks';
import { formatRelativeTime } from '@/features/notifications';
import { refName } from '@/lib/apiTypes';

interface CommentsSectionProps {
  targetType: 'document' | 'drawing';
  targetId: string;
}

/**
 * Reusable comment thread — used by the document Review flow today
 * (reviewer feedback) but works identically for drawings once that module
 * is re-enabled. Backed by the shared /comments API.
 */
export function CommentsSection({ targetType, targetId }: CommentsSectionProps) {
  const { data: comments = [], isLoading } = useCommentsQuery(targetType, targetId);
  const createComment = useCreateCommentMutation(targetType, targetId);
  const [draft, setDraft] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    createComment.mutate(body, { onSuccess: () => setDraft('') });
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3.5">
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <MessageSquare className="h-3.5 w-3.5" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </div>

      {isLoading ? (
        <p className="text-xs text-gray-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="mb-3 text-xs text-gray-400">No comments yet.</p>
      ) : (
        <ul className="mb-3 max-h-48 space-y-2.5 overflow-y-auto">
          {comments.map((comment) => (
            <li key={comment._id} className="rounded-lg bg-white p-2.5 text-xs shadow-sm">
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-800">{refName(comment.author)}</span>
                <span className="text-[10px] text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
              </div>
              <p className="text-gray-600">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
        />
        <button
          type="submit"
          disabled={!draft.trim() || createComment.isPending}
          className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Post
        </button>
      </form>
    </div>
  );
}
