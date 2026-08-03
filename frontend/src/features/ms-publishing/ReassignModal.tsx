import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import { useUsersQuery } from '@/features/users/hooks';
import { refId, refName } from '@/lib/apiTypes';
import type { ApiDocument } from '@/lib/apiTypes';
import { SearchableSelect } from './SearchableSelect';

interface ReassignModalProps {
  doc: ApiDocument;
  onClose: () => void;
  onSave: (payload: { reviewer?: string; approver?: string; reason: string }) => void;
  isSubmitting?: boolean;
}

const STATUS_LABELS: Partial<Record<ApiDocument['status'], string>> = {
  'Pending Publishing': 'Approved (awaiting publishing)',
};

function displayStatus(doc: ApiDocument): string {
  if (doc.status === 'Draft' && doc.returned) return 'Changes Requested';
  return STATUS_LABELS[doc.status] ?? doc.status;
}

/**
 * Admin Controller-only: reassign the reviewer and/or approver on a
 * document that's already in progress (Under Review, Pending Approval,
 * Pending Publishing, or back with the author for changes), without
 * disturbing its current workflow status. See useReassignMutation /
 * POST /documents/:id/reassign.
 */
export function ReassignModal({ doc, onClose, onSave, isSubmitting }: ReassignModalProps) {
  const { data: reviewers = [] } = useUsersQuery('reviewer');
  const { data: approvers = [] } = useUsersQuery('approver');

  const initialReviewerId = refId(doc.reviewer) ?? '';
  const initialApproverId = refId(doc.approver) ?? '';
  const [reviewerId, setReviewerId] = useState(initialReviewerId);
  const [approverId, setApproverId] = useState(initialApproverId);
  const [reason, setReason] = useState('');

  const reviewerChanged = reviewerId !== initialReviewerId;
  const approverChanged = approverId !== initialApproverId;
  const changed = reviewerChanged || approverChanged;
  const canSubmit = changed && reason.trim().length > 0;

  // Mirrors the backend's restart rule (reassignReviewerApprover): a new
  // reviewer restarts from "Under Review"; a new approver alone restarts
  // from "Pending Approval". Documents still with the author (Draft) aren't
  // pulled forward early, so no restart happens there.
  const restartStatus =
    doc.status === 'Draft' ? null : reviewerChanged ? 'Under Review' : approverChanged ? 'Pending Approval' : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSave({
      reviewer: reviewerId || undefined,
      approver: approverId || undefined,
      reason: reason.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-brand-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-white">Reassign Reviewer / Approver</h3>
            <p className="mt-0.5 text-xs text-white/70">Doc ID: {doc.docId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg bg-gray-50 p-3.5">
            <div className="col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Document Title</dt>
              <dd className="mt-0.5 text-sm font-semibold text-gray-800">{doc.title}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                {doc.drawingNumber ? 'Drawing Number' : 'Document Number'}
              </dt>
              <dd className="mt-0.5 text-sm text-gray-700">{doc.drawingNumber || doc.docId}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Current Status</dt>
              <dd className="mt-0.5 text-sm text-gray-700">{displayStatus(doc)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Current Reviewer</dt>
              <dd className="mt-0.5 text-sm text-gray-700">{refName(doc.reviewer)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Current Approver</dt>
              <dd className="mt-0.5 text-sm text-gray-700">{refName(doc.approver)}</dd>
            </div>
          </dl>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">New Reviewer</label>
            <SearchableSelect
              options={reviewers.map((u) => ({ id: u.id, label: u.name, sublabel: u.email }))}
              value={reviewerId}
              onChange={setReviewerId}
              placeholder="Select a reviewer..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">New Approver</label>
            <SearchableSelect
              options={approvers.map((u) => ({ id: u.id, label: u.name, sublabel: u.email }))}
              value={approverId}
              onChange={setApproverId}
              placeholder="Select an approver..."
            />
          </div>

          {restartStatus && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This will move the document back to <span className="font-semibold">{restartStatus}</span> so the
              newly assigned {reviewerChanged ? 'reviewer' : 'approver'} can start fresh.
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Reason for Reassignment *</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Original reviewer is on leave"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
            {!changed && (
              <p className="mt-1 text-[11px] text-gray-400">Select a different reviewer and/or approver to reassign.</p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
