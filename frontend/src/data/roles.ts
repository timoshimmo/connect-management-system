import {
  LayoutDashboard,
  FileEdit,
  Clock,
  Undo2,
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  UserCog,
  Archive,
  Users,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { DEPARTMENTS, Department } from './seedDocuments';
import type { ApiRole } from '@/lib/apiTypes';

export type ViewKey =
  | 'dashboard'
  | 'drafts'
  | 'submitted'
  | 'returned'
  | 'assigned'
  | 'recent'
  | 'approvals'
  | 'due'
  | 'assignment'
  | 'publishing'
  | 'dept'
  | 'archive'
  | 'authors';

export type CountKey =
  | 'drafts'
  | 'submitted'
  | 'returned'
  | 'assigned'
  | 'pendingApproval'
  | 'due'
  | 'pendingAssignment'
  | 'pendingPublishing';

export interface SidebarItem {
  label: string;
  view?: ViewKey;
  dept?: Department;
  icon?: LucideIcon;
  countKey?: CountKey;
  chipType?: 'warn' | 'danger';
  /** When set, this entry renders as a section divider instead of a nav link. */
  divider?: string;
}

export interface RoleConfig {
  role: ApiRole;
  label: string;
  description: string;
  heroDescription: string;
  canCreate: boolean;
  /** Step highlighted in the 6-stage workflow bar (1-indexed). */
  wfStep: number;
  sidebar: SidebarItem[];
}

export const WORKFLOW_STEPS = [
  'Draft',
  'Pending Assignment',
  'Under Review',
  'Pending Approval',
  'Pending Publishing',
  'Published',
] as const;

export const ROLES: Record<ApiRole, RoleConfig> = {
  author: {
    role: 'author',
    label: 'Document Author',
    description:
      'You see only your own drafts and documents you have submitted. You cannot approve or see other users’ work.',
    heroDescription:
      'Create and manage your own documents. Track their progress through review and approval.',
    canCreate: true,
    wfStep: 1,
    sidebar: [
      { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
      { label: 'My Drafts', view: 'drafts', icon: FileEdit, countKey: 'drafts' },
      { label: 'Submitted for Review', view: 'submitted', icon: Clock, countKey: 'submitted' },
      { label: 'Returned to Me', view: 'returned', icon: Undo2, countKey: 'returned', chipType: 'warn' },
    ],
  },
  reviewer: {
    role: 'reviewer',
    label: 'Reviewer',
    description:
      'You see documents assigned to you for review. You can return them to the author or forward them to the pre-assigned approver.',
    heroDescription:
      'Review documents assigned to you. Return with comments or forward to the approver.',
    canCreate: false,
    wfStep: 3,
    sidebar: [
      { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
      { label: 'Assigned to Me', view: 'assigned', icon: CheckSquare, countKey: 'assigned', chipType: 'warn' },
      { label: 'Completed Reviews', view: 'recent', icon: CheckCircle2 },
    ],
  },
  approver: {
    role: 'approver',
    label: 'Approver',
    description:
      'You give sign-off on documents forwarded by a reviewer. Approval sends them to the Document Controller for final publishing.',
    heroDescription:
      'Give sign-off on reviewed documents. Approval forwards them to the Controller for publishing.',
    canCreate: false,
    wfStep: 4,
    sidebar: [
      { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
      { label: 'Awaiting My Approval', view: 'approvals', icon: CheckSquare, countKey: 'pendingApproval', chipType: 'warn' },
      { label: 'Recently Approved', view: 'recent', icon: CheckCircle2 },
      { label: 'Due for Review', view: 'due', icon: AlertTriangle, countKey: 'due', chipType: 'danger' },
    ],
  },
  controller: {
    role: 'controller',
    label: 'Document Controller',
    description:
      'Full access across all departments and all workflow stages. You assign reviewers/approvers, give final publishing sign-off, and manage the complete document lifecycle.',
    heroDescription:
      'Full visibility across all departments. Assign reviewers and approvers, publish approved documents, and manage the complete document lifecycle.',
    canCreate: true,
    wfStep: 6,
    sidebar: [
      { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
      { label: 'Pending Assignment', view: 'assignment', icon: UserCog, countKey: 'pendingAssignment', chipType: 'warn' },
      { label: 'Pending Publishing', view: 'publishing', icon: CheckSquare, countKey: 'pendingPublishing', chipType: 'warn' },
      { label: 'All Drafts', view: 'drafts', icon: FileEdit },
      { label: 'Due for Review', view: 'due', icon: AlertTriangle, countKey: 'due', chipType: 'danger' },
      { label: 'Recently Published', view: 'recent', icon: CheckCircle2 },
      { label: 'By Department', divider: 'By Department' },
      ...DEPARTMENTS.map((dept) => ({
        label: dept,
        view: 'dept' as ViewKey,
        dept,
        icon: Building2,
      })),
      { label: 'Admin', divider: 'Admin' },
      { label: 'Archive', view: 'archive', icon: Archive },
      { label: 'User Management', view: 'authors', icon: Users },
    ],
  },
};
