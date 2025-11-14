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
 * The parsing logic matches hazo_config's INI parsing behavior
 */
async function load_config_browser(config_file: string): Promise<PdfViewerConfig> {
  try {
    const response = await fetch(config_file);
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
