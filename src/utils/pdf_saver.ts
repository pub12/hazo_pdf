/**
 * PDF Saver Utility
 * Saves annotations directly into PDF documents using pdf-lib
 * This allows annotations to be embedded in the PDF file itself
 */

import type { PdfAnnotation, PdfViewerConfig } from '../types';
import { default_config } from '../config/default_config';

/**
 * Save annotations into a PDF document
 * This function fetches the PDF, adds annotations, and downloads the modified PDF
 * @param pdf_url - URL of the PDF file
 * @param annotations - Array of annotations to save
 * @param output_filename - Name for the saved PDF file (default: original filename with '_annotated' suffix)
 * @param config - Optional configuration for styling values
 * @param page_rotations - Optional map of page rotations (page_index -> degrees: 0, 90, 180, 270)
 * @returns Promise that resolves when the PDF is saved
 */
export async function save_annotations_to_pdf(
  pdf_url: string,
  annotations: PdfAnnotation[],
  _output_filename?: string, // Currently unused, kept for API compatibility
  config?: PdfViewerConfig | null,
  page_rotations?: Map<number, number>
): Promise<Uint8Array> {
  try {
    // Dynamically import pdf-lib
    const { PDFDocument, rgb, degrees } = await import('pdf-lib');
    
    // Fetch the original PDF
    console.log('[PDF Saver] Fetching PDF from:', pdf_url);
    const pdf_response = await fetch(pdf_url);
    if (!pdf_response.ok) {
      throw new Error(`Failed to fetch PDF: ${pdf_response.status} ${pdf_response.statusText}`);
    }
    
    const pdf_bytes = await pdf_response.arrayBuffer();
    console.log('[PDF Saver] PDF fetched, size:', pdf_bytes.byteLength, 'bytes');
    
    // Load the PDF document
    const pdf_doc = await PDFDocument.load(pdf_bytes);
    console.log('[PDF Saver] PDF loaded, pages:', pdf_doc.getPageCount());

    // Apply page rotations if provided
    if (page_rotations && page_rotations.size > 0) {
      console.log('[PDF Saver] Applying page rotations:', Object.fromEntries(page_rotations));
      const pages = pdf_doc.getPages();
      page_rotations.forEach((rotation, page_index) => {
        if (page_index >= 0 && page_index < pages.length && rotation !== 0) {
          const page = pages[page_index];
          // Get existing rotation and add our rotation to it
          const existing_rotation = page.getRotation().angle;
          const new_rotation = (existing_rotation + rotation) % 360;
          page.setRotation(degrees(new_rotation));
          console.log(`[PDF Saver] Page ${page_index}: rotation ${existing_rotation}° -> ${new_rotation}°`);
        }
      });
    }

    // Get config values or use defaults
    const fonts_config = config?.fonts || default_config.fonts;
    const highlight_config = config?.highlight_annotation || default_config.highlight_annotation;
    const square_config = config?.square_annotation || default_config.square_annotation;
    const freetext_config = config?.freetext_annotation || default_config.freetext_annotation;
    
    // Add annotations to each page
    for (const annotation of annotations) {
      if (annotation.page_index >= pdf_doc.getPageCount()) {
        console.warn(`[PDF Saver] Annotation ${annotation.id} references page ${annotation.page_index}, but PDF only has ${pdf_doc.getPageCount()} pages. Skipping.`);
        continue;
      }
      
      const page = pdf_doc.getPage(annotation.page_index);
      const [x1, y1, x2, y2] = annotation.rect;
      
      // PDF coordinate system: bottom-left is origin (pdfjs-dist)
      // pdf-lib uses bottom-left as origin too, so coordinates should be fine
      // But we need to ensure rect is normalized
      const rect_x = Math.min(x1, x2);
      const rect_y = Math.min(y1, y2);
      const rect_width = Math.abs(x2 - x1);
      const rect_height = Math.abs(y2 - y1);
      
      // Parse color (hex or rgb to RGB for pdf-lib)
      // Supports both hex (#RRGGBB) and rgb(r, g, b) formats
      let color = rgb(0, 0, 0); // Default black
      if (annotation.color) {
        const color_str = annotation.color.trim();
        
        // Handle rgb(r, g, b) format
        const rgb_pattern = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
        const rgb_match = color_str.match(rgb_pattern);
        if (rgb_match) {
          const r = parseInt(rgb_match[1], 10);
          const g = parseInt(rgb_match[2], 10);
          const b = parseInt(rgb_match[3], 10);
          // Validate RGB values (0-255) and convert to 0-1 range for pdf-lib
          if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
            color = rgb(r / 255, g / 255, b / 255);
          } else {
            console.warn(`[PDF Saver] Invalid RGB values for annotation ${annotation.id}: r=${r}, g=${g}, b=${b}`);
          }
        } else if (color_str.startsWith('#')) {
          // Handle hex format (#RRGGBB)
          const hex = color_str.slice(1).trim();
          if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            color = rgb(r, g, b);
          } else {
            console.warn(`[PDF Saver] Invalid hex color format for annotation ${annotation.id}: ${color_str}`);
          }
        } else {
          console.warn(`[PDF Saver] Unrecognized color format for annotation ${annotation.id}: ${color_str}`);
        }
      }
      
      // Create annotation based on type using pdf-lib's annotation methods
      try {
        switch (annotation.type) {
          case 'Square': {
            // Create a rectangle/square annotation
            page.drawRectangle({
              x: rect_x,
              y: rect_y,
              width: rect_width,
              height: rect_height,
              borderColor: color,
              borderWidth: 2,
              borderOpacity: 0.8,
            });
            
            // Add text comment if present
            if (annotation.contents) {
              const comment_color_str = (annotation.color || square_config.square_border_color).trim();
              let comment_r = 0, comment_g = 0, comment_b = 0;
              
              // Parse color (hex or rgb format)
              const rgb_pattern = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
              const rgb_match = comment_color_str.match(rgb_pattern);
              if (rgb_match) {
                comment_r = parseInt(rgb_match[1], 10) / 255;
                comment_g = parseInt(rgb_match[2], 10) / 255;
                comment_b = parseInt(rgb_match[3], 10) / 255;
              } else if (comment_color_str.startsWith('#')) {
                const hex = comment_color_str.slice(1).trim();
                if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
                  comment_r = parseInt(hex.substring(0, 2), 16) / 255;
                  comment_g = parseInt(hex.substring(2, 4), 16) / 255;
                  comment_b = parseInt(hex.substring(4, 6), 16) / 255;
                }
              }
              
              page.drawText(annotation.contents, {
                x: rect_x,
                y: rect_y + rect_height + 5,
                size: fonts_config.freetext_font_size_default,
                color: rgb(comment_r, comment_g, comment_b),
              });
            }
            break;
          }
          
          case 'Highlight': {
            // Create a highlight annotation (semi-transparent rectangle)
            const highlight_color_str = (annotation.color || highlight_config.highlight_fill_color).trim();
            let highlight_r = 255 / 255, highlight_g = 255 / 255, highlight_b = 0 / 255; // Default yellow
            
            // Parse color (hex or rgb format)
            const rgb_pattern = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
            const rgb_match = highlight_color_str.match(rgb_pattern);
            if (rgb_match) {
              highlight_r = parseInt(rgb_match[1], 10) / 255;
              highlight_g = parseInt(rgb_match[2], 10) / 255;
              highlight_b = parseInt(rgb_match[3], 10) / 255;
            } else if (highlight_color_str.startsWith('#')) {
              const hex = highlight_color_str.slice(1).trim();
              if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
                highlight_r = parseInt(hex.substring(0, 2), 16) / 255;
                highlight_g = parseInt(hex.substring(2, 4), 16) / 255;
                highlight_b = parseInt(hex.substring(4, 6), 16) / 255;
              }
            }
            const highlight_color = rgb(highlight_r, highlight_g, highlight_b);
            
            page.drawRectangle({
              x: rect_x,
              y: rect_y,
              width: rect_width,
              height: rect_height,
              color: highlight_color,
              opacity: highlight_config.highlight_fill_opacity,
            });
            
            // Add text comment if present
            if (annotation.contents) {
              page.drawText(annotation.contents, {
                x: rect_x,
                y: rect_y + rect_height + 5,
                size: fonts_config.freetext_font_size_default,
                color: rgb(0, 0, 0),
              });
            }
            break;
          }
          
          case 'FreeText': {
            // Create a free text annotation
            if (annotation.contents) {
              // Text color priority: annotation.color > freetext_text_color > font_foreground_color > default black
              const text_color_str = (annotation.color || 
                                    freetext_config.freetext_text_color || 
                                    fonts_config.font_foreground_color || 
                                    '#000000').trim();
              let text_r = 0, text_g = 0, text_b = 0;
              
              // Parse color (hex or rgb format)
              const rgb_pattern = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
              const rgb_match = text_color_str.match(rgb_pattern);
              if (rgb_match) {
                text_r = parseInt(rgb_match[1], 10) / 255;
                text_g = parseInt(rgb_match[2], 10) / 255;
                text_b = parseInt(rgb_match[3], 10) / 255;
              } else if (text_color_str.startsWith('#')) {
                const hex = text_color_str.slice(1).trim();
                if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
                  text_r = parseInt(hex.substring(0, 2), 16) / 255;
                  text_g = parseInt(hex.substring(2, 4), 16) / 255;
                  text_b = parseInt(hex.substring(4, 6), 16) / 255;
                }
              }
              
              page.drawText(annotation.contents, {
                x: rect_x,
                y: rect_y,
                size: fonts_config.freetext_font_size_default,
                color: rgb(text_r, text_g, text_b),
                maxWidth: rect_width,
              });
            }
            break;
          }
          
          default:
            console.warn(`[PDF Saver] Unsupported annotation type: ${annotation.type}`);
        }
      } catch (annotation_error) {
        console.error(`[PDF Saver] Error adding annotation ${annotation.id}:`, annotation_error);
        // Continue with other annotations
      }
    }
    
    // Save the PDF
    const modified_pdf_bytes = await pdf_doc.save();
    console.log('[PDF Saver] PDF modified, size:', modified_pdf_bytes.length, 'bytes');
    
    return modified_pdf_bytes;
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('pdf-lib')) {
      throw new Error('pdf-lib is required to save annotations to PDF. Please install it: npm install pdf-lib');
    }
    console.error('[PDF Saver] Error saving PDF:', error);
    throw error;
  }
}

