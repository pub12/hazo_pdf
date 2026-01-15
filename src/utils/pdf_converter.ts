/**
 * PDF Converter Utility
 * Converts images and text files to PDF using pdf-lib
 * This module is standalone and can be tested independently
 */

// =============================================================================
// Types
// =============================================================================

export type SupportedImageType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

export type SupportedTextType =
  | 'text/plain'
  | 'text/markdown'
  | 'text/csv';

export type SupportedExcelType =
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  | 'application/vnd.ms-excel' // .xls
  | 'application/vnd.google-apps.spreadsheet'; // Google Sheets (when exported)

export type SupportedConversionType = SupportedImageType | SupportedTextType | SupportedExcelType;

export interface PdfConversionOptions {
  /** Page size: 'letter' (612x792), 'a4' (595x842), 'legal' (612x1008) */
  page_size?: 'letter' | 'a4' | 'legal';
  /** Image quality 0.0-1.0 for lossy compression (default: 0.85) */
  image_quality?: number;
  /** How image fits on page: 'fit' (preserve aspect), 'fill' (crop), 'stretch' */
  image_fit?: 'fit' | 'fill' | 'stretch';
  /** Margin in points (72 points = 1 inch, default: 36) */
  margin?: number;
  /** Font size for text files in points (default: 12) */
  font_size?: number;
  /** Line height multiplier for text files (default: 1.4) */
  line_height?: number;
}

export interface ConversionResult {
  /** Whether conversion succeeded */
  success: boolean;
  /** Converted PDF as Uint8Array (if success) */
  pdf_bytes?: Uint8Array;
  /** Original filename without extension */
  original_name?: string;
  /** Generated PDF filename */
  pdf_filename?: string;
  /** Original file type that was converted */
  source_type?: 'image' | 'text' | 'excel';
  /** Number of pages in the resulting PDF */
  page_count?: number;
  /** Error message (if !success) */
  error?: string;
}

// =============================================================================
// Constants
// =============================================================================

const PAGE_SIZES = {
  letter: { width: 612, height: 792 },
  a4: { width: 595, height: 842 },
  legal: { width: 612, height: 1008 },
} as const;

const SUPPORTED_IMAGE_TYPES: SupportedImageType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const SUPPORTED_TEXT_TYPES: SupportedTextType[] = [
  'text/plain',
  'text/markdown',
  'text/csv',
];

const SUPPORTED_EXCEL_TYPES: SupportedExcelType[] = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.google-apps.spreadsheet',
];

const DEFAULT_OPTIONS: Required<PdfConversionOptions> = {
  page_size: 'letter',
  image_quality: 0.85,
  image_fit: 'fit',
  margin: 36,
  font_size: 12,
  line_height: 1.4,
};

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if a MIME type can be converted to PDF
 * @param mime_type - MIME type to check
 * @returns true if the type is supported for conversion
 */
export function can_convert_to_pdf(mime_type: string): boolean {
  const normalized = mime_type.toLowerCase().trim();
  return (
    SUPPORTED_IMAGE_TYPES.includes(normalized as SupportedImageType) ||
    SUPPORTED_TEXT_TYPES.includes(normalized as SupportedTextType) ||
    SUPPORTED_EXCEL_TYPES.includes(normalized as SupportedExcelType)
  );
}

/**
 * Get list of supported MIME types for conversion
 * @returns Array of supported MIME types
 */
export function get_supported_types(): string[] {
  return [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_TEXT_TYPES, ...SUPPORTED_EXCEL_TYPES];
}

/**
 * Check if a MIME type is an image type
 * @param mime_type - MIME type to check
 * @returns true if the type is a supported image type
 */
export function is_image_type(mime_type: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mime_type.toLowerCase().trim() as SupportedImageType);
}

/**
 * Check if a MIME type is a text type
 * @param mime_type - MIME type to check
 * @returns true if the type is a supported text type
 */
export function is_text_type(mime_type: string): boolean {
  return SUPPORTED_TEXT_TYPES.includes(mime_type.toLowerCase().trim() as SupportedTextType);
}

/**
 * Check if a MIME type is an Excel/spreadsheet type
 * @param mime_type - MIME type to check
 * @returns true if the type is a supported Excel type
 */
