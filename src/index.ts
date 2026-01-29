/**
 * Main entry point for hazo_pdf package
 * Exports all public components and utilities
 */

// Main component exports
export { PdfViewer } from './components/pdf_viewer/pdf_viewer';
export { PdfViewerDialog } from './components/pdf_viewer/pdf_viewer_dialog';
export { PdfViewerLayout } from './components/pdf_viewer/pdf_viewer_layout';
export { PdfPageRenderer } from './components/pdf_viewer/pdf_page_renderer';
export { AnnotationOverlay } from './components/pdf_viewer/annotation_overlay';

// File manager component exports
export {
  FileManager,
  FileList,
  FileListItem,
  FileManagerButton,
  UploadDropzone,
  UploadProgressDisplay,
} from './components/file_manager';

// Utility exports
export { load_pdf_document } from './components/pdf_viewer/pdf_worker_setup';
export { generate_xfdf, export_annotations_to_xfdf, download_xfdf } from './utils/xfdf_generator';
export { save_annotations_to_pdf, save_and_download_pdf, download_pdf } from './utils/pdf_saver';

// PDF conversion exports
export {
  convert_to_pdf,
  convert_image_to_pdf,
  convert_text_to_pdf,
  convert_excel_to_pdf,
  can_convert_to_pdf,
  is_image_type,
  is_text_type,
  is_excel_type,
  get_supported_types,
} from './utils/pdf_converter';
export type {
  PdfConversionOptions,
  ConversionResult,
  SupportedImageType,
  SupportedTextType,
  SupportedExcelType,
  SupportedConversionType,
} from './utils/pdf_converter';
export { create_coordinate_mapper, get_viewport_dimensions } from './utils/coordinate_mapper';
export {
  calculate_rectangle_coords,
  rectangle_to_pdf_rect,
  pdf_rect_to_rectangle,
  is_rectangle_too_small,
} from './utils/annotation_utils';

// Config exports
export {
  load_pdf_config,
  load_pdf_config_async,
  build_config_from_ini,
  parse_color,
  parse_opacity,
  parse_number,
  parse_string,
} from './utils/config_loader';
export { default_config } from './config/default_config';

// Logger exports
export { set_logger, get_logger } from './utils/logger';
export type { Logger } from './utils/logger';

// Type exports
export type * from './types';
export type { HighlightFieldInfo } from './components/pdf_viewer/file_info_sidepanel';

// Style exports (should be imported separately)
// import 'hazo_pdf/styles.css';

