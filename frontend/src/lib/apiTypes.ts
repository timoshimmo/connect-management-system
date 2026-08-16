/** Mirrors the backend's response shapes (management_app/backend). */

export type ApiRole = 'author' | 'reviewer' | 'approver' | 'controller';

export type ApiUserStatus = 'Active' | 'Inactive';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  /** Null for a first-time Microsoft SSO signup awaiting a Controller to assign one — see MSPublishingPage.tsx. */
  role: ApiRole | null;
  status: ApiUserStatus;
  jobTitle: string;
  department: { id: string; name: string; code: string } | string | null;
  createdAt: string;
  /** Whether this account can sign in with email+password (may be false for an SSO-only account). */
  hasPassword: boolean;
  /** Whether a Microsoft account is linked — see the Authentication section on the Profile page. */
  microsoftLinked: boolean;
}

export interface ApiUserRef {
  _id: string;
  name: string;
  email: string;
  role: ApiRole;
}

/**
 * Drawing Register viewer accounts — a completely separate account system
 * from ApiUser above (no role, no department, no workflow capabilities).
 * See lib/drawingRegisterApiClient.ts and features/drawing-register-auth.
 */
export interface ApiDrawingRegisterUser {
  id: string;
  name: string;
  email: string;
  status: ApiUserStatus;
  jobTitle: string;
  createdAt: string;
}

export type ApiEntityStatus = 'Active' | 'Inactive';

export interface ApiDepartment {
  id: string;
  name: string;
  code: string;
  status: ApiEntityStatus;
  publishedDocumentCount: number;
}

export interface ApiDepartmentRef {
  _id: string;
  name: string;
  code: string;
}

/** Drawing Register-only — never hardcoded on the frontend, always fetched from the Discipline collection. */
export interface ApiDiscipline {
  id: string;
  name: string;
  status: ApiEntityStatus;
}

export interface ApiDisciplineRef {
  _id: string;
  name: string;
}

export interface ApiVersion {
  _id: string;
  versionNumber?: string;
  revision?: string;
  file: { originalFilename: string; size: number; mimeType: string; format: string; url: string };
  uploadedBy: ApiUserRef | string;
  uploadedAt: string;
  changeNote: string;
}

export type ApiDocumentStatus =
  | 'Draft'
  | 'Pending Assignment'
  | 'Under Review'
  | 'Pending Approval'
  | 'Pending Publishing'
  | 'Published'
  | 'Archived';

export type ApiDocumentType =
  | 'Manual'
  | 'Policy'
  | 'Procedure'
  | 'Standard'
  | 'Goal'
  | 'Org Chart'
  | 'Policy Change'
  | 'Functional Description'
  | 'Form';

export type ApiDocumentLocation = 'Onshore' | 'Offshore – Mayo ABO' | 'Both';

/** Where the document is published once approved — see document.model.js. */
export type ApiDocumentDestination = 'Read Site' | 'Drawing Register' | 'Document Register';

/** ISO standards a Document Register document can be tagged against — see document.model.js's ISO_STANDARDS. */
export type ApiIsoStandard = 'ISO 9001 (Quality)' | 'ISO 14001 (Environment)' | 'ISO 45001 (OH&S)';

export interface ApiDocument {
  _id: string;
  docId: string;
  title: string;
  department: ApiDepartmentRef | string;
  /** Only required for Read Site documents — Drawing Register documents don't set this. */
  type: ApiDocumentType | null;
  status: ApiDocumentStatus;
  currentVersion: ApiVersion | null;
  author: ApiUserRef | string;
  reviewer: ApiUserRef | string | null;
  approver: ApiUserRef | string | null;
  description: string;
  location: ApiDocumentLocation;
  destination: ApiDocumentDestination;
  /** Drawing Register-only metadata — empty/null for Read Site documents. */
  drawingNumber: string;
  discipline: ApiDisciplineRef | string | null;
  area: string;
  /** Drawing Register: freeform revision string. Document Register: same field, e.g. "0", "Rev A". */
  revision: string;
  /** Document Register-only metadata — empty for Read Site/Drawing Register documents. */
  isoStandards: ApiIsoStandard[];
  isoClauses: string;
  notes: string;
  returned: boolean;
  publishedAt: string | null;
  nextReviewDate: string | null;
  archivedBy: ApiUserRef | string | null;
  archivedAt: string | null;
  archiveReason: string;
  createdAt: string;
  updatedAt: string;
}

/** Row shape shared by /documents/bulk-import/parse and /commit — see backend/src/modules/documents/bulkImport.service.js. */
export interface ApiBulkImportRowData {
  documentId: string;
  destination: ApiDocumentDestination | '';
  department: string;
  title: string;
  description: string;
  fileName: string;
  authorName: string;
  version: string;
  category: ApiDocumentType | '';
  drawingNumber: string;
  discipline: string;
  area: string;
  revision: string;
}

export interface ApiBulkImportRow {
  rowNumber: number;
  data: ApiBulkImportRowData;
  status: 'valid' | 'invalid';
  errors: string[];
}

export interface ApiBulkImportParseResult {
  rows: ApiBulkImportRow[];
  summary: { total: number; valid: number; invalid: number };
}

export interface ApiBulkImportResultRow {
  row: number;
  status: 'succeeded' | 'failed' | 'skipped';
  docId?: string;
  error?: string;
}

export interface ApiBulkImportCommitResult {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: ApiBulkImportResultRow[];
}

/** GET /document-register/types — live counts for the Document Type filter sidebar. */
export interface ApiDocumentRegisterTypeCount {
  type: ApiDocumentType;
  count: number;
}

/** GET /document-register/iso-standards — live counts for the ISO Standard filter sidebar. */
export interface ApiDocumentRegisterIsoCount {
  standard: ApiIsoStandard;
  count: number;
}

export interface ApiComment {
  _id: string;
  targetType: 'document';
  targetId: string;
  author: ApiUserRef | string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNotification {
  _id: string;
  user: string;
  type: string;
  message: string;
  read: boolean;
  relatedDocument: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function refName(ref: { name: string } | string | null | undefined): string {
  if (!ref) return '—';
  return typeof ref === 'string' ? ref : ref.name;
}

export function refId(ref: { _id: string } | string | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref._id;
}
