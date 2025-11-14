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

