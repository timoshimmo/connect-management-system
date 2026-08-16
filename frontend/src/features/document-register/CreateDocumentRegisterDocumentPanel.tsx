import { FormEvent, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import { useCreateDocumentMutation } from '@/features/documents/hooks';
import type { ApiDocumentType, ApiIsoStandard } from '@/lib/apiTypes';

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

/**
 * Document Controller-only: registers a new controlled document directly
 * onto the Document Register. Unlike the normal "New Document" flow, this
 * publishes immediately — no author/reviewer/approver workflow — since the
 * Controller is registering a document that's already controlled (Section 6
 * of the spec). Only reachable via the Controller's own sidebar entry;
 * the backend independently rejects this for any other role/destination
 * combination (see document.controller.js's `create` handler).
 */
export function CreateDocumentRegisterDocumentPanel() {
  const { data: departments = [] } = useDepartmentsQuery();
  const createDocument = useCreateDocumentMutation();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState<ApiDocumentType | ''>('');
  const [isoStandards, setIsoStandards] = useState<ApiIsoStandard[]>([]);
  const [isoClauses, setIsoClauses] = useState('');
  const [revision, setRevision] = useState('0');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const canSubmit = Boolean(title.trim() && department && type && file);

  function toggleIsoStandard(standard: ApiIsoStandard) {
    setIsoStandards((prev) =>
      prev.includes(standard) ? prev.filter((s) => s !== standard) : [...prev, standard]
    );
  }

  function resetForm() {
    setTitle('');
    setDepartment('');
    setType('');
    setIsoStandards([]);
    setIsoClauses('');
    setRevision('0');
    setDescription('');
    setFile(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !type) return;
    createDocument.mutate(
      {
        title: title.trim(),
        department,
        destination: 'Document Register',
        type,
        description: description.trim(),
        isoStandards,
        isoClauses: isoClauses.trim(),
        revision: revision.trim() || '0',
        file,
        status: 'Published',
      },
      { onSuccess: () => resetForm() }
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
      <h2 className="text-base font-semibold text-gray-900">Create Document Register Document</h2>
      <p className="mt-1 text-sm text-gray-500">
        Registers a controlled QHSE Management System document directly onto the Document Register. It
        publishes immediately and skips the normal draft/review/approval workflow.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 max-w-xl space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Document Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. QHSE Management System Manual"
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

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
            <Paperclip className="h-3.5 w-3.5" /> Attach Document File *
          </label>
          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-3 py-3 text-xs text-gray-500 hover:border-emerald-400 hover:bg-emerald-50/40">
            {file ? file.name : 'Click to upload or drag & drop'}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-1 text-[11px] text-gray-400">PDF or Word — max 25MB.</p>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={!canSubmit || createDocument.isPending}
            className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {createDocument.isPending ? 'Registering…' : 'Register Document'}
          </button>
        </div>
      </form>
    </div>
  );
}