export function is_excel_type(mime_type: string): boolean {
  return SUPPORTED_EXCEL_TYPES.includes(mime_type.toLowerCase().trim() as SupportedExcelType);
}

/**
 * Convert a file to PDF
 * @param file - File or Blob to convert
 * @param filename - Original filename (used for output naming)
 * @param options - Conversion options
 * @returns Promise resolving to ConversionResult
 */
export async function convert_to_pdf(
  file: File | Blob,
  filename: string,
  options?: PdfConversionOptions
): Promise<ConversionResult> {
  const mime_type = file.type.toLowerCase().trim();

  if (!can_convert_to_pdf(mime_type)) {
    return {
      success: false,
      error: `Unsupported file type: ${mime_type}. Supported types: ${get_supported_types().join(', ')}`,
    };
  }

  try {
    if (is_image_type(mime_type)) {
      const image_bytes = new Uint8Array(await file.arrayBuffer());
      return await convert_image_to_pdf(
        image_bytes,
        mime_type as SupportedImageType,
        filename,
        options
      );
    }

    if (is_text_type(mime_type)) {
      const text_content = await file.text();
      return await convert_text_to_pdf(text_content, filename, options);
    }

    if (is_excel_type(mime_type)) {
      const excel_bytes = new Uint8Array(await file.arrayBuffer());
      return await convert_excel_to_pdf(excel_bytes, filename, options);
    }

    return {
      success: false,
      error: `Conversion not implemented for type: ${mime_type}`,
    };
  } catch (error) {
    console.error('[PDF Converter] Error converting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during conversion',
    };
  }
}

/**
 * Convert image bytes to PDF
 * @param image_bytes - Raw image data as Uint8Array
 * @param mime_type - Image MIME type
 * @param filename - Original filename
 * @param options - Conversion options
 * @returns Promise resolving to ConversionResult
 */
export async function convert_image_to_pdf(
  image_bytes: Uint8Array,
  mime_type: SupportedImageType,
  filename: string,
  options?: PdfConversionOptions
): Promise<ConversionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const page_size = PAGE_SIZES[opts.page_size];

  try {
    // Dynamically import pdf-lib
    const { PDFDocument } = await import('pdf-lib');

    console.log('[PDF Converter] Converting image to PDF:', filename, mime_type);

    // Create a new PDF document
    const pdf_doc = await PDFDocument.create();

    // Embed the image based on type
    let embedded_image;

    if (mime_type === 'image/jpeg') {
      embedded_image = await pdf_doc.embedJpg(image_bytes);
    } else if (mime_type === 'image/png') {
      embedded_image = await pdf_doc.embedPng(image_bytes);
    } else if (mime_type === 'image/gif' || mime_type === 'image/webp') {
      // GIF and WebP need to be converted to PNG first via canvas
      const png_bytes = await convert_image_via_canvas(image_bytes, mime_type);
      embedded_image = await pdf_doc.embedPng(png_bytes);
    } else {
      return {
        success: false,
        error: `Unsupported image type: ${mime_type}`,
      };
    }

    // Calculate image dimensions to fit on page
    const { width: img_width, height: img_height } = embedded_image;
    const available_width = page_size.width - (opts.margin * 2);
    const available_height = page_size.height - (opts.margin * 2);

    let draw_width: number;
    let draw_height: number;

    if (opts.image_fit === 'stretch') {
      // Stretch to fill available area
      draw_width = available_width;
      draw_height = available_height;
    } else if (opts.image_fit === 'fill') {
      // Fill available area (may crop)
      const scale = Math.max(
        available_width / img_width,
        available_height / img_height
      );
      draw_width = img_width * scale;
      draw_height = img_height * scale;
    } else {
      // 'fit' - preserve aspect ratio, fit within available area
      const scale = Math.min(
        available_width / img_width,
        available_height / img_height
      );
      draw_width = img_width * scale;
      draw_height = img_height * scale;
    }

    // Center the image on the page
    const draw_x = opts.margin + (available_width - draw_width) / 2;
    const draw_y = opts.margin + (available_height - draw_height) / 2;

    // Add a page and draw the image
    const page = pdf_doc.addPage([page_size.width, page_size.height]);
    page.drawImage(embedded_image, {
      x: draw_x,
      y: draw_y,
      width: draw_width,
      height: draw_height,
    });

    // Save the PDF
    const pdf_bytes = await pdf_doc.save();

    // Generate output filename
    const name_without_ext = filename.replace(/\.[^.]+$/, '');
    const pdf_filename = `${name_without_ext}.pdf`;

    console.log('[PDF Converter] Image converted to PDF:', pdf_filename, pdf_bytes.length, 'bytes');

    return {
      success: true,
      pdf_bytes,
      original_name: name_without_ext,
      pdf_filename,
      source_type: 'image',
      page_count: 1,
    };
  } catch (error) {
    console.error('[PDF Converter] Error converting image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error converting image',
    };
  }
}

