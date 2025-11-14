/**
 * Coordinate Mapper Utilities
 * Handles conversion between PDF coordinate space and Screen coordinate space
 * PDF coordinates use bottom-left origin, Screen coordinates use top-left origin
 */

import type { PDFPageProxy } from 'pdfjs-dist';
import type { CoordinateMapper } from '../types';

/**
 * Create a coordinate mapper for a specific page and scale
 * @param page - PDF page proxy
 * @param scale - Zoom/scale factor
 * @returns CoordinateMapper with to_pdf and to_screen methods
 */
export function create_coordinate_mapper(
  page: PDFPageProxy,
  scale: number
): CoordinateMapper {
  const viewport = page.getViewport({ scale });

  return {
    /**
     * Convert screen (CSS pixel) coordinates to PDF (abstract) coordinates
     * @param x_screen - X coordinate in screen space
     * @param y_screen - Y coordinate in screen space
     * @returns [x_pdf, y_pdf] coordinates in PDF space
     */
    to_pdf: (x_screen: number, y_screen: number): [number, number] => {
      // PDF.js viewport handles the coordinate transformation
      // including the origin conversion (top-left vs bottom-left)
      const result = viewport.convertToPdfPoint(x_screen, y_screen);
      return [result[0], result[1]];
    },

    /**
     * Convert PDF (abstract) coordinates to Screen (CSS pixel) coordinates
     * @param x_pdf - X coordinate in PDF space
     * @param y_pdf - Y coordinate in PDF space
     * @returns [x_screen, y_screen] coordinates in screen space
     */
    to_screen: (x_pdf: number, y_pdf: number): [number, number] => {
      const result = viewport.convertToViewportPoint(x_pdf, y_pdf);
      return [result[0], result[1]];
    },
  };
}

/**
 * Get viewport dimensions for a page at a specific scale
 * @param page - PDF page proxy
 * @param scale - Zoom/scale factor
 * @returns Object with width and height in screen pixels
 */
export function get_viewport_dimensions(
  page: PDFPageProxy,
  scale: number
): { width: number; height: number } {
  const viewport = page.getViewport({ scale });
  return {
    width: viewport.width,
    height: viewport.height,
  };
}

