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
  },

  context_menu: {
    context_menu_background_color: '#ffffff',
    context_menu_border_color: '#d1d5db',
    context_menu_item_hover_background: '#f3f4f6',
    context_menu_item_disabled_opacity: 0.5,
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
};
