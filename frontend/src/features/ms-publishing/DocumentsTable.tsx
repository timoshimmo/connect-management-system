import { ReactNode } from 'react';
import type { ApiDocument } from '@/lib/apiTypes';
import { DataTable, DataTableColumn } from '@/components/documents';

export type DocumentColumn = DataTableColumn<ApiDocument>;

interface DocumentsTableProps {
  title: string;
  documents: ApiDocument[];
  columns: DocumentColumn[];
  renderActions?: (doc: ApiDocument) => ReactNode;
  onTitleClick?: (doc: ApiDocument) => void;
  headerAction?: ReactNode;
  banner?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

/**
 * Single reusable table for every MS Publishing view (drafts, assigned,
 * approvals, due, etc). Thin `ApiDocument`-typed wrapper around the shared
 * `DataTable`.
 */
export function DocumentsTable({ documents, ...rest }: DocumentsTableProps) {
  return <DataTable rows={documents} getRowKey={(doc) => doc._id} {...rest} />;
}
