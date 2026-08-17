import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUpload, apiUploadWithProgress, apiDownload, ApiError } from '@/lib/apiClient';
import { useToast } from '@/features/toast';
import type {
  ApiDocumentRegisterBulkImportCommitResult,
  ApiDocumentRegisterBulkImportParseResult,
  ApiDocumentRegisterBulkImportRow,
} from '@/lib/apiTypes';

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

/**
 * Dedicated Document Register bulk-import hooks — line-for-line mirrors of
 * features/bulk-upload/hooks.ts, pointed at the separate
 * /documents/document-register-bulk-import/* endpoints. The generic
 * bulk-upload hooks are untouched and still work for Read Site/Drawing
 * Register (and ad-hoc Document Register rows) exactly as before.
 */
export function useDownloadDocumentRegisterTemplate() {
  const { showError } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  async function download() {
    setIsDownloading(true);
    try {
      const blob = await apiDownload('/documents/document-register-bulk-import/template');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document-register-bulk-upload-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showError('Couldn’t download the template', errorMessage(err, 'Please try again.'));
    } finally {
      setIsDownloading(false);
    }
  }

  return { download, isDownloading };
}

/** Uploads the filled-in Document Register Excel sheet and returns per-row validation results — no data is imported yet. */
export function useParseDocumentRegisterBulkImportMutation() {
  const { showError } = useToast();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.set('file', file);
      return apiUpload<ApiDocumentRegisterBulkImportParseResult>('/documents/document-register-bulk-import/parse', form);
    },
    onError: (err) => showError('Couldn’t read that spreadsheet', errorMessage(err, 'Check the file and try again.')),
  });
}

interface CommitArgs {
  rows: ApiDocumentRegisterBulkImportRow[];
  files: File[];
}

/** Imports the given Document Register rows + matching files — every valid row is published immediately. */
export function useCommitDocumentRegisterBulkImportMutation() {
  const queryClient = useQueryClient();
  const { showError } = useToast();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: ({ rows, files }: CommitArgs) => {
      setProgress(0);
      const form = new FormData();
      form.set('rows', JSON.stringify(rows.map((r) => ({ rowNumber: r.rowNumber, data: r.data }))));
      files.forEach((file) => form.append('files', file));
      return apiUploadWithProgress<ApiDocumentRegisterBulkImportCommitResult>(
        '/documents/document-register-bulk-import/commit',
        form,
        setProgress
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-register'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => showError('Import failed', errorMessage(err, 'Please try again.')),
  });

  return { ...mutation, progress };
}