/**
 * Convert text content to PDF
 * @param text_content - Text string to convert
 * @param filename - Original filename
 * @param options - Conversion options
 * @returns Promise resolving to ConversionResult
 */
export async function convert_text_to_pdf(
  text_content: string,
  filename: string,
  options?: PdfConversionOptions
): Promise<ConversionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const page_size = PAGE_SIZES[opts.page_size];

  try {
    // Dynamically import pdf-lib
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

    console.log('[PDF Converter] Converting text to PDF:', filename);

    // Create a new PDF document
    const pdf_doc = await PDFDocument.create();

    // Embed a standard font
    const font = await pdf_doc.embedFont(StandardFonts.Helvetica);

    // Calculate text area dimensions
    const margin = opts.margin;
    const font_size = opts.font_size;
    const line_height = font_size * opts.line_height;
    const available_width = page_size.width - (margin * 2);
    const available_height = page_size.height - (margin * 2);
    const lines_per_page = Math.floor(available_height / line_height);

    // Split text into lines that fit within the page width
    const lines = wrap_text(text_content, font, font_size, available_width);

    // Create pages and draw text
    let current_line = 0;
    let page_count = 0;

    while (current_line < lines.length) {
      const page = pdf_doc.addPage([page_size.width, page_size.height]);
      page_count++;

      let y = page_size.height - margin - font_size;

      for (let i = 0; i < lines_per_page && current_line < lines.length; i++) {
        page.drawText(lines[current_line], {
          x: margin,
          y: y,
          size: font_size,
          font: font,
          color: rgb(0, 0, 0),
        });

        y -= line_height;
        current_line++;
      }
    }

    // Ensure at least one page exists
    if (page_count === 0) {
      pdf_doc.addPage([page_size.width, page_size.height]);
      page_count = 1;
    }

    // Save the PDF
    const pdf_bytes = await pdf_doc.save();

    // Generate output filename
    const name_without_ext = filename.replace(/\.[^.]+$/, '');
    const pdf_filename = `${name_without_ext}.pdf`;

    console.log('[PDF Converter] Text converted to PDF:', pdf_filename, pdf_bytes.length, 'bytes,', page_count, 'pages');

    return {
      success: true,
      pdf_bytes,
      original_name: name_without_ext,
      pdf_filename,
      source_type: 'text',
      page_count,
    };
  } catch (error) {
    console.error('[PDF Converter] Error converting text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error converting text',
    };
  }
}

/**
 * Convert Excel spreadsheet to PDF
 * Supports horizontal pagination for wide tables
 * Includes row numbers and column letters like Excel
 * @param excel_bytes - Raw Excel data as Uint8Array
 * @param filename - Original filename
 * @param options - Conversion options
 * @returns Promise resolving to ConversionResult
 */
