/**
 * Document type/status/department constants shared by the frontend and
 * matching the backend's enums 1:1 (management_app/backend/src/modules/documents/document.model.js).
 * The demo document records these constants used to seed now live in the
 * real backend (management_app/backend/src/database/seed.js) — this file
 * only keeps the literal types the UI still needs (sidebar generation, the
 * New Document form's Type select, etc).
 */
export type DocumentStatus =
  | 'Draft'
  | 'Pending Assignment'
  | 'Under Review'
  | 'Pending Approval'
  | 'Pending Publishing'
  | 'Published'
  | 'Archived';

export type DocumentType = 'Policy' | 'Procedure' | 'Standard' | 'Work Instruction' | 'Form';

export type DocumentLocation = 'Onshore' | 'Offshore – Mayo ABO' | 'Both';

export const DEPARTMENTS = [
  'Compliance',
  'Finance',
  'HR',
  'HSE',
  'IT',
  'Operations & Maintenance',
  'Supply Chain',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DEPARTMENT_CODES: Record<Department, string> = {
  Compliance: 'COM',
  Finance: 'FIN',
  HR: 'HR',
  HSE: 'HSE',
  IT: 'IT',
  'Operations & Maintenance': 'OPS',
  'Supply Chain': 'SC',
};
