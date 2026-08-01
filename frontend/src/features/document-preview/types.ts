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
 * `fileUrl`/`fileFormat` (a real Cloudinary version) take priority when
 * present; `attachedFileName` alone falls back to the bundled demo sample so
 * the modal still works for records with no uploaded file yet.
 */
export interface PreviewableRecord {
  id: string;
  title: string;
  attachedFileName: string | null;
  fileUrl?: string | null;
  fileFormat?: string | null;
}
