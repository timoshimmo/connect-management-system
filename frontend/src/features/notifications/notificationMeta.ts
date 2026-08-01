import {
  FileUp,
  ClipboardCheck,
  Clock,
  Undo2,
  CheckCircle2,
  XCircle,
  Globe,
  UserPlus,
  MessageSquare,
  Archive,
  ArchiveRestore,
  Bell,
  type LucideIcon,
} from 'lucide-react';

interface NotificationMeta {
  title: string;
  icon: LucideIcon;
  iconClasses: string;
}

/** Maps the backend's notification `type` values to a display title/icon. New types fall back gracefully. */
const NOTIFICATION_META: Record<string, NotificationMeta> = {
  document_submitted: { title: 'Document Submitted', icon: FileUp, iconClasses: 'bg-blue-50 text-blue-600' },
  review_assigned: { title: 'Review Assigned', icon: ClipboardCheck, iconClasses: 'bg-amber-50 text-amber-600' },
  approval_pending: { title: 'Awaiting Approval', icon: Clock, iconClasses: 'bg-amber-50 text-amber-600' },
  changes_requested: { title: 'Changes Requested', icon: Undo2, iconClasses: 'bg-orange-50 text-orange-600' },
  document_approved: { title: 'Document Approved', icon: CheckCircle2, iconClasses: 'bg-brand-50 text-brand-700' },
  document_rejected: { title: 'Document Rejected', icon: XCircle, iconClasses: 'bg-red-50 text-red-600' },
  document_published: { title: 'Document Published', icon: Globe, iconClasses: 'bg-brand-50 text-brand-700' },
  user_created: { title: 'New User Created', icon: UserPlus, iconClasses: 'bg-blue-50 text-blue-600' },
  drawing_register_user_created: { title: 'New Drawing Register User', icon: UserPlus, iconClasses: 'bg-blue-50 text-blue-600' },
  comment_added: { title: 'New Comment', icon: MessageSquare, iconClasses: 'bg-blue-50 text-blue-600' },
  document_archived: { title: 'Document Archived', icon: Archive, iconClasses: 'bg-gray-100 text-gray-600' },
  document_restored: { title: 'Document Restored', icon: ArchiveRestore, iconClasses: 'bg-brand-50 text-brand-700' },
};

const FALLBACK_META: NotificationMeta = { title: 'Notification', icon: Bell, iconClasses: 'bg-gray-100 text-gray-500' };

export function getNotificationMeta(type: string): NotificationMeta {
  return NOTIFICATION_META[type] ?? FALLBACK_META;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
