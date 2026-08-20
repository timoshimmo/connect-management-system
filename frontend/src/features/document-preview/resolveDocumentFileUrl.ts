import type { PreviewableRecord, PreviewFileType, PreviewSource } from './types';

function fileTypeFromExtension(ext: string | undefined): PreviewFileType {
  const normalized = ext?.toLowerCase();
  if (normalized === 'pdf') return 'pdf';
  if (normalized === 'doc' || normalized === 'docx') return 'docx';
  return 'unsupported';
}

/**
 * Maps a document/drawing record to a previewable file source. Returns
 * `null` when the record has no real uploaded file yet — callers must not
 * invoke openPreview in that case (see DocumentRow.jsx, which disables its
 * preview button instead).
 */
export function resolvePreviewSource(record: PreviewableRecord): PreviewSource | null {
  if (!record.fileUrl) return null;
  const fileType = fileTypeFromExtension(record.fileFormat ?? undefined);
  return {
    title: record.title,
    refId: record.id,
    url: record.fileUrl,
    fileName: record.originalFilename || `${record.id}.${record.fileFormat ?? 'pdf'}`,
    fileType,
  };
}
