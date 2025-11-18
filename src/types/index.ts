/**
 * Type definitions for hazo_pdf package
 * Adheres to PDF annotation standard
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Export config types
export type * from './config';

/**
 * Props for the main PdfViewer component
 */
export interface PdfViewerProps {
  /** URL or path to the PDF file */
  url: string;
  
  /** Optional class name for styling */
  className?: string;
  
  /** Initial zoom level (default: 1.0) */
  scale?: number;
  
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
  
  /** Optional path to configuration INI file (e.g., "hazo_pdf_config.ini") */
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

