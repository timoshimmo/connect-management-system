import { FormEvent, useState } from 'react';
import { X, Paperclip } from 'lucide-react';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import { useDisciplinesQuery } from '@/features/disciplines/hooks';
import type { ApiDocumentDestination, ApiDocumentType } from '@/lib/apiTypes';

const DOCUMENT_TYPES: ApiDocumentType[] = ['Policy', 'Procedure', 'Standard', 'Work Instruction', 'Form'];
const DOCUMENT_DESTINATIONS: ApiDocumentDestination[] = ['Read Site', 'Drawing Register'];

interface NewDocumentModalProps {
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    department: string;
    destination: ApiDocumentDestination;
    type?: ApiDocumentType;
    description: string;
    drawingNumber?: string;
    discipline?: string;
    area?: string;
    revision?: string;
    file: File | null;
  }) => void;
  isSubmitting?: boolean;
}

/**
 * Create-document form. Per the Management System Guide correction, this
 * form does NOT collect a reviewer/approver — the Document Controller
 * assigns both after the draft is submitted. Destination is chosen first and
 * determines which metadata fields appear next and which storefront the
 * document appears on once published — Read Site (public) or Drawing
 * Register (its own separately-authenticated accounts). Both destinations
 * share the exact same approval/publishing workflow after this form.
 */
export function NewDocumentModal({ onClose, onCreate, isSubmitting }: NewDocumentModalProps) {
  const { data: departments = [] } = useDepartmentsQuery();
  const [destination, setDestination] = useState<ApiDocumentDestination | ''>('');
  const isDrawingRegister = destination === 'Drawing Register';
  const { data: disciplines = [] } = useDisciplinesQuery(isDrawingRegister);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState<ApiDocumentType | ''>('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Drawing Register-only fields
  const [drawingNumber, setDrawingNumber] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [area, setArea] = useState('');
  const [revision, setRevision] = useState('');

  const canSubmit = Boolean(
    title.trim() &&
      department &&
      destination &&
      (isDrawingRegister
        ? drawingNumber.trim() && discipline && revision.trim()
        : type)
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !department || !destination) return;
    onCreate({
      title: title.trim(),
      department,
      destination,
      description: description.trim(),
      file,
      ...(isDrawingRegister
        ? { drawingNumber: drawingNumber.trim(), discipline, area: area.trim(), revision: revision.trim() }
        : { type: type as ApiDocumentType }),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
        <div className="flex items-start justify-between rounded-t-xl bg-brand-800 px-5 py-4">
          <h3 className="text-sm font-bold text-white">Create New Document</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Document Destination *</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value as ApiDocumentDestination)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            >
              <option value="">Select...</option>
              {DOCUMENT_DESTINATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-400">
              Where this document appears once approved and published. Choose this first — the fields below adapt to
              it.
            </p>
          </div>

          {destination && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {isDrawingRegister ? 'Drawing Title *' : 'Document Title *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isDrawingRegister ? 'e.g. Piping & Instrumentation Diagram Rev A' : 'e.g. HSE Safety Procedure v1'}
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
                {isDrawingRegister ? (
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Discipline *</label>
                    <select
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                    >
                      <option value="">Select...</option>
                      {disciplines.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Document Type *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as ApiDocumentType)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                    >
                      <option value="">Select...</option>
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {isDrawingRegister && (
                <>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-semibold text-gray-600">Drawing Number *</label>
                      <input
                        type="text"
                        value={drawingNumber}
                        onChange={(e) => setDrawingNumber(e.target.value)}
                        placeholder="e.g. DWG-OPS-014"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-semibold text-gray-600">Revision *</label>
                      <input
                        type="text"
                        value={revision}
                        onChange={(e) => setRevision(e.target.value)}
                        placeholder="e.g. Rev A"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Area (optional)</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Mayo ABO"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                    />
                  </div>
                </>
              )}

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

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <Paperclip className="h-3.5 w-3.5" /> Attach {isDrawingRegister ? 'Drawing' : 'Document'} File
                  (optional)
                </label>
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-3 py-3 text-xs text-gray-500 hover:border-brand-400 hover:bg-brand-50/40">
                  {file ? file.name : 'Click to upload or drag & drop'}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <p className="mt-1 text-[11px] text-gray-400">
                  PDF or Word — max 25MB. You can also upload after creating the draft.
                </p>
              </div>
            </>
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
              {isSubmitting ? 'Creating…' : 'Create Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
