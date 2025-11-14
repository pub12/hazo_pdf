/**
 * XFDF Generator Utility
 * Converts annotation and bookmark data to XFDF (XML Forms Data Format)
 * XFDF is the standard format for PDF annotations
 */

import type { PdfAnnotation, PdfBookmark } from '../types';

/**
 * Format date to PDF date format: D:YYYYMMDDhhmmss[Z+-hh'mm']
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
function format_pdf_date(date: Date | string): string {
  let date_obj: Date;
  
  if (typeof date === 'string') {
    // Try to parse the date string
    date_obj = new Date(date);
    // Validate the date - if invalid, use current date
    if (isNaN(date_obj.getTime())) {
      console.warn(`Invalid date string: ${date}. Using current date.`);
      date_obj = new Date();
    }
  } else {
    date_obj = date;
    // Validate the date - if invalid, use current date
    if (isNaN(date_obj.getTime())) {
      console.warn(`Invalid date object. Using current date.`);
      date_obj = new Date();
    }
  }
  
  const year = date_obj.getFullYear();
  const month = String(date_obj.getMonth() + 1).padStart(2, '0');
  const day = String(date_obj.getDate()).padStart(2, '0');
  const hours = String(date_obj.getHours()).padStart(2, '0');
  const minutes = String(date_obj.getMinutes()).padStart(2, '0');
  const seconds = String(date_obj.getSeconds()).padStart(2, '0');
  
  // Get timezone offset
  const offset_minutes = date_obj.getTimezoneOffset();
  const offset_hours = Math.abs(Math.floor(offset_minutes / 60));
  const offset_mins = Math.abs(offset_minutes % 60);
  const offset_sign = offset_minutes <= 0 ? '+' : '-';
  
  return `D:${year}${month}${day}${hours}${minutes}${seconds}${offset_sign}${String(offset_hours).padStart(2, '0')}'${String(offset_mins).padStart(2, '0')}'`;
}

/**
 * Escape XML special characters
 * @param text - Text to escape
 * @returns Escaped text
 */
function escape_xml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert annotation type to XFDF tag name
 * @param type - Annotation type
 * @returns XFDF tag name (lowercase)
 */
function annotation_type_to_tag(type: PdfAnnotation['type']): string {
  return type.toLowerCase();
}

/**
 * Generate XFDF XML from annotations and bookmarks
 * @param annotations - Array of annotations
 * @param bookmarks - Array of bookmarks (optional)
 * @param pdf_file_name - Name of the PDF file
 * @returns XFDF XML string
 */
export function generate_xfdf(
  annotations: PdfAnnotation[],
  bookmarks: PdfBookmark[] = [],
  pdf_file_name: string = 'document.pdf'
): string {
  // Start XML boilerplate
  let xfdf = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xfdf += `<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">\n`;
  xfdf += `  <f href="${escape_xml(pdf_file_name)}"/>\n`;

  // Add annotations
  if (annotations.length > 0) {
    xfdf += `  <annots>\n`;

    annotations.forEach((ann) => {
      // Format rectangle coordinates
      const rect_string = ann.rect.map((c) => c.toFixed(2)).join(', ');

      // Format date - ensure it's valid
      let date_string: string;
      try {
        date_string = format_pdf_date(ann.date);
      } catch (error) {
        console.warn(`Error formatting date for annotation ${ann.id}:`, error);
        // Fallback to current date
        date_string = format_pdf_date(new Date());
      }

      // Get tag name
      const tag_name = annotation_type_to_tag(ann.type);

      // Build annotation attributes
      const attributes: string[] = [];
      attributes.push(`subject="${escape_xml(ann.subject || ann.type)}"`);
      attributes.push(`page="${ann.page_index}"`);
      attributes.push(`rect="${rect_string}"`);
      attributes.push(`flags="print"`);
      attributes.push(`name="${escape_xml(ann.id)}"`);
      attributes.push(`title="${escape_xml(ann.author)}"`);
      attributes.push(`date="${date_string}"`);

      if (ann.color) {
        attributes.push(`color="${escape_xml(ann.color)}"`);
      }

      // Build annotation element
      xfdf += `    <${tag_name} ${attributes.join(' ')}>\n`;

      // Add contents if present
      if (ann.contents) {
        xfdf += `      <contents><![CDATA[${ann.contents}]]></contents>\n`;
      }

      // Close annotation tag
      xfdf += `    </${tag_name}>\n`;
    });

    xfdf += `  </annots>\n`;
  }

  // Add bookmarks
  if (bookmarks.length > 0) {
    xfdf += `  <bookmarks>\n`;

    bookmarks.forEach((bookmark) => {
      const attributes: string[] = [];
      attributes.push(`title="${escape_xml(bookmark.title)}"`);
      attributes.push(`action="${bookmark.action || 'GoTo'}"`);
      attributes.push(`page="${bookmark.page_index}"`);

      if (bookmark.y !== undefined) {
        attributes.push(`y="${bookmark.y}"`);
      }

      xfdf += `    <bookmark ${attributes.join(' ')} />\n`;
    });

    xfdf += `  </bookmarks>\n`;
  }

  // Close XFDF
  xfdf += `</xfdf>`;

  return xfdf;
}

/**
 * Download XFDF file
 * @param xfdf_content - XFDF XML content
 * @param file_name - Name for the downloaded file
 */
export function download_xfdf(xfdf_content: string, file_name: string = 'annotations.xfdf'): void {
  const blob = new Blob([xfdf_content], { type: 'application/vnd.adobe.xfdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file_name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download XFDF file
 * @param annotations - Array of annotations
 * @param bookmarks - Array of bookmarks (optional)
 * @param pdf_file_name - Name of the PDF file
 * @param file_name - Name for the downloaded file
 */
export function export_annotations_to_xfdf(
  annotations: PdfAnnotation[],
  bookmarks: PdfBookmark[] = [],
  pdf_file_name: string = 'document.pdf',
  file_name: string = 'annotations.xfdf'
): void {
  const xfdf_content = generate_xfdf(annotations, bookmarks, pdf_file_name);
  download_xfdf(xfdf_content, file_name);
}
