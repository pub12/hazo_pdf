/**
 * Configuration loader for hazo_pdf
 * Loads configuration from INI file using hazo_config package (Node.js) or fetch (browser)
 * Falls back to defaults if config file is missing or invalid
 */

import { default_config } from '../config/default_config';
import type { PdfViewerConfig } from '../types/config';

/**
 * Simple INI parser for browser environments
 * Parses INI format: [section] followed by key=value pairs
 */
function parse_ini_browser(ini_text: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  let current_section = '';
  
  const lines = ini_text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Check for section header [section_name]
    const section_match = trimmed.match(/^\[([^\]]+)\]$/);
    if (section_match) {
      current_section = section_match[1].trim();
      if (!result[current_section]) {
        result[current_section] = {};
      }
      continue;
    }
    
    // Parse key=value pairs
    const key_value_match = trimmed.match(/^([^=]+)=(.*)$/);
    if (key_value_match && current_section) {
      const key = key_value_match[1].trim();
      const value = key_value_match[2].trim();
      result[current_section][key] = value;
    }
  }
  
  return result;
}

/**
 * Load config in browser environment by fetching the INI file
 * Note: In browser, we parse INI manually since hazo_config requires Node.js fs module
 * The parsing logic matches hazo_config's parsing behavior
 * For Next.js apps, the config is served via /api/config which uses hazo_config on the server
 */
