/**
 * Type definitions for hazo_pdf package
 * Adheres to PDF annotation standard
 */

import type React from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { Logger } from '../utils/logger';
import type { TextSearchOptions } from '../utils/text_search';

// Re-export Logger type
export type { Logger };

// Export config types
export type * from './config';

// Import file manager types
import type { FileItem, UploadResult, FileManagerDisplayMode, PopoutContext } from '../components/file_manager/types';

// Re-export file manager types
export type { FileItem, UploadResult, FileManagerDisplayMode, PopoutContext };

// Export file access types for hazo_files integration
export type * from './file_access';

/**
 * Props for the main PdfViewer component
 */
export interface PdfViewerProps {
  /** URL or path to the PDF file (for single-file mode) */
  url?: string;
  
  /** Optional class name for styling */
  className?: string;
  
  /** Initial zoom level (default: 1.0) */
  scale?: number;

  /** Fit PDF to container width automatically (default: false) */
  /** When enabled, scale is calculated to fit PDF width to available container width */
  fit_to_width?: boolean;
  
  /** Callback when PDF is loaded */
  on_load?: (pdf: PDFDocumentProxy) => void;
  
  /** Callback when an error occurs */
  on_error?: (error: Error) => void;
  
  /** Existing annotations to display */
  annotations?: PdfAnnotation[];
  
  /** Callback when annotation is created */
  on_annotation_create?: (annotation: PdfAnnotation) => void;
  
  /** Callback when annotation is updated */
  on_annotation_update?: (annotation: PdfAnnotation) => void;
  
  /** Callback when annotation is deleted */
  on_annotation_delete?: (annotation_id: string) => void;
  
  /** Callback when PDF is saved with annotations */
  on_save?: (pdf_bytes: Uint8Array, filename: string) => void;
  
  /** Background color for areas outside PDF pages (default: dark grey) */
  background_color?: string;
  
  /** Optional path to configuration INI file (e.g., "config/hazo_pdf_config.ini") */
  config_file?: string;
  
  /** Whether to append timestamp to annotated text edits (default: false) */
  append_timestamp_to_text_edits?: boolean;
  
  /** Fixed text to add in square brackets before timestamp (default: empty) */
  /** If provided and timestamp is enabled, format will be: text\n[fixed_text] [timestamp] */
  annotation_text_suffix_fixed_text?: string;
  
  /** Custom stamps for right-click menu (JSON array string) */
  /** Each stamp has: name, text, order, time_stamp_suffix_enabled (default false), fixed_text_suffix_enabled (default false) */
  /** Example: '[{"name":"Verified","text":"XXX","order":1,"time_stamp_suffix_enabled":true,"fixed_text_suffix_enabled":true}]' */
  right_click_custom_stamps?: string;
  
  /** Whether to enable the sidepanel metadata display (default: false) */
  sidepanel_metadata_enabled?: boolean;
  
  /** Metadata input structure for sidepanel display */
  metadata_input?: MetadataInput;
  
  /** Callback when metadata is changed via editing */
  /** Returns both the updated row and the complete metadata structure */
  on_metadata_change?: (updatedRow: MetadataDataItem, allData: MetadataInput) => { updatedRow: MetadataDataItem; allData: MetadataInput };

  /** File metadata input - flexible JSON array with filename matching */
  file_metadata?: FileMetadataInput;

  /** Document data to display in file info sidepanel (e.g., doc_data from extraction) */
  doc_data?: Record<string, unknown>;

  /** Highlight fields info to display in file info sidepanel */
  /** Use the HighlightFieldInfo type: Array<{ field_name: string; value: string; page_index?: number }> */
  highlight_fields_info?: HighlightFieldInfo[];

  // --- Toolbar visibility props (override config file values) ---

  /** Whether to show the toolbar at all (default: true) */
  toolbar_enabled?: boolean;

  /** Whether to show zoom controls (default: true) */
  show_zoom_controls?: boolean;

  /** Whether to show square annotation button (default: true) */
  show_square_button?: boolean;

  /** Whether to show undo button (default: true) */
  show_undo_button?: boolean;

  /** Whether to show redo button (default: true) */
  show_redo_button?: boolean;

  /** Whether to show save button (default: true) */
  show_save_button?: boolean;

  /** Whether to show metadata panel button (default: true, only visible when sidepanel_metadata_enabled) */
  show_metadata_button?: boolean;

  /** Whether to show annotate (FreeText) button (default: true) */
  show_annotate_button?: boolean;

  /** Whether to show file info button (default: true) */
  show_file_info_button?: boolean;

  // --- Data Extraction props ---

  /** Whether to show the extract button (overrides config) */
  show_extract_button?: boolean;

  /** Prompt area for extraction (e.g., "document") */
  extract_prompt_area?: string;

  /** Prompt key for extraction (e.g., "initial_classification") */
  extract_prompt_key?: string;