/**
 * Download PDF bytes as a file
 * @param pdf_bytes - PDF file bytes
 * @param filename - Name for the downloaded file
 */
export function download_pdf(pdf_bytes: Uint8Array, filename: string): void {
  // Create a new ArrayBuffer view to ensure compatibility with Blob constructor
  // Uint8Array.buffer can be SharedArrayBuffer, which Blob doesn't accept directly
  const buffer = new Uint8Array(pdf_bytes).buffer;
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Save annotations to PDF and download
 * @param pdf_url - URL of the PDF file
 * @param annotations - Array of annotations to save
 * @param output_filename - Name for the saved PDF file (default: original filename with '_annotated' suffix)
 * @param config - Optional configuration for styling values
 * @param page_rotations - Optional map of page rotations (page_index -> degrees: 0, 90, 180, 270)
 */
export async function save_and_download_pdf(
  pdf_url: string,
  annotations: PdfAnnotation[],
  output_filename?: string,
  config?: PdfViewerConfig | null,
  page_rotations?: Map<number, number>
): Promise<void> {
  const pdf_bytes = await save_annotations_to_pdf(pdf_url, annotations, output_filename, config, page_rotations);
  
  // Generate output filename
  const original_filename = pdf_url.split('/').pop() || 'document.pdf';
  const filename_without_ext = original_filename.replace(/\.pdf$/i, '');
  const final_filename = output_filename || `${filename_without_ext}_annotated.pdf`;
  
  // Download the modified PDF
  download_pdf(pdf_bytes, final_filename);
  console.log('[PDF Saver] PDF saved as:', final_filename);
}