export async function convert_excel_to_pdf(
  excel_bytes: Uint8Array,
  filename: string,
  options?: PdfConversionOptions
): Promise<ConversionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const base_page_size = PAGE_SIZES[opts.page_size];
  // Use landscape orientation for Excel (swap width and height)
  const page_size = { width: base_page_size.height, height: base_page_size.width };

  try {
    // Dynamically import xlsx and pdf-lib
    const XLSX = await import('xlsx');
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

    console.log('[PDF Converter] Converting Excel to PDF (landscape):', filename);

    // Parse the Excel workbook
    const workbook = XLSX.read(excel_bytes, { type: 'array' });

    // Create a new PDF document
    const pdf_doc = await PDFDocument.create();

    // Embed fonts
    const font = await pdf_doc.embedFont(StandardFonts.Helvetica);
    const bold_font = await pdf_doc.embedFont(StandardFonts.HelveticaBold);

    // Layout constants
    const margin = opts.margin;
    const font_size = opts.font_size;
    const small_font_size = font_size - 2;
    const title_font_size = font_size + 2;
    const line_height = font_size * opts.line_height;
    const cell_padding = 5;
    const row_num_width = 35; // Width for row number column
    const title_height = title_font_size * 2;
    const col_label_height = small_font_size + 4; // Height for column letter row
    const available_width = page_size.width - (margin * 2) - row_num_width;
    const available_height = page_size.height - (margin * 2);

    // Collect all pages info first, then render with correct page numbers
    interface PageInfo {
      sheet_name: string;
      sheet_idx: number;
      start_row: number;
      end_row: number;
      col_indices: number[];
      col_widths: number[];
      h_page_num: number;      // Horizontal page number (1-based) within this row range
      total_h_pages: number;   // Total horizontal pages for this sheet
    }
    const all_pages: PageInfo[] = [];

    // Process each sheet to collect page info
    for (let sheet_idx = 0; sheet_idx < workbook.SheetNames.length; sheet_idx++) {
      const sheet_name = workbook.SheetNames[sheet_idx];
      const sheet = workbook.Sheets[sheet_name];

      // Get the range of data in the sheet
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      const num_cols = range.e.c - range.s.c + 1;

      if (num_cols === 0) continue;

      // Convert sheet to 2D array
      const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: ''
      }) as string[][];

      if (data.length === 0) continue;

      // Calculate optimal column widths
      const col_widths = calculate_optimal_column_widths(data, font, font_size, num_cols);

      // Group columns into horizontal pages
      const h_page_groups = group_columns_for_pages(col_widths, available_width);
      const total_h_pages = h_page_groups.length;

      // Calculate rows per page
      const row_height = line_height + cell_padding * 2;
      const content_height = available_height - title_height - col_label_height - row_height;
      const rows_per_page = Math.floor(content_height / row_height);

      // Generate pages: iterate vertical pages first, then horizontal
      // This way pages flow: all columns of rows 1-20, then all columns of rows 21-40, etc.
      let current_row = 1; // Start after header
      while (current_row < data.length) {
        const end_row = Math.min(current_row + rows_per_page, data.length);

        // For each vertical page section, add all horizontal pages
        for (let h_idx = 0; h_idx < h_page_groups.length; h_idx++) {
          const col_group = h_page_groups[h_idx];
          all_pages.push({
            sheet_name,
            sheet_idx,
            start_row: current_row,
            end_row,
            col_indices: col_group.indices,
            col_widths: col_group.widths,
            h_page_num: h_idx + 1,
            total_h_pages,
          });
        }

        current_row = end_row;
      }
    }

    // Now render all pages
    for (let page_num = 0; page_num < all_pages.length; page_num++) {
      const page_info = all_pages[page_num];
      const sheet = workbook.Sheets[page_info.sheet_name];
      const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: ''
      }) as string[][];

      const page = pdf_doc.addPage([page_size.width, page_size.height]);
      const row_height = line_height + cell_padding * 2;

      let y = page_size.height - margin;

      // Draw title with sheet name and page number (only if columns overflow)
      const show_sheet_name = workbook.SheetNames.length > 1;
      const show_page_num = page_info.total_h_pages > 1; // Only show page numbers when columns overflow
      const title_parts: string[] = [];
      if (show_sheet_name) title_parts.push(`Sheet: ${page_info.sheet_name}`);
      if (show_page_num) title_parts.push(`Page ${page_info.h_page_num} of ${page_info.total_h_pages}`);

      if (title_parts.length > 0) {
        page.drawText(title_parts.join('  |  '), {
          x: margin,
          y: y - title_font_size,
          size: title_font_size,
          font: bold_font,
          color: rgb(0.3, 0.3, 0.3),
        });
        y -= title_height;
      }

      // Calculate table width for this page
      const table_width = page_info.col_widths.reduce((sum, w) => sum + w, 0);

      // Draw column letter row (A, B, C...)
      let x = margin + row_num_width;
      page.drawRectangle({
        x: margin,
        y: y - col_label_height,
        width: row_num_width + table_width,
        height: col_label_height,
        color: rgb(0.85, 0.85, 0.85),
      });

      // Empty cell for row number column header
      page.drawRectangle({
        x: margin,
        y: y - col_label_height,
        width: row_num_width,
        height: col_label_height,
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 0.5,
      });

      for (let i = 0; i < page_info.col_indices.length; i++) {
        const col_idx = page_info.col_indices[i];
        const col_width = page_info.col_widths[i];
        const col_letter = column_index_to_letter(col_idx);

        // Center the column letter
        const letter_width = font.widthOfTextAtSize(col_letter, small_font_size);
        page.drawText(col_letter, {
          x: x + (col_width - letter_width) / 2,
          y: y - col_label_height + 3,
          size: small_font_size,
          font: bold_font,
          color: rgb(0.3, 0.3, 0.3),
        });

        page.drawRectangle({
          x: x,
          y: y - col_label_height,
          width: col_width,
          height: col_label_height,
          borderColor: rgb(0.6, 0.6, 0.6),
          borderWidth: 0.5,
        });

        x += col_width;
      }
      y -= col_label_height;

      // Draw header row (row 1 from data)
      const header_row = data[0] || [];
      x = margin;

      // Row number for header (1)
      page.drawRectangle({
        x: margin,
        y: y - row_height,
        width: row_num_width,
        height: row_height,
        color: rgb(0.85, 0.85, 0.85),
      });
      const row_1_text = '1';
      const row_1_width = font.widthOfTextAtSize(row_1_text, small_font_size);
      page.drawText(row_1_text, {
        x: margin + (row_num_width - row_1_width) / 2,
        y: y - row_height + cell_padding + 2,
        size: small_font_size,
        font: bold_font,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawRectangle({
        x: margin,
        y: y - row_height,
        width: row_num_width,
        height: row_height,
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 0.5,
      });

      x = margin + row_num_width;

      // Draw header background
      page.drawRectangle({
        x: margin + row_num_width,
        y: y - row_height,
        width: table_width,
        height: row_height,
        color: rgb(0.9, 0.9, 0.9),
      });

      // Draw header cells
      for (let i = 0; i < page_info.col_indices.length; i++) {
        const col_idx = page_info.col_indices[i];
        const col_width = page_info.col_widths[i];
        const cell_value = String(header_row[col_idx] || '');
        const truncated = truncate_text(cell_value, font, font_size, col_width - cell_padding * 2);

        page.drawText(truncated, {
          x: x + cell_padding,
          y: y - row_height + cell_padding + 2,
          size: font_size,
          font: bold_font,
          color: rgb(0, 0, 0),
        });

        page.drawRectangle({
          x: x,
          y: y - row_height,
          width: col_width,
          height: row_height,
          borderColor: rgb(0.6, 0.6, 0.6),
          borderWidth: 0.5,
        });

        x += col_width;
      }

      y -= row_height;

      // Draw data rows
      for (let row_idx = page_info.start_row; row_idx < page_info.end_row; row_idx++) {
        const row = data[row_idx] || [];
        x = margin;

        // Row number cell
        const row_num = row_idx + 1; // Excel rows are 1-indexed
        const row_num_text = String(row_num);
        const row_num_text_width = font.widthOfTextAtSize(row_num_text, small_font_size);

        page.drawRectangle({
          x: margin,
          y: y - row_height,
          width: row_num_width,
          height: row_height,
          color: rgb(0.92, 0.92, 0.92),
        });
        page.drawText(row_num_text, {
          x: margin + (row_num_width - row_num_text_width) / 2,
          y: y - row_height + cell_padding + 2,
          size: small_font_size,
          font: font,
          color: rgb(0.4, 0.4, 0.4),
        });
        page.drawRectangle({
          x: margin,
          y: y - row_height,
          width: row_num_width,
          height: row_height,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        });

        x = margin + row_num_width;

        // Alternate row background
        if ((row_idx - page_info.start_row) % 2 === 1) {
          page.drawRectangle({
            x: margin + row_num_width,
            y: y - row_height,
            width: table_width,
            height: row_height,
            color: rgb(0.97, 0.97, 0.97),
          });
        }

        for (let i = 0; i < page_info.col_indices.length; i++) {
          const col_idx = page_info.col_indices[i];
          const col_width = page_info.col_widths[i];
          const cell_value = String(row[col_idx] || '');
          const truncated = truncate_text(cell_value, font, font_size, col_width - cell_padding * 2);

          page.drawText(truncated, {
            x: x + cell_padding,
            y: y - row_height + cell_padding + 2,
            size: font_size,
            font: font,
            color: rgb(0, 0, 0),
          });

          page.drawRectangle({
            x: x,
            y: y - row_height,
            width: col_width,
            height: row_height,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 0.5,
          });

          x += col_width;
        }

        y -= row_height;
      }
    }

    const total_page_count = pdf_doc.getPageCount();

    // Ensure at least one page exists
    if (total_page_count === 0) {
      pdf_doc.addPage([page_size.width, page_size.height]);
    }

    // Save the PDF
    const pdf_bytes = await pdf_doc.save();

    // Generate output filename
    const name_without_ext = filename.replace(/\.[^.]+$/, '');
    const pdf_filename = `${name_without_ext}.pdf`;

    console.log('[PDF Converter] Excel converted to PDF:', pdf_filename, pdf_bytes.length, 'bytes,', pdf_doc.getPageCount(), 'pages');

    return {
      success: true,
      pdf_bytes,
      original_name: name_without_ext,
      pdf_filename,
      source_type: 'excel',
      page_count: pdf_doc.getPageCount(),
    };
  } catch (error) {
    console.error('[PDF Converter] Error converting Excel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error converting Excel',
    };
  }
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Convert column index to Excel-style letter (0 -> A, 1 -> B, 25 -> Z, 26 -> AA, etc.)
 * @param index - Zero-based column index
 * @returns Column letter(s)
 */
