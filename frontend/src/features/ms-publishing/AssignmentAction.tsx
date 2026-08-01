import { useState } from 'react';
import { useUsersQuery } from '@/features/users/hooks';
import { useAssignMutation } from '@/features/documents/hooks';
import type { ApiDocument } from '@/lib/apiTypes';

/**
 * Inline reviewer/approver pickers + "Assign" button for a single row in the
 * Controller's Pending Assignment queue. Selecting both and confirming moves
 * the document straight to Under Review with both roles pre-assigned.
 */
export function AssignmentAction({ doc }: { doc: ApiDocument }) {
  const { data: reviewers = [] } = useUsersQuery('reviewer');
  const { data: approvers = [] } = useUsersQuery('approver');
  const assignMutation = useAssignMutation();
  const [reviewer, setReviewer] = useState('');
  const [approver, setApprover] = useState('');

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={reviewer}
        onChange={(e) => setReviewer(e.target.value)}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-700 focus:outline-none"
      >
        <option value="">Reviewer...</option>
        {reviewers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <select
        value={approver}
        onChange={(e) => setApprover(e.target.value)}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-700 focus:outline-none"
      >
        <option value="">Approver...</option>
        {approvers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!reviewer || !approver || assignMutation.isPending}
        onClick={() => assignMutation.mutate({ id: doc._id, body: { reviewer, approver } })}
        className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Assign
      </button>
    </div>
  );
}
