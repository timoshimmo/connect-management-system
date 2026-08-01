import type { PreviewableRecord, PreviewFileType, PreviewSource } from './types';

const SAMPLE_PDF_URL = '/samples/sample.pdf';
const SAMPLE_DOCX_URL = '/samples/sample.docx';

function fileTypeFromExtension(ext: string | undefined): PreviewFileType {
  const normalized = ext?.toLowerCase();
  if (normalized === 'pdf') return 'pdf';
  if (normalized === 'doc' || normalized === 'docx') return 'docx';
  return 'unsupported';
}

/**
 * Maps a document/drawing record to a previewable file source. Prefers a
 * real uploaded version (`fileUrl`/`fileFormat`, populated once a file has
 * actually been uploaded to Cloudinary); otherwise falls back to one of two
 * real sample files bundled under `public/samples` so the preview modal
 * still has something to show for the many demo records that don't have a
 * real upload yet (no Cloudinary credentials were configured for this
 * environment).
 */
export function resolvePreviewSource(record: PreviewableRecord): PreviewSource | null {
  if (record.fileUrl) {
    const fileType = fileTypeFromExtension(record.fileFormat ?? undefined);
    return {
      title: record.title,
      refId: record.id,
      url: record.fileUrl,
      fileName: `${record.id}.${record.fileFormat ?? 'pdf'}`,
      fileType,
    };
  }

  if (!record.attachedFileName) return null;
  const fileType = fileTypeFromExtension(record.attachedFileName.split('.').pop());
  const url = fileType === 'docx' ? SAMPLE_DOCX_URL : SAMPLE_PDF_URL;
  return {
    title: record.title,
    refId: record.id,
    url,
    fileName: record.attachedFileName,
    fileType,
  };
}