function column_index_to_letter(index: number): string {
  let result = '';
  let num = index;

  while (num >= 0) {
    result = String.fromCharCode((num % 26) + 65) + result;
    num = Math.floor(num / 26) - 1;
  }

  return result;
}

/**
 * Calculate optimal column widths without constraining to page width
 * Each column gets the width it needs to display content properly
 * @param data - 2D array of cell data
 * @param font - pdf-lib font object
 * @param font_size - Font size in points
 * @param num_cols - Number of columns
 * @returns Array of optimal column widths
 */
function calculate_optimal_column_widths(
  data: string[][],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any,
  font_size: number,
  num_cols: number
): number[] {
  const min_col_width = 50;
  const max_col_width = 250; // Cap individual column width
  const padding = 14;

  const col_widths: number[] = new Array(num_cols).fill(min_col_width);

  // Sample all rows (or first 100 for performance)
  const sample_rows = data.slice(0, 100);

  for (const row of sample_rows) {
    for (let col = 0; col < num_cols; col++) {
      const cell_value = String(row[col] || '');
      const text_width = font.widthOfTextAtSize(cell_value, font_size) + padding;
      col_widths[col] = Math.max(col_widths[col], Math.min(text_width, max_col_width));
    }
  }

  return col_widths;
}

/**
 * Group columns into horizontal pages based on available width
 * First column is repeated on all subsequent pages as an identifier
 * @param col_widths - Array of column widths
 * @param available_width - Available page width
 * @returns Array of column groups with indices and widths
 */
