/** Mirrors the backend's response shapes (management_app/backend). */

export type ApiRole = 'author' | 'reviewer' | 'approver' | 'controller';

export type ApiUserStatus = 'Active' | 'Inactive';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  status: ApiUserStatus;
  jobTitle: string;
  department: { id: string; name: string; code: string } | string | null;
  createdAt: string;
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

export type ApiDocumentType = 'Policy' | 'Procedure' | 'Standard' | 'Work Instruction' | 'Form';

export type ApiDocumentLocation = 'Onshore' | 'Offshore – Mayo ABO' | 'Both';

/** Where the document is published once approved — see document.model.js. */
export type ApiDocumentDestination = 'Read Site' | 'Drawing Register';

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
  revision: string;
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
