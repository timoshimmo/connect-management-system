import { FormEvent, useState } from 'react';
import { X, Paperclip, FileText } from 'lucide-react';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import { refId } from '@/lib/apiTypes';
import type { ApiDocument, ApiDocumentType, ApiIsoStandard } from '@/lib/apiTypes';
import type { UpdateDocumentPayload } from '@/features/documents/hooks';

const DOCUMENT_TYPES: ApiDocumentType[] = [
  'Manual',
  'Policy',
  'Procedure',
  'Standard',
  'Goal',
  'Org Chart',
  'Policy Change',
  'Functional Description',
  'Form',
];

const ISO_STANDARDS: ApiIsoStandard[] = ['ISO 9001 (Quality)', 'ISO 14001 (Environment)', 'ISO 45001 (OH&S)'];

interface EditDocumentRegisterModalProps {
  doc: ApiDocument;
  onClose: () => void;
  onSave: (payload: Omit<UpdateDocumentPayload, 'id'>) => void;
  isSubmitting?: boolean;
}

/**
 * Document Controller-only: edits an already-active (Published) Document
 * Register document. Mirrors ms-publishing/EditDocumentModal.tsx's modal
 * structure and reuses the same field set as CreateDocumentRegisterDocumentPanel
 * — the Reference (docId) is deliberately never an input here, only a
 * read-only display, since it's a controlled identifier and was never a
 * client-settable field even at creation. Metadata goes through the same
 * PATCH /documents/:id useUpdateDocumentMutation already uses; a replacement
 * file goes through the existing POST /documents/:id/versions endpoint
 * (a new version, never an overwrite).
 */
export function EditDocumentRegisterModal({ doc, onClose, onSave, isSubmitting }: EditDocumentRegisterModalProps) {
  const { data: departments = [] } = useDepartmentsQuery();

  const [title, setTitle] = useState(doc.title);
  const [department, setDepartment] = useState(refId(doc.department) ?? '');
  const [type, setType] = useState<ApiDocumentType | ''>(doc.type ?? '');
  const [isoStandards, setIsoStandards] = useState<ApiIsoStandard[]>(doc.isoStandards ?? []);
  const [isoClauses, setIsoClauses] = useState(doc.isoClauses ?? '');
  const [revision, setRevision] = useState(doc.revision ?? '0');
  const [description, setDescription] = useState(doc.description ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState('');

  const canSubmit = Boolean(title.trim() && department && type);

  function toggleIsoStandard(standard: ApiIsoStandard) {
    setIsoStandards((prev) => (prev.includes(standard) ? prev.filter((s) => s !== standard) : [...prev, standard]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !type) return;
    onSave({
      title: title.trim(),
      department,
      type,
      description: description.trim(),
      isoStandards,
      isoClauses: isoClauses.trim(),
      revision: revision.trim() || '0',
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
        <div className="flex items-start justify-between rounded-t-xl bg-emerald-950 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-white">Edit Document Register Document</h3>
            <p className="mt-0.5 text-xs text-emerald-100">Reference: {doc.docId}</p>
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
              >
                <option value="">Select...</option>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">ISO Standard(s)</label>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {ISO_STANDARDS.map((standard) => (
                <label key={standard} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isoStandards.includes(standard)}
                    onChange={() => toggleIsoStandard(standard)}
                    className="rounded border-gray-300 text-emerald-700 focus:ring-emerald-700/30"
                  />
                  {standard}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-gray-600">ISO Clause(s)</label>
              <input
                type="text"
                value={isoClauses}
                onChange={(e) => setIsoClauses(e.target.value)}
                placeholder="e.g. 4.1–4.2, 6.1.1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
              />
            </div>
            <div className="w-32">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Revision</label>
              <input
                type="text"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
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
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-3 py-3 text-xs text-gray-500 hover:border-emerald-400 hover:bg-emerald-50/40">
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
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
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
