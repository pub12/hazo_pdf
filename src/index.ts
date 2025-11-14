/**
 * Main entry point for hazo_pdf package
 * Exports all public components and utilities
 */

// Main component exports
export { PdfViewer } from './components/pdf_viewer/pdf_viewer';
export { PdfViewerLayout } from './components/pdf_viewer/pdf_viewer_layout';
export { PdfPageRenderer } from './components/pdf_viewer/pdf_page_renderer';
export { AnnotationOverlay } from './components/pdf_viewer/annotation_overlay';

// Utility exports
export { load_pdf_document } from './components/pdf_viewer/pdf_worker_setup';
export { generate_xfdf, export_annotations_to_xfdf, download_xfdf } from './utils/xfdf_generator';
export { save_annotations_to_pdf, save_and_download_pdf, download_pdf } from './utils/pdf_saver';
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

// Type exports
export type * from './types';

// Style exports (should be imported separately)
// import 'hazo_pdf/styles.css';

