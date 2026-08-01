import { FormEvent, useState } from 'react';
import { X, Paperclip, FileText } from 'lucide-react';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import { refId } from '@/lib/apiTypes';
import type { ApiDocument, ApiDocumentDestination, ApiDocumentType } from '@/lib/apiTypes';
import type { UpdateDocumentPayload } from '@/features/documents/hooks';

const DOCUMENT_TYPES: ApiDocumentType[] = ['Policy', 'Procedure', 'Standard', 'Work Instruction', 'Form'];
const DOCUMENT_DESTINATIONS: ApiDocumentDestination[] = ['Read Site', 'Drawing Register'];

interface EditDocumentModalProps {
  doc: ApiDocument;
  onClose: () => void;
  onSave: (payload: Omit<UpdateDocumentPayload, 'id'>) => void;
  isSubmitting?: boolean;
}

/**
 * Edit form for a Draft the current user owns — loads the document's
 * existing fields, lets the author change them, and optionally replace the
 * attached file. Saving never creates a new document: metadata goes through
 * PATCH /documents/:id, and a replacement file goes through the same
 * POST /documents/:id/versions endpoint every other upload uses (a new
 * version, never an overwrite). See useUpdateDocumentMutation.
 */
export function EditDocumentModal({ doc, onClose, onSave, isSubmitting }: EditDocumentModalProps) {
  const { data: departments = [] } = useDepartmentsQuery();
  const [title, setTitle] = useState(doc.title);
  const [department, setDepartment] = useState(refId(doc.department) ?? '');
  const [type, setType] = useState<ApiDocumentType>(doc.type);
  const [destination, setDestination] = useState<ApiDocumentDestination>(doc.destination);
  const [description, setDescription] = useState(doc.description ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState('');

  const canSubmit = title.trim() && department && type && destination;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSave({
      title: title.trim(),
      department,
      type,
      destination,
      description: description.trim(),
      file,
      changeNote: changeNote.trim() || undefined,
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
            <h3 className="text-sm font-bold text-white">Edit Document</h3>
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
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Document Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
              >
                <option value="">Select...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Document Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ApiDocumentType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Document Destination *</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value as ApiDocumentDestination)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            >
              {DOCUMENT_DESTINATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>

          {doc.currentVersion && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3.5 py-2.5 text-xs text-gray-600">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              Current file: v{doc.currentVersion.versionNumber} ({doc.currentVersion.file.format})
            </div>
          )}

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
              <Paperclip className="h-3.5 w-3.5" /> Replace File (optional)
            </label>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-3 py-3 text-xs text-gray-500 hover:border-brand-400 hover:bg-brand-50/40">
              {file ? file.name : 'Click to upload a new version'}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="mt-1 text-[11px] text-gray-400">
              Uploading here adds a new version — it never replaces or deletes the current one.
            </p>
          </div>

          {file && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">What changed? (optional)</label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="e.g. Updated section 3 per legal review"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
              />
            </div>
          )}

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