async function load_config_browser(config_file: string): Promise<PdfViewerConfig> {
  try {
    // In Next.js, serve config via API route that uses hazo_config
    // This ensures the config file stays in root and hazo_config is used server-side
    // If config_file is a relative path (config/hazo_pdf_config.ini), use /api/config
    // If it's already a full URL or API path, use it directly
    const config_url = (config_file === 'config/hazo_pdf_config.ini' || config_file.includes('config/hazo_pdf_config.ini'))
      ? '/api/config'
      : config_file;
    
    const response = await fetch(config_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch config file: ${response.status} ${response.statusText}`);
    }
    const ini_text = await response.text();
    
    // Parse INI manually (matching hazo_config's parsing behavior)
    // hazo_config requires Node.js fs, so we implement compatible parsing here
    const parsed = parse_ini_browser(ini_text);
    
    // Debug: Log parsed values for troubleshooting
    console.log('[ConfigLoader] Parsed config sections:', Object.keys(parsed));
    if (parsed['fonts']) {
      console.log('[ConfigLoader] fonts section:', parsed['fonts']);
    }
    if (parsed['freetext_annotation']) {
      console.log('[ConfigLoader] freetext_annotation section:', parsed['freetext_annotation']);
    }
    if (parsed['viewer']) {
      console.log('[ConfigLoader] viewer section:', parsed['viewer']);
    } else {
      console.warn('[ConfigLoader] viewer section NOT found in parsed config!');
    }
    
    // Extract values from parsed INI
    const get_value = (section: string, key: string): string | undefined => {
      return parsed[section]?.[key];
    };
    
    // Build config object using same function as hazo_config version
    const config = build_config_from_ini(get_value);
    
    // Debug: Log final config values
    console.log('[ConfigLoader] Final config values:');
    console.log('  font_foreground_color:', config.fonts.font_foreground_color);
    console.log('  freetext_text_color:', config.freetext_annotation.freetext_text_color);
    console.log('  freetext_background_color:', config.freetext_annotation.freetext_background_color);
    console.log('  freetext_background_opacity:', config.freetext_annotation.freetext_background_opacity);
    console.log('  append_timestamp_to_text_edits:', config.viewer.append_timestamp_to_text_edits);
    console.log('  annotation_text_suffix_fixed_text:', config.viewer.annotation_text_suffix_fixed_text);
    
    // Debug: Log viewer section parsing
    const raw_value = get_value('viewer', 'append_timestamp_to_text_edits');
    console.log('[ConfigLoader] append_timestamp_to_text_edits:');
    console.log('  raw_value from INI:', raw_value, '(type:', typeof raw_value, ')');
    console.log('  parsed boolean:', config.viewer.append_timestamp_to_text_edits);
    console.log('  parse_boolean test:', parse_boolean(raw_value, false));
    
    // Also log all viewer keys for debugging
    if (parsed['viewer']) {
      console.log('[ConfigLoader] All viewer section keys:', Object.keys(parsed['viewer']));
      console.log('[ConfigLoader] All viewer section values:', parsed['viewer']);
    }
    
    return config;
  } catch (error) {
    console.warn(`[ConfigLoader] Could not load config file "${config_file}" in browser, using defaults:`, error);
    return default_config;
  }
}

/**
 * Load config asynchronously (works in both browser and Node.js)
 * Uses hazo_config in Node.js, fetch + manual parsing in browser
 * @param config_file - Path to config file
 * @returns Promise resolving to PdfViewerConfig
 */
export async function load_pdf_config_async(config_file: string): Promise<PdfViewerConfig> {
  // Detect environment
  const is_browser = typeof window !== 'undefined' && typeof fetch !== 'undefined';
  
  if (is_browser) {
    // Browser: use fetch + manual parsing (hazo_config requires Node.js)
    return load_config_browser(config_file);
  }
  
  // Node.js: use hazo_config (preferred method)
  try {
    // Dynamically import hazo_config only in Node.js
    const { HazoConfig } = require('hazo_config');
    const hazo_config = new HazoConfig({ filePath: config_file });
    
    console.log(`[ConfigLoader] Using hazo_config to load: ${config_file}`);
    
    // Use hazo_config's get method
    const get_value = (section: string, key: string): string | undefined => {
      return hazo_config.get(section, key);
    };
    
    const config = build_config_from_ini(get_value);
    console.log(`[ConfigLoader] Successfully loaded config using hazo_config from: ${config_file}`);
    return config;
  } catch (error) {
    console.warn(
      `[ConfigLoader] Could not load config file "${config_file}" using hazo_config, using defaults:`,
      error instanceof Error ? error.message : String(error)
    );
    return default_config;
  }
}

/**
 * Build config object from INI values (shared between browser and Node.js)
 * @param get_value - Function to get a value from INI (section, key) -> value
 * @returns Complete PdfViewerConfig object
 */
export function build_config_from_ini(get_value: (section: string, key: string) => string | undefined): PdfViewerConfig {
  return {
    fonts: {
      freetext_font_family: parse_string(
        get_value('fonts', 'freetext_font_family'),
        default_config.fonts.freetext_font_family
      ),
      freetext_font_size_min: parse_number(
        get_value('fonts', 'freetext_font_size_min'),
        default_config.fonts.freetext_font_size_min
      ),
      freetext_font_size_max: parse_number(
        get_value('fonts', 'freetext_font_size_max'),
        default_config.fonts.freetext_font_size_max
      ),
      freetext_font_size_default: parse_number(
        get_value('fonts', 'freetext_font_size_default'),
        default_config.fonts.freetext_font_size_default
      ),
      font_foreground_color: parse_color(
        get_value('fonts', 'font_foreground_color'),
        default_config.fonts.font_foreground_color
      ),
    },

    highlight_annotation: {
      highlight_fill_color: parse_color(
        get_value('highlight_annotation', 'highlight_fill_color'),
        default_config.highlight_annotation.highlight_fill_color
      ),
      highlight_fill_opacity: parse_opacity(
        get_value('highlight_annotation', 'highlight_fill_opacity'),
        default_config.highlight_annotation.highlight_fill_opacity
      ),
      highlight_border_color: parse_color(
        get_value('highlight_annotation', 'highlight_border_color'),
        default_config.highlight_annotation.highlight_border_color
      ),
      highlight_border_color_hover: parse_color(
        get_value('highlight_annotation', 'highlight_border_color_hover'),
        default_config.highlight_annotation.highlight_border_color_hover
      ),
      highlight_fill_opacity_hover: parse_opacity(
        get_value('highlight_annotation', 'highlight_fill_opacity_hover'),
        default_config.highlight_annotation.highlight_fill_opacity_hover
      ),
    },

    square_annotation: {
      square_fill_color: parse_color(
        get_value('square_annotation', 'square_fill_color'),
        default_config.square_annotation.square_fill_color
      ),
      square_fill_opacity: parse_opacity(
        get_value('square_annotation', 'square_fill_opacity'),
        default_config.square_annotation.square_fill_opacity
      ),
      square_border_color: parse_color(
        get_value('square_annotation', 'square_border_color'),
        default_config.square_annotation.square_border_color
      ),
      square_border_color_hover: parse_color(
        get_value('square_annotation', 'square_border_color_hover'),
        default_config.square_annotation.square_border_color_hover
      ),
      square_fill_opacity_hover: parse_opacity(
        get_value('square_annotation', 'square_fill_opacity_hover'),
        default_config.square_annotation.square_fill_opacity_hover
      ),
    },

    freetext_annotation: {
      freetext_text_color: parse_color(
        get_value('freetext_annotation', 'freetext_text_color'),
        default_config.freetext_annotation.freetext_text_color
      ),
      freetext_text_color_hover: parse_color(
        get_value('freetext_annotation', 'freetext_text_color_hover'),
        default_config.freetext_annotation.freetext_text_color_hover
      ),
      freetext_border_color: parse_string(
        get_value('freetext_annotation', 'freetext_border_color'),
        default_config.freetext_annotation.freetext_border_color
      ),
      freetext_border_width: parse_number(
        get_value('freetext_annotation', 'freetext_border_width'),
        default_config.freetext_annotation.freetext_border_width
      ),
      freetext_background_color: (() => {
        const raw_value = get_value('freetext_annotation', 'freetext_background_color');
        const parsed = parse_string(raw_value, default_config.freetext_annotation.freetext_background_color);
        console.log(`[ConfigLoader] freetext_background_color: raw="${raw_value}", parsed="${parsed}"`);
        return parsed;
      })(),
      freetext_background_opacity: parse_opacity(
        get_value('freetext_annotation', 'freetext_background_opacity'),
        default_config.freetext_annotation.freetext_background_opacity
      ),
      freetext_font_weight: parse_string(
        get_value('freetext_annotation', 'freetext_font_weight'),
        default_config.freetext_annotation.freetext_font_weight
      ),
      freetext_font_style: parse_string(
        get_value('freetext_annotation', 'freetext_font_style'),
        default_config.freetext_annotation.freetext_font_style
      ),
      freetext_text_decoration: parse_string(
        get_value('freetext_annotation', 'freetext_text_decoration'),
        default_config.freetext_annotation.freetext_text_decoration
      ),
      freetext_padding_horizontal: parse_number(
        get_value('freetext_annotation', 'freetext_padding_horizontal'),
        default_config.freetext_annotation.freetext_padding_horizontal
      ),
      freetext_padding_vertical: parse_number(
        get_value('freetext_annotation', 'freetext_padding_vertical'),
        default_config.freetext_annotation.freetext_padding_vertical
      ),
    },

    page_styling: {
      page_border_color: parse_color(
        get_value('page_styling', 'page_border_color'),
        default_config.page_styling.page_border_color
      ),
      page_box_shadow: parse_string(
        get_value('page_styling', 'page_box_shadow'),
        default_config.page_styling.page_box_shadow
      ),
      page_background_color: parse_color(
        get_value('page_styling', 'page_background_color'),
        default_config.page_styling.page_background_color
      ),
    },

    viewer: {
      viewer_background_color: parse_color(
        get_value('viewer', 'viewer_background_color'),
        default_config.viewer.viewer_background_color
      ),
      append_timestamp_to_text_edits: parse_boolean(
        get_value('viewer', 'append_timestamp_to_text_edits'),
        default_config.viewer.append_timestamp_to_text_edits
      ),
      annotation_text_suffix_fixed_text: parse_string(
        get_value('viewer', 'annotation_text_suffix_fixed_text'),
        default_config.viewer.annotation_text_suffix_fixed_text
      ),
      add_enclosing_brackets_to_suffixes: parse_boolean(
        get_value('viewer', 'add_enclosing_brackets_to_suffixes'),
        default_config.viewer.add_enclosing_brackets_to_suffixes
      ),
      suffix_enclosing_brackets: (() => {
        const raw_value = parse_string(
          get_value('viewer', 'suffix_enclosing_brackets'),
          default_config.viewer.suffix_enclosing_brackets
        );
        if (raw_value.length === 2) {
          return raw_value;
        }
        console.warn(
          `[ConfigLoader] suffix_enclosing_brackets must be 2 characters, received "${raw_value}". Using default.`
        );
        return default_config.viewer.suffix_enclosing_brackets;
      })(),
      suffix_text_position: (() => {
        const raw_value = parse_string(
          get_value('viewer', 'suffix_text_position'),
          default_config.viewer.suffix_text_position
        ) as 'adjacent' | 'below_single_line' | 'below_multi_line';
        const valid_values: Array<'adjacent' | 'below_single_line' | 'below_multi_line'> = [
          'adjacent',
          'below_single_line',
          'below_multi_line',
        ];
        if (valid_values.includes(raw_value)) {
          return raw_value;
        }
        console.warn(
          `[ConfigLoader] Invalid suffix_text_position "${raw_value}". Using default "${default_config.viewer.suffix_text_position}".`
        );
        return default_config.viewer.suffix_text_position;
      })(),
    },

    context_menu: {
      context_menu_background_color: parse_color(
        get_value('context_menu', 'context_menu_background_color'),
        default_config.context_menu.context_menu_background_color
      ),
      context_menu_border_color: parse_color(
        get_value('context_menu', 'context_menu_border_color'),
        default_config.context_menu.context_menu_border_color
      ),
      context_menu_item_hover_background: parse_color(
        get_value('context_menu', 'context_menu_item_hover_background'),
        default_config.context_menu.context_menu_item_hover_background
      ),
      context_menu_item_disabled_opacity: parse_opacity(
        get_value('context_menu', 'context_menu_item_disabled_opacity'),
        default_config.context_menu.context_menu_item_disabled_opacity
      ),
      right_click_custom_stamps: parse_string(
        get_value('context_menu', 'right_click_custom_stamps'),
        default_config.context_menu.right_click_custom_stamps
      ),
    },

    dialog: {
      dialog_backdrop_opacity: parse_opacity(
        get_value('dialog', 'dialog_backdrop_opacity'),
        default_config.dialog.dialog_backdrop_opacity
      ),
      dialog_background_color: parse_color(
        get_value('dialog', 'dialog_background_color'),
        default_config.dialog.dialog_background_color
      ),
      dialog_border_color: parse_color(
        get_value('dialog', 'dialog_border_color'),
        default_config.dialog.dialog_border_color
      ),
      dialog_button_submit_color: parse_color(
        get_value('dialog', 'dialog_button_submit_color'),
        default_config.dialog.dialog_button_submit_color
      ),
      dialog_button_submit_color_hover: parse_color(
        get_value('dialog', 'dialog_button_submit_color_hover'),
        default_config.dialog.dialog_button_submit_color_hover
      ),
      dialog_button_cancel_color: parse_color(
        get_value('dialog', 'dialog_button_cancel_color'),
        default_config.dialog.dialog_button_cancel_color
      ),
      dialog_button_cancel_color_hover: parse_color(
        get_value('dialog', 'dialog_button_cancel_color_hover'),
        default_config.dialog.dialog_button_cancel_color_hover
      ),
      dialog_button_disabled_opacity: parse_opacity(
        get_value('dialog', 'dialog_button_disabled_opacity'),
        default_config.dialog.dialog_button_disabled_opacity
      ),
    },

    toolbar: {
      toolbar_background_color: parse_color(
        get_value('toolbar', 'toolbar_background_color'),
        default_config.toolbar.toolbar_background_color
      ),
      toolbar_border_color: parse_color(
        get_value('toolbar', 'toolbar_border_color'),
        default_config.toolbar.toolbar_border_color
      ),
      toolbar_font_family: parse_string(
        get_value('toolbar', 'toolbar_font_family'),
        default_config.toolbar.toolbar_font_family
      ),
      toolbar_font_size: parse_number(
        get_value('toolbar', 'toolbar_font_size'),
        default_config.toolbar.toolbar_font_size
      ),
      toolbar_font_color: parse_color(
        get_value('toolbar', 'toolbar_font_color'),
        default_config.toolbar.toolbar_font_color
      ),
      toolbar_button_background_color: parse_color(
        get_value('toolbar', 'toolbar_button_background_color'),
        default_config.toolbar.toolbar_button_background_color
      ),
      toolbar_button_background_color_hover: parse_color(
        get_value('toolbar', 'toolbar_button_background_color_hover'),
        default_config.toolbar.toolbar_button_background_color_hover
      ),
      toolbar_button_text_color: parse_color(
        get_value('toolbar', 'toolbar_button_text_color'),
        default_config.toolbar.toolbar_button_text_color
      ),
      toolbar_button_active_background_color: parse_color(
        get_value('toolbar', 'toolbar_button_active_background_color'),
        default_config.toolbar.toolbar_button_active_background_color
      ),
      toolbar_button_active_text_color: parse_color(
        get_value('toolbar', 'toolbar_button_active_text_color'),
        default_config.toolbar.toolbar_button_active_text_color
      ),
      toolbar_button_save_background_color: parse_color(
        get_value('toolbar', 'toolbar_button_save_background_color'),
        default_config.toolbar.toolbar_button_save_background_color
      ),
      toolbar_button_save_background_color_hover: parse_color(
        get_value('toolbar', 'toolbar_button_save_background_color_hover'),
        default_config.toolbar.toolbar_button_save_background_color_hover
      ),
      toolbar_button_save_text_color: parse_color(
        get_value('toolbar', 'toolbar_button_save_text_color'),
        default_config.toolbar.toolbar_button_save_text_color
      ),
      toolbar_button_disabled_opacity: parse_opacity(
        get_value('toolbar', 'toolbar_button_disabled_opacity'),
        default_config.toolbar.toolbar_button_disabled_opacity
      ),
      toolbar_show_zoom_controls: parse_boolean(
        get_value('toolbar', 'toolbar_show_zoom_controls'),
        default_config.toolbar.toolbar_show_zoom_controls
      ),
      toolbar_show_rotation_controls: parse_boolean(
        get_value('toolbar', 'toolbar_show_rotation_controls'),
        default_config.toolbar.toolbar_show_rotation_controls
      ),
      toolbar_show_square_button: parse_boolean(
        get_value('toolbar', 'toolbar_show_square_button'),
        default_config.toolbar.toolbar_show_square_button
      ),
      toolbar_show_undo_button: parse_boolean(
        get_value('toolbar', 'toolbar_show_undo_button'),
        default_config.toolbar.toolbar_show_undo_button
      ),
      toolbar_show_redo_button: parse_boolean(
        get_value('toolbar', 'toolbar_show_redo_button'),
        default_config.toolbar.toolbar_show_redo_button
      ),
      toolbar_show_save_button: parse_boolean(
        get_value('toolbar', 'toolbar_show_save_button'),
        default_config.toolbar.toolbar_show_save_button
      ),
      toolbar_show_metadata_button: parse_boolean(
        get_value('toolbar', 'toolbar_show_metadata_button'),
        default_config.toolbar.toolbar_show_metadata_button
      ),
      toolbar_show_annotate_button: parse_boolean(
        get_value('toolbar', 'toolbar_show_annotate_button'),
        default_config.toolbar.toolbar_show_annotate_button
      ),
      toolbar_zoom_out_label: parse_string(
        get_value('toolbar', 'toolbar_zoom_out_label'),
        default_config.toolbar.toolbar_zoom_out_label
      ),
      toolbar_zoom_in_label: parse_string(
        get_value('toolbar', 'toolbar_zoom_in_label'),
        default_config.toolbar.toolbar_zoom_in_label
      ),
      toolbar_zoom_reset_label: parse_string(
        get_value('toolbar', 'toolbar_zoom_reset_label'),
        default_config.toolbar.toolbar_zoom_reset_label
      ),
      toolbar_square_label: parse_string(
        get_value('toolbar', 'toolbar_square_label'),
        default_config.toolbar.toolbar_square_label
      ),
      toolbar_undo_label: parse_string(
        get_value('toolbar', 'toolbar_undo_label'),
        default_config.toolbar.toolbar_undo_label
      ),
      toolbar_redo_label: parse_string(
        get_value('toolbar', 'toolbar_redo_label'),
        default_config.toolbar.toolbar_redo_label
      ),
      toolbar_save_label: parse_string(
        get_value('toolbar', 'toolbar_save_label'),
        default_config.toolbar.toolbar_save_label
      ),
      toolbar_saving_label: parse_string(
        get_value('toolbar', 'toolbar_saving_label'),
        default_config.toolbar.toolbar_saving_label
      ),
      toolbar_metadata_label: parse_string(
        get_value('toolbar', 'toolbar_metadata_label'),
        default_config.toolbar.toolbar_metadata_label
      ),
    },

    file_manager: {
      file_manager_enabled: parse_boolean(
        get_value('file_manager', 'file_manager_enabled'),
        default_config.file_manager.file_manager_enabled
      ),
      show_file_list: parse_boolean(
        get_value('file_manager', 'show_file_list'),
        default_config.file_manager.show_file_list
      ),
      allow_delete: parse_boolean(
        get_value('file_manager', 'allow_delete'),
        default_config.file_manager.allow_delete
      ),
      show_popout_button: parse_boolean(
        get_value('file_manager', 'show_popout_button'),
        default_config.file_manager.show_popout_button
      ),
      file_list_height: parse_number(
        get_value('file_manager', 'file_list_height'),
        default_config.file_manager.file_list_height
      ),
      selected_color: parse_color(
        get_value('file_manager', 'selected_color'),
        default_config.file_manager.selected_color
      ),
      file_list_background_color: parse_color(
        get_value('file_manager', 'file_list_background_color'),
        default_config.file_manager.file_list_background_color
      ),
      file_list_border_color: parse_color(
        get_value('file_manager', 'file_list_border_color'),
        default_config.file_manager.file_list_border_color
      ),
    },

    file_upload: {
      upload_enabled: parse_boolean(
        get_value('file_upload', 'upload_enabled'),
        default_config.file_upload.upload_enabled
      ),
      allowed_types: parse_string(
        get_value('file_upload', 'allowed_types'),
        default_config.file_upload.allowed_types
      ),
      max_file_size: parse_number(
        get_value('file_upload', 'max_file_size'),
        default_config.file_upload.max_file_size
      ),
      max_files: parse_number(
        get_value('file_upload', 'max_files'),
        default_config.file_upload.max_files
      ),
      show_add_button: parse_boolean(
        get_value('file_upload', 'show_add_button'),
        default_config.file_upload.show_add_button
      ),
      dropzone_border_color: parse_color(
        get_value('file_upload', 'dropzone_border_color'),
        default_config.file_upload.dropzone_border_color
      ),
      dropzone_border_color_active: parse_color(
        get_value('file_upload', 'dropzone_border_color_active'),
        default_config.file_upload.dropzone_border_color_active
      ),
      dropzone_background_color: parse_color(
        get_value('file_upload', 'dropzone_background_color'),
        default_config.file_upload.dropzone_background_color
      ),
    },

    pdf_conversion: {
      conversion_enabled: parse_boolean(
        get_value('pdf_conversion', 'conversion_enabled'),
        default_config.pdf_conversion.conversion_enabled
      ),
      page_size: (() => {
        const raw_value = parse_string(
          get_value('pdf_conversion', 'page_size'),
          default_config.pdf_conversion.page_size
        ) as 'letter' | 'a4' | 'legal';
        const valid_values: Array<'letter' | 'a4' | 'legal'> = ['letter', 'a4', 'legal'];
        if (valid_values.includes(raw_value)) {
          return raw_value;
        }
        return default_config.pdf_conversion.page_size;
      })(),
      image_quality: parse_opacity(
        get_value('pdf_conversion', 'image_quality'),
        default_config.pdf_conversion.image_quality
      ),
      image_fit: (() => {
        const raw_value = parse_string(
          get_value('pdf_conversion', 'image_fit'),
          default_config.pdf_conversion.image_fit
        ) as 'fit' | 'fill' | 'stretch';
        const valid_values: Array<'fit' | 'fill' | 'stretch'> = ['fit', 'fill', 'stretch'];
        if (valid_values.includes(raw_value)) {
          return raw_value;
        }
        return default_config.pdf_conversion.image_fit;
      })(),
      margin: parse_number(
        get_value('pdf_conversion', 'margin'),
        default_config.pdf_conversion.margin
      ),
    },

    file_button: {
      icon_size: parse_number(
        get_value('file_button', 'icon_size'),
        default_config.file_button.icon_size
      ),
      icon_color: parse_color(
        get_value('file_button', 'icon_color'),
        default_config.file_button.icon_color
      ),
      icon_color_hover: parse_color(
        get_value('file_button', 'icon_color_hover'),
        default_config.file_button.icon_color_hover
      ),
      icon_color_with_files: parse_color(
        get_value('file_button', 'icon_color_with_files'),
        default_config.file_button.icon_color_with_files
      ),
      badge_background: parse_color(
        get_value('file_button', 'badge_background'),
        default_config.file_button.badge_background
      ),
      badge_text_color: parse_color(
        get_value('file_button', 'badge_text_color'),
        default_config.file_button.badge_text_color
      ),
    },
  };
}

/**
 * Parse a color value from config (hex format)
 * @param value - Color value from config
 * @param default_value - Default color if parsing fails
 * @returns Parsed color value
 */
export function parse_color(value: string | undefined, default_value: string): string {
  if (!value) return default_value;
  // Validate hex color format
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    return value;
  }
  // Try to parse rgba format
  if (value.startsWith('rgba') || value.startsWith('rgb')) {
    return value;
  }
  console.warn(`[ConfigLoader] Invalid color format: ${value}, using default: ${default_value}`);
  return default_value;
}

/**
 * Parse an opacity value from config (0.0 to 1.0)
 * @param value - Opacity value from config
 * @param default_value - Default opacity if parsing fails
 * @returns Parsed opacity value
 */
export function parse_opacity(value: string | undefined, default_value: number): number {
  if (!value) return default_value;
  const parsed = parseFloat(value);
  if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
    return parsed;
  }
  console.warn(`[ConfigLoader] Invalid opacity value: ${value}, using default: ${default_value}`);
  return default_value;
}

/**
 * Parse a number value from config
 * @param value - Number value from config
 * @param default_value - Default number if parsing fails
 * @returns Parsed number value
 */
export function parse_number(value: string | undefined, default_value: number): number {
  if (!value) return default_value;
  const parsed = parseFloat(value);
  if (!isNaN(parsed)) {
    return parsed;
  }
  console.warn(`[ConfigLoader] Invalid number value: ${value}, using default: ${default_value}`);
  return default_value;
}

/**
 * Parse a string value from config
 * @param value - String value from config
 * @param default_value - Default string if value is missing
 * @returns Parsed string value
 */
export function parse_string(value: string | undefined, default_value: string): string {
  return value || default_value;
}

/**
 * Parse a boolean value from config
 * @param value - Boolean value from config (true/false, yes/no, 1/0)
 * @param default_value - Default boolean if parsing fails
 * @returns Parsed boolean value
 */
export function parse_boolean(value: string | undefined, default_value: boolean): boolean {
  if (!value) return default_value;
  const lower = value.toLowerCase().trim();
  if (lower === 'true' || lower === 'yes' || lower === '1') {
    return true;
  }
  if (lower === 'false' || lower === 'no' || lower === '0') {
    return false;
  }
  console.warn(`[ConfigLoader] Invalid boolean value: ${value}, using default: ${default_value}`);
  return default_value;
}

/**
 * Load PDF viewer configuration from INI file
 * Supports both Node.js (using hazo_config) and browser (using fetch) environments
 * @param config_file - Optional path to config file. If not provided, returns defaults
 * @returns Configuration object with loaded values merged with defaults
 */
export function load_pdf_config(config_file?: string): PdfViewerConfig {
  // If no config file specified, return defaults
  if (!config_file) {
    console.log('[ConfigLoader] No config file specified, using defaults');
    return default_config;
  }

  // Detect environment: browser vs Node.js
  const is_browser = typeof window !== 'undefined' && typeof fetch !== 'undefined';
  
  if (is_browser) {
    // Browser environment: use fetch to load INI file
    // Note: This is async, but we need sync behavior for React component initialization
    // We'll load it synchronously by throwing an error if fetch fails, and the component
    // will need to handle async loading or we use a different approach
    console.warn('[ConfigLoader] Browser environment detected. Config loading should be async, but load_pdf_config is sync. Using defaults. Consider making this async or using a different approach.');
    return default_config;
  }

  // Node.js environment: use hazo_config
  try {
    // Dynamically import hazo_config only in Node.js
    const { HazoConfig } = require('hazo_config');
    const hazo_config = new HazoConfig({ filePath: config_file });

    // Use the shared build function
    const get_value = (section: string, key: string): string | undefined => {
      return hazo_config.get(section, key);
    };
    
    const config = build_config_from_ini(get_value);
    console.log(`[ConfigLoader] Successfully loaded config from: ${config_file}`);
    return config;
  } catch (error) {
    // If config file doesn't exist or has errors, use defaults
    console.warn(
      `[ConfigLoader] Could not load config file "${config_file}", using defaults:`,
      error instanceof Error ? error.message : String(error)
    );
    return default_config;
  }
}
