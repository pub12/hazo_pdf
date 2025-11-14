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
 * @returns Promise that resolves when the PDF is saved
 */
export async function save_annotations_to_pdf(
  pdf_url: string,
  annotations: PdfAnnotation[],
  _output_filename?: string, // Currently unused, kept for API compatibility
  config?: PdfViewerConfig | null
): Promise<Uint8Array> {
  try {
    // Dynamically import pdf-lib
    const { PDFDocument, rgb } = await import('pdf-lib');
    
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
      
      // Parse color (hex to RGB)
      let color = rgb(0, 0, 0); // Default black
      if (annotation.color) {
        const hex = annotation.color.replace('#', '');
        if (hex.length === 6) {
          const r = parseInt(hex.substring(0, 2), 16) / 255;
          const g = parseInt(hex.substring(2, 4), 16) / 255;
          const b = parseInt(hex.substring(4, 6), 16) / 255;
          color = rgb(r, g, b);
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
              const comment_color = annotation.color || square_config.square_border_color;
              const comment_hex = comment_color.replace('#', '');
              const comment_r = parseInt(comment_hex.substring(0, 2), 16) / 255;
              const comment_g = parseInt(comment_hex.substring(2, 4), 16) / 255;
              const comment_b = parseInt(comment_hex.substring(4, 6), 16) / 255;
              
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
            const highlight_color_hex = annotation.color || highlight_config.highlight_fill_color;
            const highlight_hex = highlight_color_hex.replace('#', '');
            const highlight_r = parseInt(highlight_hex.substring(0, 2), 16) / 255;
            const highlight_g = parseInt(highlight_hex.substring(2, 4), 16) / 255;
            const highlight_b = parseInt(highlight_hex.substring(4, 6), 16) / 255;
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
              const text_color_hex = annotation.color || 
                                    freetext_config.freetext_text_color || 
                                    fonts_config.font_foreground_color || 
                                    '#000000';
              const text_hex = text_color_hex.replace('#', '');
              const text_r = parseInt(text_hex.substring(0, 2), 16) / 255;
              const text_g = parseInt(text_hex.substring(2, 4), 16) / 255;
              const text_b = parseInt(text_hex.substring(4, 6), 16) / 255;
              
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
 */
export async function save_and_download_pdf(
  pdf_url: string,
  annotations: PdfAnnotation[],
  output_filename?: string,
  config?: PdfViewerConfig | null
): Promise<void> {
  const pdf_bytes = await save_annotations_to_pdf(pdf_url, annotations, output_filename, config);
  
  // Generate output filename
  const original_filename = pdf_url.split('/').pop() || 'document.pdf';
  const filename_without_ext = original_filename.replace(/\.pdf$/i, '');
  const final_filename = output_filename || `${filename_without_ext}_annotated.pdf`;
  
  // Download the modified PDF
  download_pdf(pdf_bytes, final_filename);
  console.log('[PDF Saver] PDF saved as:', final_filename);
}