function group_columns_for_pages(
  col_widths: number[],
  available_width: number
): Array<{ indices: number[]; widths: number[] }> {
  if (col_widths.length === 0) {
    return [{ indices: [], widths: [] }];
  }

  const groups: Array<{ indices: number[]; widths: number[] }> = [];
  const first_col_width = col_widths[0];

  // Check if all columns fit on one page
  const total_width = col_widths.reduce((sum, w) => sum + w, 0);
  if (total_width <= available_width) {
    return [{
      indices: col_widths.map((_, i) => i),
      widths: col_widths,
    }];
  }

  // First page: start with column 0 and add as many as fit
  let current_group: { indices: number[]; widths: number[] } = { indices: [], widths: [] };
  let current_width = 0;

  for (let col = 0; col < col_widths.length; col++) {
    if (current_width + col_widths[col] <= available_width) {
      current_group.indices.push(col);
      current_group.widths.push(col_widths[col]);
      current_width += col_widths[col];
    } else {
      // Save current group and start new one
      if (current_group.indices.length > 0) {
        groups.push(current_group);
      }

      // For subsequent pages, always start with first column (identifier)
      current_group = {
        indices: [0, col],
        widths: [first_col_width, col_widths[col]],
      };
      current_width = first_col_width + col_widths[col];
    }
  }

  // Don't forget the last group
  if (current_group.indices.length > 0) {
    groups.push(current_group);
  }

  return groups;
}

