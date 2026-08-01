import type { ApiDocument } from '@/lib/apiTypes';

export function isDocumentOverdue(doc: ApiDocument): boolean {
  return doc.status === 'Published' && !!doc.nextReviewDate && new Date(doc.nextReviewDate) <= new Date();
}

export function isPublishedThisMonth(doc: ApiDocument): boolean {
  if (doc.status !== 'Published' || !doc.publishedAt) return false;
  const d = new Date(doc.publishedAt);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
