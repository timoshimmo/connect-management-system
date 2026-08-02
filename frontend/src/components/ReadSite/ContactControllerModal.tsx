import { FormEvent, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface ContactControllerDepartmentOption {
  id: string;
  name: string;
}

export interface ContactControllerDocumentOption {
  id: string;
  title: string;
}

interface ContactControllerModalProps {
  departments: ContactControllerDepartmentOption[];
  documents: ContactControllerDocumentOption[];
  /** Pre-selected if the visitor already has a department filter active on the page. */
  preselectedDepartmentId?: string;
  onClose: () => void;
  onSubmit: (payload: { subject: string; message: string; department?: string; relatedDocument?: string }) => void;
  isSubmitting?: boolean;
}

/**
 * "Contact Document Controller" form — shared by the Read Site and the
 * Drawing Register (each page passes its own onSubmit backed by its own
 * public/gated mutation, see features/read-site and features/drawing-register).
 */
export function ContactControllerModal({
  departments,
  documents,
  preselectedDepartmentId,
  onClose,
  onSubmit,
  isSubmitting,
}: ContactControllerModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [department, setDepartment] = useState(preselectedDepartmentId ?? '');
  const [relatedDocument, setRelatedDocument] = useState('');

  const canSubmit = subject.trim() && message.trim();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      subject: subject.trim(),
      message: message.trim(),
      department: department || undefined,
      relatedDocument: relatedDocument || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-emerald-800 px-5 py-4">
          <h3 className="text-sm font-bold text-white">Contact Document Controller</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded bg-white/15 text-white hover:bg-white/25"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Missing revision on HSE-2026-001"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Related Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
            >
              <option value="">None / not sure</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Related Document (optional)</label>
            <select
              value={relatedDocument}
              onChange={(e) => setRelatedDocument(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
            >
              <option value="">None</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Message *</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question or request..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
            />
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
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