/**
 * Truncate text to fit within a given width
 * @param text - Text to truncate
 * @param font - pdf-lib font object
 * @param font_size - Font size in points
 * @param max_width - Maximum width in points
 * @returns Truncated text with ellipsis if needed
 */
function truncate_text(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any,
  font_size: number,
  max_width: number
): string {
  if (font.widthOfTextAtSize(text, font_size) <= max_width) {
    return text;
  }

  const ellipsis = '...';
  let truncated = text;

  while (truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    if (font.widthOfTextAtSize(truncated + ellipsis, font_size) <= max_width) {
      return truncated + ellipsis;
    }
  }

  return ellipsis;
}

/**
 * Convert GIF or WebP images to PNG using canvas
 * This is needed because pdf-lib only natively supports JPEG and PNG
 * @param image_bytes - Raw image data
 * @param mime_type - Original MIME type
 * @returns PNG bytes as Uint8Array
 */
async function convert_image_via_canvas(
  image_bytes: Uint8Array,
  mime_type: string
): Promise<Uint8Array> {
  // This function requires browser environment
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    throw new Error('Image conversion requires browser environment (canvas support)');
  }

  return new Promise((resolve, reject) => {
    // Create blob URL from image bytes
    // Create new Uint8Array to ensure proper ArrayBuffer type for Blob constructor
    const blob = new Blob([new Uint8Array(image_bytes)], { type: mime_type });
    const url = URL.createObjectURL(blob);

    // Load image
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas 2D context');
        }

        ctx.drawImage(img, 0, 0);

        // Export as PNG
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image to PNG'));
            return;
          }

          blob.arrayBuffer().then((buffer) => {
            resolve(new Uint8Array(buffer));
          }).catch(reject);
        }, 'image/png');

        // Clean up
        URL.revokeObjectURL(url);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for conversion'));
    };

    img.src = url;
  });
}

/**
 * Wrap text to fit within a given width
 * @param text - Text to wrap
 * @param font - pdf-lib font object
 * @param font_size - Font size in points
 * @param max_width - Maximum line width in points
 * @returns Array of lines
 */
function wrap_text(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any,
  font_size: number,
  max_width: number
): string[] {
  const lines: string[] = [];

  // Split by explicit line breaks first
  const paragraphs = text.split(/\r?\n/);

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      // Preserve empty lines
      lines.push('');
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current_line = '';

    for (const word of words) {
      const test_line = current_line ? `${current_line} ${word}` : word;
      const width = font.widthOfTextAtSize(test_line, font_size);

      if (width <= max_width) {
        current_line = test_line;
      } else {
        if (current_line) {
          lines.push(current_line);
        }

        // Check if the word itself is too long and needs to be broken
        if (font.widthOfTextAtSize(word, font_size) > max_width) {
          // Break the word character by character
          let char_line = '';
          for (const char of word) {
            const test_char_line = char_line + char;
            if (font.widthOfTextAtSize(test_char_line, font_size) <= max_width) {
              char_line = test_char_line;
            } else {
              if (char_line) {
                lines.push(char_line);
              }
              char_line = char;
            }
          }
          current_line = char_line;
        } else {
          current_line = word;
        }
      }
    }

    if (current_line) {
      lines.push(current_line);
    }
  }

  return lines;
}
