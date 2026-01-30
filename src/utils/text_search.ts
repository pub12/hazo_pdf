/**
 * Text search utility for finding text in PDF documents
 * Extracted from test app to be reusable across the library
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Options for text search in PDF
 */
export interface TextSearchOptions {
  /** Page index to search (0-based) */
  page_index: number;

  /** Whether to normalize text by removing commas and spaces (default: true) */
  normalize?: boolean;

  /** Minimum length for partial matches (default: 3) */
  min_partial_match_length?: number;

  /** Horizontal padding around text (default: 2) */
  padding_x?: number;

  /** Vertical padding around text (default: 1) */
  padding_y?: number;

  /** Y-axis offset to adjust highlight position (default: -3) */
  y_offset?: number;
}

/**
 * Result of text search in PDF
 */
export interface TextSearchResult {
  /** X coordinate in PDF coordinate system */
  x: number;

  /** Y coordinate in PDF coordinate system */
  y: number;

  /** Width of the text box */
  width: number;

  /** Height of the text box */
  height: number;

  /** Type of match found */
  match_type: 'exact' | 'partial';

  /** The actual text that was matched */
  matched_text: string;
}

/**
 * Find text in a PDF document and return its position
 *
 * @param pdf - PDF document proxy from pdfjs
 * @param search_value - Text to search for
 * @param options - Search options
 * @returns Position and dimensions of the text, or null if not found
 */
export async function find_text_in_pdf(
  pdf: PDFDocumentProxy,
  search_value: string,
  options: TextSearchOptions
): Promise<TextSearchResult | null> {
  try {
    const {
      page_index,
      normalize = true,
      min_partial_match_length = 3,
      padding_x = 2,
      padding_y = 1,
      y_offset = -3,
    } = options;

    // Get page (pdfjs uses 1-based indexing)
    const page = await pdf.getPage(page_index + 1);
    const text_content = await page.getTextContent();

    // Normalize search value if enabled
    const normalized_search = normalize
      ? search_value.toString().replace(/[,\s]/g, '').toLowerCase()
      : search_value.toString().toLowerCase();

    // First pass: look for exact match
    for (const item of text_content.items) {
      if ('str' in item) {
        const text_item = item as { str: string; transform: number[]; width?: number; height?: number };
        const text = normalize
          ? text_item.str.replace(/[,\s]/g, '').toLowerCase()
          : text_item.str.toLowerCase();

        // Only match if this text item equals our search value
        if (text === normalized_search) {
          const result = extract_text_position(text_item, padding_x, padding_y, y_offset);
          return {
            ...result,
            match_type: 'exact',
            matched_text: text_item.str,
          };
        }
      }
    }

    // Second pass: look for partial match (text item contains search value)
    if (normalized_search.length >= min_partial_match_length) {
      for (const item of text_content.items) {
        if ('str' in item) {
          const text_item = item as { str: string; transform: number[]; width?: number; height?: number };
          const text = normalize
            ? text_item.str.replace(/[,\s]/g, '').toLowerCase()
            : text_item.str.toLowerCase();

          if (text.includes(normalized_search)) {
            const result = extract_text_position(text_item, padding_x, padding_y, y_offset);
            return {
              ...result,
              match_type: 'partial',
              matched_text: text_item.str,
            };
          }
        }
      }
    }

    return null;
  } catch (err) {
    throw new Error(`Text search failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Extract position and dimensions from a PDF text item
 * @private
 */
function extract_text_position(
  text_item: { str: string; transform: number[]; width?: number; height?: number },
  padding_x: number,
  padding_y: number,
  y_offset: number
): { x: number; y: number; width: number; height: number } {
  // Extract position from transform matrix [a, b, c, d, x, y]
  const x = text_item.transform[4];
  const y = text_item.transform[5];

  // Calculate dimensions
  const font_size = Math.abs(text_item.transform[0]) || 10;
  const base_width = text_item.width || (text_item.str.length * font_size * 0.55);
  const base_height = text_item.height || font_size;

  // Add padding for better visibility
  const width = base_width + (padding_x * 2);
  const height = base_height + (padding_y * 2);

  return {
    x: x - padding_x,
    y: y - padding_y + y_offset,
    width,
    height,
  };
}
