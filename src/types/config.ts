/**
 * Configuration types for hazo_pdf
 * Defines all configurable styling values
 */

/**
 * PDF Viewer Configuration Interface
 * Contains all configurable styling values organized by category
 */
export interface PdfViewerConfig {
  // Font configuration
  fonts: {
    /** Font family for FreeText annotations */
    freetext_font_family: string;
    /** Minimum font size for FreeText annotations (in pixels) */
    freetext_font_size_min: number;
    /** Maximum font size for FreeText annotations (in pixels) */
    freetext_font_size_max: number;
    /** Default font size for FreeText annotations (in pixels) */
    freetext_font_size_default: number;
    /** Default font foreground (text) color for all text annotations (hex format: #RRGGBB or rgb(r, g, b)) */
    font_foreground_color: string;
  };

  // Highlight annotation styling
  highlight_annotation: {
    /** Fill color for highlight annotations (hex format) */
    highlight_fill_color: string;
    /** Fill opacity for highlight annotations (0.0 to 1.0) */
    highlight_fill_opacity: number;
    /** Border/stroke color for highlight annotations (hex format) */
    highlight_border_color: string;
    /** Border color on hover (hex format) */
    highlight_border_color_hover: string;
    /** Fill opacity on hover (0.0 to 1.0) */
    highlight_fill_opacity_hover: number;
  };

  // Square annotation styling
  square_annotation: {
    /** Fill color for square annotations (hex format) */
    square_fill_color: string;
    /** Fill opacity for square annotations (0.0 to 1.0) */
    square_fill_opacity: number;
    /** Border/stroke color for square annotations (hex format) */
    square_border_color: string;
    /** Border color on hover (hex format) */
    square_border_color_hover: string;
    /** Fill opacity on hover (0.0 to 1.0) */
    square_fill_opacity_hover: number;
  };

  // FreeText annotation styling
  freetext_annotation: {
    /** Text color for FreeText annotations (hex format) */
    freetext_text_color: string;
    /** Text color on hover (hex format) */
    freetext_text_color_hover: string;
    /** Border color for FreeText annotation box (hex format, empty string for no border) */
    freetext_border_color: string;
    /** Border width for FreeText annotation box (0 for no border) */
    freetext_border_width: number;
    /** Background color for FreeText annotation box (hex format, empty string for transparent) */
    freetext_background_color: string;
    /** Background opacity for FreeText annotation box (0.0 to 1.0, only used if background_color is set) */
    freetext_background_opacity: number;
    /** Font weight (normal, bold, etc.) */
    freetext_font_weight: string;
    /** Font style (normal, italic, etc.) */
    freetext_font_style: string;
    /** Text decoration (none, underline, line-through, etc.) */
    freetext_text_decoration: string;
    /** Horizontal padding inside the annotation box (left and right) in pixels */
    freetext_padding_horizontal: number;
    /** Vertical padding inside the annotation box (top and bottom) in pixels */
    freetext_padding_vertical: number;
  };

  // Page styling
  page_styling: {
    /** Border color for PDF pages (hex format) */
    page_border_color: string;
    /** Box shadow CSS value for PDF pages */
    page_box_shadow: string;
    /** Background color for PDF pages (hex format) */
    page_background_color: string;
  };

  // Viewer styling
  viewer: {
    /** Background color for PDF viewer area (hex format) */
    viewer_background_color: string;
    /** Whether to append timestamp to annotated text edits (default: false) */
    /** When enabled, appends a newline followed by timestamp in format [YYYY-MM-DD h:mmam/pm] */
    append_timestamp_to_text_edits: boolean;
    /** Fixed text to add in square brackets before timestamp (default: empty) */
    /** If provided and timestamp is enabled, format will be: text\n[fixed_text] [timestamp] */
    annotation_text_suffix_fixed_text: string;
    /** Whether to add enclosing brackets (default: true) */
    add_enclosing_brackets_to_suffixes: boolean;
    /** Enclosing bracket pair for suffixes (default: "[]", must be 2 characters) */
    suffix_enclosing_brackets: string;
    /** Placement of suffix text relative to input text (default: below_multi_line) */
    /** Valid values: "adjacent", "below_single_line", "below_multi_line" */
    suffix_text_position: 'adjacent' | 'below_single_line' | 'below_multi_line';
  };

  // Context menu styling
  context_menu: {
    /** Background color for context menu (hex format) */
    context_menu_background_color: string;
    /** Border color for context menu (hex format) */
    context_menu_border_color: string;
    /** Background color for context menu item on hover (hex format) */
    context_menu_item_hover_background: string;
    /** Opacity for disabled context menu items (0.0 to 1.0) */
    context_menu_item_disabled_opacity: number;
    /** Custom stamps for right-click menu (JSON array string) */
    /** Each stamp has: name, text, order, time_stamp_suffix_enabled (default false), fixed_text_suffix_enabled (default false) */
    /** Example: '[{"name":"Verified","text":"XXX","order":1,"time_stamp_suffix_enabled":true,"fixed_text_suffix_enabled":true}]' */
    right_click_custom_stamps: string;
  };

  // Dialog styling
  dialog: {
    /** Opacity for dialog backdrop (0.0 to 1.0) */
    dialog_backdrop_opacity: number;
    /** Background color for dialog (hex format) */
    dialog_background_color: string;
    /** Border color for dialog (hex format) */
    dialog_border_color: string;
    /** Submit button color (hex format) */
    dialog_button_submit_color: string;
    /** Submit button color on hover (hex format) */
    dialog_button_submit_color_hover: string;
    /** Cancel button color (hex format) */
    dialog_button_cancel_color: string;
    /** Cancel button color on hover (hex format) */
    dialog_button_cancel_color_hover: string;
    /** Opacity for disabled dialog buttons (0.0 to 1.0) */
    dialog_button_disabled_opacity: number;
  };
}
