export type PreviewFileType = 'pdf' | 'docx' | 'unsupported';

export interface PreviewSource {
  /** Doc/drawing title shown in the modal header. */
  title: string;
  /** Doc ID / Drawing ID shown as a subtitle. */
  refId: string;
  /** Absolute or root-relative URL the file can be fetched/downloaded from. */
  url: string;
  /** Suggested filename for the Download action. */
  fileName: string;
  fileType: PreviewFileType;
}

/**
 * Minimal shape any document/drawing record can satisfy to be previewed.
 * `fileUrl` must be a real uploaded version's URL — callers should not
 * invoke openPreview at all when a record has no file yet (see
 * DocumentRow.jsx, which disables its preview button in that case).
 */
export interface PreviewableRecord {
  id: string;
  title: string;
  fileUrl?: string | null;
  fileFormat?: string | null;
  /** The real uploaded filename (DocumentVersion.file.originalFilename) — used for the Download action instead of falling back to the raw id. */
  originalFilename?: string | null;
}
