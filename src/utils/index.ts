/**
 * Utility functions for hazo_pdf package
 */

/**
 * Combines class names using clsx and tailwind-merge
 */
export { cn } from './cn';

/**
 * Annotation utilities
 */
export {
  calculate_rectangle_coords,
  rectangle_to_pdf_rect,
  pdf_rect_to_rectangle,
  is_rectangle_too_small,
} from './annotation_utils';

/**
 * Coordinate mapping utilities
 */
export {
  create_coordinate_mapper,
  get_viewport_dimensions,
} from './coordinate_mapper';

/**
 * XFDF generation utilities
 */
export {
  generate_xfdf,
  export_annotations_to_xfdf,
  download_xfdf,
} from './xfdf_generator';

/**
 * PDF saving utilities
 */
export {
  save_annotations_to_pdf,
  save_and_download_pdf,
  download_pdf,
} from './pdf_saver';

/**
 * Configuration loading utilities
 */
export {
  load_pdf_config,
  load_pdf_config_async,
  build_config_from_ini,
  parse_color,
  parse_opacity,
  parse_number,
  parse_string,
} from './config_loader';

