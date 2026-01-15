/**
 * File Manager Types
 * Type definitions for multi-file support in hazo_pdf
 */

import type { PdfAnnotation } from '../../types';

/**
 * File item for the file manager
 * Represents a single file in the multi-file viewer
 */
export interface FileItem {
  /** Unique identifier for the file */
  id: string;
  /** Display name (filename) */
  name: string;
  /** URL or data URL for the file */
  url: string;
  /** File type category */
  type: 'pdf' | 'image' | 'text' | 'other';
  /** Original MIME type */
  mime_type?: string;
  /** File size in bytes */
  size?: number;
  /** Thumbnail URL (optional, for preview) */
  thumbnail_url?: string;
  /** Whether this file was converted to PDF from another format */
  is_converted?: boolean;
  /** Original file reference (for converted files) */
  original_file?: File;
  /** Annotations for this specific file */
  annotations?: PdfAnnotation[];
  /** Current status of the file (for upload/conversion tracking) */
  status?: 'ready' | 'converting' | 'uploading' | 'error';
}

/**
 * Upload progress information
 * Tracks the status of a file being uploaded/converted
 */
export interface UploadProgress {
  /** Unique identifier for the upload */
  file_id: string;
  /** Filename being uploaded */
  filename: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current status of the upload */
  status: 'pending' | 'uploading' | 'converting' | 'complete' | 'error';
  /** Error message if status is 'error' */
  error_message?: string;
}

/**
 * File upload callback result
 * Returned from the on_upload callback
 */
export interface UploadResult {
  /** Whether upload was successful */
  success: boolean;
  /** Resulting FileItem if successful */
  file?: FileItem;
  /** Error message if failed */
  error?: string;
}

/**
 * File manager display mode
 * Controls how the file manager is rendered
 */
export type FileManagerDisplayMode = 'embedded' | 'dialog' | 'standalone';

/**
 * Popout context for opening viewer in new tab
 * Serializable state that can be stored in sessionStorage
 */
export interface PopoutContext {
  /** Array of files to display */
  files: FileItem[];
  /** ID of the currently selected file */
  selected_file_id: string;
  /** Annotations organized by file ID */
  annotations_map: Record<string, PdfAnnotation[]>;
  /** Title for the popout window (displayed in document title) */
  viewer_title?: string;
}