  /** API endpoint for server-side extraction */
  extract_api_endpoint?: string;

  /** Storage type for hazo_files integration ('local' or 'google_drive', default: 'local') */
  extract_storage_type?: 'local' | 'google_drive';

  /** Callback when extraction completes (data + save to hazo_files) */
  on_extract_complete?: (data: Record<string, unknown>) => void;

  /** Callback when extraction fails */
  on_extract_error?: (error: Error) => void;

  /** Callback when close button is clicked (shows close button in toolbar when provided) */
  on_close?: () => void;

  // --- Auto-highlight props ---

  /** Enable auto-highlighting when highlight_fields_info is provided (default: true) */
  auto_highlight_enabled?: boolean;

  /** Highlight style options for auto-created highlights */
  auto_highlight_options?: HighlightOptions;

  /** Text search options for auto-highlighting */
  auto_highlight_search_options?: Partial<Omit<TextSearchOptions, 'page_index'>>;

  // --- Multi-file support props (mutually exclusive with url) ---

  /** Array of files for multi-file mode (mutually exclusive with url) */
  files?: FileItem[];

  /** Callback when a file is selected in multi-file mode */
  on_file_select?: (file: FileItem) => void;

  /** Callback when a file is deleted in multi-file mode */
  on_file_delete?: (file_id: string) => void;

  /** Callback for file upload (caller handles actual storage) */
  on_upload?: (file: File, converted_pdf?: Uint8Array) => Promise<UploadResult>;

  /** Callback when files array changes */
  on_files_change?: (files: FileItem[]) => void;

  /** File manager display mode (default: 'embedded') */
  file_manager_display_mode?: FileManagerDisplayMode;

  /** Enable popout to new tab feature (default: false) */
  enable_popout?: boolean;

  /** Route path for popout viewer (default: '/pdf-viewer') */
  popout_route?: string;

  /** Custom popout handler (overrides default sessionStorage behavior) */
  on_popout?: (context: PopoutContext) => void;

  /** Title for the viewer (shown in dialog mode or popout) */
  viewer_title?: string;

  /** Logger instance for logging (from hazo_logs or compatible) */
  logger?: Logger;

  // --- hazo_files integration props ---

  /** File access provider from hazo_files for loading/saving PDFs via remote storage */
  file_manager?: import('./file_access').FileAccessProvider;

  /** Remote path for saving PDF via hazo_files (used with file_manager) */
  save_path?: string;
}

/**
 * PDF Annotation interface matching PDF standard
 * Uses PDF coordinate space (rect as [x1, y1, x2, y2])
 */
export interface PdfAnnotation {
  /** Unique identifier for the annotation */
  id: string;
  
  /** Type of annotation following PDF standard */
  type: 'Highlight' | 'Square' | 'FreeText' | 'CustomBookmark';
  
  /** Zero-based page index */
  page_index: number;
  
  /** Rectangle coordinates in PDF space [x1, y1, x2, y2] */
  rect: [number, number, number, number];
  
  /** Author of the annotation */
  author: string;
  
  /** Creation/modification date in ISO format */
  date: string;
  
  /** Text content or comment */
  contents: string;
  
  /** Color in hex format (e.g., "#FF0000") */
  color?: string;
  
  /** Subject/title of the annotation */
  subject?: string;
  
  /** Flags for annotation behavior */
  flags?: string;
}

/**
 * PDF Bookmark/Outline interface
 */
export interface PdfBookmark {
  /** Unique identifier */
  id: string;
  
  /** Title of the bookmark */
  title: string;
  
  /** Page index this bookmark points to */
  page_index: number;
  
  /** Y coordinate on the page */
  y?: number;
  
  /** Action type */
  action?: string;
}

/**
 * Custom stamp configuration for right-click menu
 */
export interface CustomStamp {
  /** Name of the stamp (displayed as menu item) */
  name: string;
  
  /** Text content to add to PDF */
  text: string;
  
  /** Order/position in menu (lower numbers appear first) */
  order: number;
  
  /** Whether to append timestamp suffix (default: false) */
  time_stamp_suffix_enabled?: boolean;
  
  /** Whether to append fixed text suffix (default: false) */
  fixed_text_suffix_enabled?: boolean;
  
  /** Background color for the annotation box (hex format: #RRGGBB or rgb(r, g, b), empty string for transparent) */
  background_color?: string;
  
  /** Border size/width in pixels (0 means no border, default: uses config default) */
  border_size?: number;
  
  /** Font color for the text (hex format: #RRGGBB or rgb(r, g, b), default: uses config default) */
  font_color?: string;
  
  /** Font weight (normal, bold, etc., default: uses config default) */
  font_weight?: string;
  
  /** Font style (normal, italic, etc., default: uses config default) */
  font_style?: string;
  
  /** Font size in pixels (default: uses config default) */
  font_size?: number;
  
  /** Font family/name (e.g., "Arial, sans-serif", default: uses config default) */
  font_name?: string;
}

