/**
 * Default configuration values for hazo_pdf
 * All styling defaults organized by category
 */

import type { PdfViewerConfig } from '../types/config';

/**
 * Default PDF Viewer Configuration
 * These values are used when no config file is provided or when values are missing
 */
export const default_config: PdfViewerConfig = {
  fonts: {
    freetext_font_family: 'Arial, sans-serif',
    freetext_font_size_min: 12,
    freetext_font_size_max: 24,
    freetext_font_size_default: 14,
    font_foreground_color: '#000000', // Black by default
  },

  highlight_annotation: {
    highlight_fill_color: '#FFFF00',
    highlight_fill_opacity: 0.3,
    highlight_border_color: '#FFD700',
    highlight_border_color_hover: '#FFD700',
    highlight_fill_opacity_hover: 0.4,
  },

  square_annotation: {
    square_fill_color: '#FF0000',
    square_fill_opacity: 0.2,
    square_border_color: '#FF0000',
    square_border_color_hover: '#CC0000',
    square_fill_opacity_hover: 0.3,
  },

  freetext_annotation: {
    freetext_text_color: '#000000',
    freetext_text_color_hover: '#000000',
    freetext_border_color: '#003366',
    freetext_border_width: 1,
    freetext_background_color: '#E6F3FF',
    freetext_background_opacity: 0.1,
    freetext_font_weight: 'normal',
    freetext_font_style: 'normal',
    freetext_text_decoration: 'none',
    freetext_padding_horizontal: 4,
    freetext_padding_vertical: 2,
  },

  page_styling: {
    page_border_color: '#999999',
    page_box_shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    page_background_color: '#ffffff',
  },

  viewer: {
    viewer_background_color: '#2d2d2d',
    append_timestamp_to_text_edits: false,
    annotation_text_suffix_fixed_text: '',
    add_enclosing_brackets_to_suffixes: true,
    suffix_enclosing_brackets: '[]',
    suffix_text_position: 'below_multi_line',
  },

  context_menu: {
    context_menu_background_color: '#ffffff',
    context_menu_border_color: '#d1d5db',
    context_menu_item_hover_background: '#f3f4f6',
    context_menu_item_disabled_opacity: 0.5,
    right_click_custom_stamps: '', // Empty string means no custom stamps
  },

  dialog: {
    dialog_backdrop_opacity: 0.2,
    dialog_background_color: '#ffffff',
    dialog_border_color: '#d1d5db',
    dialog_button_submit_color: '#16a34a',
    dialog_button_submit_color_hover: '#15803d',
    dialog_button_cancel_color: '#6b7280',
    dialog_button_cancel_color_hover: '#4b5563',
    dialog_button_disabled_opacity: 0.4,
  },

  toolbar: {
    toolbar_background_color: '#f9fafb',
    toolbar_border_color: '#e5e7eb',
    toolbar_font_family: 'system-ui, -apple-system, sans-serif',
    toolbar_font_size: 14,
    toolbar_font_color: '#111827',
    toolbar_button_background_color: '#ffffff',
    toolbar_button_background_color_hover: '#f3f4f6',
    toolbar_button_text_color: '#374151',
    toolbar_button_active_background_color: '#3b82f6',
    toolbar_button_active_text_color: '#ffffff',
    toolbar_button_save_background_color: '#10b981',
    toolbar_button_save_background_color_hover: '#059669',
    toolbar_button_save_text_color: '#ffffff',
    toolbar_button_disabled_opacity: 0.5,
    toolbar_show_zoom_controls: true,
    toolbar_show_rotation_controls: true,
    toolbar_show_square_button: true,
    toolbar_show_undo_button: true,
    toolbar_show_redo_button: true,
    toolbar_show_save_button: true,
    toolbar_show_metadata_button: true,
    toolbar_show_annotate_button: true,
    toolbar_show_file_info_button: true,
    toolbar_show_extract_button: true,
    toolbar_zoom_out_label: '−',
    toolbar_zoom_in_label: '+',
    toolbar_zoom_reset_label: 'Reset',
    toolbar_square_label: 'Square',
    toolbar_undo_label: 'Undo',
    toolbar_redo_label: 'Redo',
    toolbar_save_label: 'Save',
    toolbar_saving_label: 'Saving...',
    toolbar_metadata_label: 'Metadata',
  },

  file_manager: {
    file_manager_enabled: false,
    show_file_list: true,
    allow_delete: true,
    show_popout_button: true,
    file_list_height: 60,
    selected_color: '#3b82f6',
    file_list_background_color: '#f9fafb',
    file_list_border_color: '#e5e7eb',
  },

  file_upload: {
    upload_enabled: true,
    allowed_types: 'application/pdf,image/jpeg,image/png,image/gif,image/webp,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    max_file_size: 10485760, // 10MB
    max_files: 10,
    show_add_button: true,
    dropzone_border_color: '#d1d5db',
    dropzone_border_color_active: '#3b82f6',
    dropzone_background_color: '#f9fafb',
  },

  pdf_conversion: {
    conversion_enabled: true,
    page_size: 'letter',
    image_quality: 0.85,
    image_fit: 'fit',
    margin: 36,
  },

  file_button: {
    icon_size: 24,
    icon_color: '#6b7280',
    icon_color_hover: '#374151',
    icon_color_with_files: '#3b82f6',
    badge_background: '#3b82f6',
    badge_text_color: '#ffffff',
  },
};