/**
 * Coordinate mapping utilities
 * Converts between PDF space and Screen space
 */
export interface CoordinateMapper {
  /** Convert screen coordinates to PDF coordinates */
  to_pdf: (x_screen: number, y_screen: number) => [number, number];
  
  /** Convert PDF coordinates to screen coordinates */
  to_screen: (x_pdf: number, y_pdf: number) => [number, number];
}

/**
 * Page dimensions in screen space
 */
export interface PageDimensions {
  width: number;
  height: number;
}

/**
 * PDF Document Proxy type
 */
export type PdfDocument = PDFDocumentProxy;

/**
 * PDF Page Proxy type
 */
export type PdfPage = PDFPageProxy;

/**
 * Metadata format types for sidepanel display
 */
export type MetadataFormatType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'body';

/**
 * Metadata header item
 */
export interface MetadataHeaderItem {
  /** Format style for the header text */
  style: MetadataFormatType;
  /** Label text to display */
  label: string;
}

/**
 * Metadata data item
 */
export interface MetadataDataItem {
  /** Label/title for the data item (used as accordion title) */
  label: string;
  /** Format style for the label text */
  style: MetadataFormatType;
  /** Value to display */
  value: string;
  /** Whether this field is editable */
  editable: boolean;
}

/**
 * Metadata footer item
 */
export interface MetadataFooterItem {
  /** Format style for the footer text */
  style: MetadataFormatType;
  /** Label text to display */
  label: string;
}

/**
 * Metadata input structure for sidepanel
 */
export interface MetadataInput {
  /** Array of header items */
  header: MetadataHeaderItem[];
  /** Array of data items (rendered as accordions) */
  data: MetadataDataItem[];
  /** Array of footer items */
  footer: MetadataFooterItem[];
}

/**
 * File metadata item for flexible metadata sidepanel
 * Associates metadata with a specific file by filename
 */
export interface FileMetadataItem {
  /** Filename to match against current file */
  filename: string;
  /** Flexible metadata structure with string fields and table arrays */
  file_data: Record<string, string | Array<Record<string, string>>>;
}

/**
 * Array of file metadata items
 * Used as input for the file metadata sidepanel
 */
export type FileMetadataInput = FileMetadataItem[];

/**
 * Highlight field information for displaying in sidepanel and auto-highlighting
 */
export interface HighlightFieldInfo {
  /** Field name (will be auto-formatted to Title Case in display) */
  field_name: string;
  /** Extracted value to display and search for */
  value: string;
  /** Page index where the field is located (0-based, default: 0) */
  page_index?: number;
}

/**
 * Options for programmatic highlight creation via PdfViewerRef
 */
export interface HighlightOptions {
  /** Border color in hex format (default: from config highlight_border_color) */
  border_color?: string;
  /** Background/fill color in hex format (default: from config highlight_fill_color) */
  background_color?: string;
  /** Background opacity 0-1 (default: from config highlight_fill_opacity) */
  background_opacity?: number;
  /** Border width in pixels (default: 2) */
  border_width?: number;
}

/**
 * Props for PdfViewerDialog component
 * Extends PdfViewerProps with dialog-specific props
 */
export interface PdfViewerDialogProps extends Omit<PdfViewerProps, 'on_close'> {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when open state should change (close requested) */
  on_open_change: (open: boolean) => void;

  /** Dialog width (default: "90vw") */
  dialog_width?: string;

  /** Dialog height (default: "90vh") */
  dialog_height?: string;

  /** Whether clicking the backdrop closes the dialog (default: true) */
  close_on_backdrop_click?: boolean;

  /** Whether pressing Escape closes the dialog (default: true) */
  close_on_escape?: boolean;

  /** Loading fallback content (default: "Loading PDF viewer...") */
  loading_fallback?: React.ReactNode;

  /** Additional class names for the dialog container */
  dialog_class_name?: string;

  /** Additional class names for the backdrop overlay */
  backdrop_class_name?: string;
}

/**
 * Ref interface for programmatic PDF viewer control
 * Use with useRef<PdfViewerRef>() to get access to imperative methods
 */
export interface PdfViewerRef {
  /**
   * Create a highlight on a specific page region
   * @param page_index - Zero-based page index
   * @param rect - Rectangle coordinates in PDF space [x1, y1, x2, y2]
   * @param options - Optional styling overrides (border_color, background_color, background_opacity)
   * @returns The highlight annotation ID
   */
  highlight_region: (
    page_index: number,
    rect: [number, number, number, number],
    options?: HighlightOptions
  ) => string;

  /**
   * Remove a specific highlight by ID
   * @param id - The highlight annotation ID returned from highlight_region
   * @returns true if highlight was found and removed, false otherwise
   */
  remove_highlight: (id: string) => boolean;

  /**
   * Remove all highlights created via the highlight_region API
   * Does not affect user-created annotations
   */
  clear_all_highlights: () => void;
}

