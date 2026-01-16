/**
 * PDF Viewer Component
 * Main component for displaying and interacting with PDF documents
 * Integrates PDF rendering, annotation overlay, and layout management
 */

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Save, Undo2, Redo2, PanelRight, ZoomIn, ZoomOut, RotateCcw, Square, Type, ExternalLink } from 'lucide-react';
import { load_pdf_document } from './pdf_worker_setup';
import { PdfViewerLayout } from './pdf_viewer_layout';
import { ContextMenu } from './context_menu';
import { TextAnnotationDialog } from './text_annotation_dialog';
import { MetadataSidepanel } from './metadata_sidepanel';
import { FileMetadataSidepanel } from './file_metadata_sidepanel';
import type { PdfViewerProps, PdfAnnotation, CoordinateMapper, PdfViewerConfig, CustomStamp, MetadataInput, MetadataDataItem, PdfViewerRef, HighlightOptions } from '../../types';
import { load_pdf_config, load_pdf_config_async } from '../../utils/config_loader';
import { default_config } from '../../config/default_config';
import { cn } from '../../utils/cn';
import { set_logger } from '../../utils/logger';
import { FileManager } from '../file_manager';
import type { FileItem, PopoutContext } from '../file_manager/types';

// Storage key for popout context
const POPOUT_STORAGE_KEY = 'hazo_pdf_popout';

/**
 * PDF Viewer Component
 * Main entry point for PDF viewing and annotation
 */
export const PdfViewer = forwardRef<PdfViewerRef, PdfViewerProps>(({
  url,
  className = '',
  scale: initial_scale = 1.0,
  fit_to_width = false,
  on_load,
  on_error,
  annotations: initial_annotations = [],
  on_annotation_create,
  on_annotation_update,
  on_annotation_delete,
  on_save,
  background_color,
  config_file,
  append_timestamp_to_text_edits,
  annotation_text_suffix_fixed_text,
  right_click_custom_stamps,
  sidepanel_metadata_enabled = false,
  metadata_input,
  on_metadata_change,
  file_metadata,
  // Toolbar visibility props (override config file values)
  toolbar_enabled,
  show_zoom_controls,
  show_square_button,
  show_undo_button,
  show_redo_button,
  show_save_button,
  show_metadata_button,
  show_annotate_button,
  on_close,
  // Multi-file support props
  files,
  on_file_select,
  on_file_delete,
  on_upload,
  on_files_change,
  // file_manager_display_mode is reserved for future use (dialog/standalone modes)
  enable_popout = false,
  popout_route = '/pdf-viewer',
  on_popout,
  viewer_title,
  logger,
}, ref) => {
  const [pdf_document, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [scale, setScale] = useState(initial_scale);
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>(initial_annotations);
  // Default tool is Pan (null) for scrolling the document
  const [current_tool, setCurrentTool] = useState<'Square' | 'Highlight' | 'FreeText' | 'CustomBookmark' | null>(null);
  const [saving, setSaving] = useState(false);
  // Sidepanel state (existing metadata sidepanel)
  const [sidepanel_open, setSidepanelOpen] = useState(false);
  const [sidepanel_width, setSidepanelWidth] = useState(300);

  // File metadata sidepanel state (new flexible metadata)
  const [file_metadata_sidepanel_open, setFileMetadataSidepanelOpen] = useState(false);
  const [file_metadata_sidepanel_width, setFileMetadataSidepanelWidth] = useState(300);

  // Multi-file state
  const [current_file, setCurrentFile] = useState<FileItem | null>(
    files && files.length > 0 ? files[0] : null
  );
  // Multi-file mode is enabled when files prop is provided (even if empty array)
  // This allows showing the file manager for uploads when no files exist yet
  const is_multi_file_mode = files !== undefined;

  // Get the effective URL for loading (single file mode or from current file in multi-file mode)
  const effective_url = is_multi_file_mode ? current_file?.url : url;

  // Set logger instance when provided
  useEffect(() => {
    set_logger(logger);
    if (logger) {
      logger.debug('Logger initialized for PdfViewer');
    }
  }, [logger]);

  // Content container ref for fit-to-width calculations
  const content_container_ref = useRef<HTMLDivElement>(null);

  // First page dimensions for fit-to-width calculation (at scale=1)
  const [first_page_width, setFirstPageWidth] = useState<number | null>(null);

  // Sync current_file when files prop changes
  useEffect(() => {
    if (files && files.length > 0) {
      // If current file is not in the new files array, select the first file
      if (!current_file || !files.find(f => f.id === current_file.id)) {
        setCurrentFile(files[0]);
      }
    } else {
      setCurrentFile(null);
    }
  }, [files]);

  // Handle file selection in multi-file mode
  const handle_file_select = useCallback((file: FileItem) => {
    setCurrentFile(file);
    on_file_select?.(file);
  }, [on_file_select]);

  // Load configuration from file
  const config_ref = useRef<PdfViewerConfig | null>(null);
  
  // Load config once on mount
  // Uses hazo_config in Node.js (preferred), fetch + compatible parsing in browser
  useEffect(() => {
    if (!config_file) {
      // No config file specified, use defaults
      config_ref.current = load_pdf_config();
      return;
    }
    
    // Detect environment
    const is_browser = typeof window !== 'undefined' && typeof fetch !== 'undefined';
    
    if (is_browser) {
      // Browser: use async loader (fetch + compatible parsing)
      // Note: hazo_config requires Node.js fs, so we use compatible parsing instead
      load_pdf_config_async(config_file)
        .then(config => {
          config_ref.current = config;
          console.log('[PdfViewer] Config loaded:', {
            append_timestamp_to_text_edits: config.viewer.append_timestamp_to_text_edits,
            config_object: config,
          });
        })
        .catch(error => {
          console.warn(`[PdfViewer] Could not load config file "${config_file}", using defaults:`, error);
          config_ref.current = load_pdf_config(); // Use defaults
        });
    } else {
      // Node.js: use hazo_config (preferred method)
      config_ref.current = load_pdf_config(config_file);
      console.log('[PdfViewer] Config loaded (Node.js):', {
        append_timestamp_to_text_edits: config_ref.current?.viewer.append_timestamp_to_text_edits,
      });
    }
  }, [config_file]);
  
  // Get effective background color: prop > config > default
  const effective_background_color = background_color || 
    config_ref.current?.viewer.viewer_background_color || 
    '#2d2d2d';
  
  /**
   * Format timestamp for annotation text edits
   * Returns timestamp in format YYYY-MM-DD h:mmam/pm (without brackets)
   * Brackets are added by add_suffix_text based on configuration
   * Example: 2025-11-17 2:24pm
   */
  const format_annotation_timestamp = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const am_pm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    if (hours === 0) hours = 12; // Convert 0 to 12 for 12-hour format
    
    return `${year}-${month}-${day} ${hours}:${minutes}${am_pm}`;
  };
  
  /**
   * Parse custom stamps from JSON string (prop or config)
   * @param stamps_json - JSON string array of custom stamps
   * @returns Array of CustomStamp objects, or empty array if invalid
   */
  const parse_custom_stamps = (stamps_json: string | undefined): CustomStamp[] => {
    if (!stamps_json || stamps_json.trim() === '') {
      return [];
    }
    
    try {
      const parsed = JSON.parse(stamps_json);
      if (!Array.isArray(parsed)) {
        console.warn('[PdfViewer] Custom stamps must be a JSON array');
        return [];
      }
      
      // Validate and normalize stamp objects
      return parsed
        .filter((stamp: any) => stamp && typeof stamp === 'object')
        .map((stamp: any) => ({
          name: String(stamp.name || ''),
          text: String(stamp.text || ''),
          order: typeof stamp.order === 'number' ? stamp.order : 999,
          time_stamp_suffix_enabled: Boolean(stamp.time_stamp_suffix_enabled),
          fixed_text_suffix_enabled: Boolean(stamp.fixed_text_suffix_enabled),
          // Optional styling fields
          background_color: stamp.background_color !== undefined ? String(stamp.background_color) : undefined,
          border_size: stamp.border_size !== undefined ? (typeof stamp.border_size === 'number' ? stamp.border_size : undefined) : undefined,
          font_color: stamp.font_color !== undefined ? String(stamp.font_color) : undefined,
          font_weight: stamp.font_weight !== undefined ? String(stamp.font_weight) : undefined,
          font_style: stamp.font_style !== undefined ? String(stamp.font_style) : undefined,
          font_size: stamp.font_size !== undefined ? (typeof stamp.font_size === 'number' ? stamp.font_size : undefined) : undefined,
          font_name: stamp.font_name !== undefined ? String(stamp.font_name) : undefined,
        }))
        .filter((stamp) => stamp.name && stamp.text); // Only include stamps with name and text
    } catch (error) {
      console.warn('[PdfViewer] Failed to parse custom stamps JSON:', error);
      return [];
    }
  };
  
  /**
   * Consolidated helper to append suffix text (fixed text, timestamp) with configurable formatting
   * @param text - Base text to append suffixes to
   * @param fixed_text_suffix_enabled - Whether fixed text suffix should be appended
   * @param time_stamp_suffix_enabled - Whether timestamp suffix should be appended
   * @param fixed_text - Optional fixed text to append
   * @param add_enclosing_brackets_override - Optional override for bracket usage
   * @returns Text with suffixes applied based on configuration
   */
  const add_suffix_text = (
    text: string,
    fixed_text_suffix_enabled: boolean,
    time_stamp_suffix_enabled: boolean,
    fixed_text?: string,
    add_enclosing_brackets_override?: boolean
  ): string => {
    const viewer_config = config_ref.current?.viewer;
    const add_enclosing_brackets =
      add_enclosing_brackets_override ??
      viewer_config?.add_enclosing_brackets_to_suffixes ??
      true;
    
    const suffix_enclosing_brackets = viewer_config?.suffix_enclosing_brackets || '[]';
    const suffix_text_position =
      viewer_config?.suffix_text_position || 'below_multi_line';
    
    const opening_bracket = suffix_enclosing_brackets[0] || '[';
    const closing_bracket = suffix_enclosing_brackets[1] || ']';
    
    const suffix_parts: string[] = [];
    
    if (fixed_text_suffix_enabled) {
      const trimmed_fixed_text = fixed_text?.trim();
      if (trimmed_fixed_text && trimmed_fixed_text.length > 0) {
        suffix_parts.push(
          add_enclosing_brackets
            ? `${opening_bracket}${trimmed_fixed_text}${closing_bracket}`
            : trimmed_fixed_text
        );
      }
    }
    
    if (time_stamp_suffix_enabled) {
      const timestamp = format_annotation_timestamp();
      suffix_parts.push(
        add_enclosing_brackets
          ? `${opening_bracket}${timestamp}${closing_bracket}`
          : timestamp
      );
    }
    
    if (suffix_parts.length === 0) {
      return text;
    }
    
    switch (suffix_text_position) {
      case 'adjacent': {
        if (!text) {
          return suffix_parts.join(' ');
        }
        const separator = text.endsWith(' ') ? '' : ' ';
        return `${text}${separator}${suffix_parts.join(' ')}`;
      }
      case 'below_single_line':
        return text
          ? `${text}\n${suffix_parts.join(' ')}`
          : suffix_parts.join(' ');
      case 'below_multi_line':
      default:
        return text
          ? `${text}\n${suffix_parts.join('\n')}`
          : suffix_parts.join('\n');
    }
  };

  /**
   * Format stamp text with optional timestamp and fixed text suffixes
   * Uses add_suffix_text helper for consistent formatting
   * @param stamp - Custom stamp configuration
   * @param base_text - Base text from stamp
   * @returns Formatted text with suffixes if enabled
   */
  const format_stamp_text = (stamp: CustomStamp, base_text: string): string => {
    const fixed_text_prop = annotation_text_suffix_fixed_text;
    const fixed_text_config = config_ref.current?.viewer.annotation_text_suffix_fixed_text || '';
    const fixed_text = fixed_text_prop !== undefined ? fixed_text_prop : fixed_text_config;
    return add_suffix_text(
      base_text,
      stamp.fixed_text_suffix_enabled ?? false,
      stamp.time_stamp_suffix_enabled ?? false,
      fixed_text
    );
  };
  
  /**
   * Strip auto-inserted suffix from annotation text
   * Handles configurable bracket styles and suffix positioning
   * @param text - Annotation text that may contain auto-inserted suffix
   * @returns Text with suffix removed
   */
  const strip_auto_inserted_suffix = (text: string): string => {
    const viewer_config = config_ref.current?.viewer;
    const bracket_pair = viewer_config?.suffix_enclosing_brackets || '[]';
    const add_enclosing_brackets =
      viewer_config?.add_enclosing_brackets_to_suffixes ?? true;
    const suffix_text_position =
      viewer_config?.suffix_text_position || 'below_multi_line';
    
    const opening_bracket = bracket_pair[0] || '[';
    const closing_bracket = bracket_pair[1] || ']';
    
    const escape_regexp = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const timestamp_core_pattern =
      '\\d{4}-\\d{2}-\\d{2} \\d{1,2}:\\d{2}(?:am|pm)';
    const timestamp_pattern = add_enclosing_brackets
      ? `${escape_regexp(opening_bracket)}${timestamp_core_pattern}${escape_regexp(
          closing_bracket
        )}`
      : timestamp_core_pattern;
    
    const timestamp_line_regex = new RegExp(`^${timestamp_pattern}$`);
    const timestamp_trailing_regex = new RegExp(
      `(?:[ \\t]+)?${timestamp_pattern}$`
    );
    
    const fixed_text_prop = annotation_text_suffix_fixed_text;
    const fixed_text_config = viewer_config?.annotation_text_suffix_fixed_text || '';
    const fixed_text = fixed_text_prop !== undefined ? fixed_text_prop : fixed_text_config;
    const trimmed_fixed_text = fixed_text?.trim() || '';
    const fixed_segment = trimmed_fixed_text
      ? add_enclosing_brackets
        ? `${opening_bracket}${trimmed_fixed_text}${closing_bracket}`
        : trimmed_fixed_text
      : null;
    
    const fixed_line_regex = fixed_segment
      ? new RegExp(`^${escape_regexp(fixed_segment)}$`)
      : null;
    const fixed_trailing_regex = fixed_segment
      ? new RegExp(`(?:[ \\t]+)?${escape_regexp(fixed_segment)}$`)
      : null;
    
    const remove_trailing_pattern = (
      value: string,
      pattern: RegExp | null
    ): { updated: string; removed: boolean } => {
      if (!pattern) {
        return { updated: value, removed: false };
      }
      const new_value = value.replace(pattern, '');
      return { updated: new_value, removed: new_value !== value };
    };
    
    const strip_adjacent_suffix = (value: string): string => {
      let updated = value;
      let removed_any = false;
      
      const timestamp_removal = remove_trailing_pattern(
        updated,
        timestamp_trailing_regex
      );
      updated = timestamp_removal.updated;
      removed_any ||= timestamp_removal.removed;
      
      const fixed_removal = remove_trailing_pattern(
        updated,
        fixed_trailing_regex
      );
      updated = fixed_removal.updated;
      removed_any ||= fixed_removal.removed;
      
      return removed_any ? updated.replace(/[ \\t]+$/, '') : value;
    };
    
    const strip_below_single_line_suffix = (value: string): string => {
      const last_newline_index = value.lastIndexOf('\n');
      if (last_newline_index === -1) {
        // Fallback to adjacent stripping if newline is missing
        return strip_adjacent_suffix(value);
      }
      
      const prefix = value.slice(0, last_newline_index);
      let suffix_line = value.slice(last_newline_index + 1);
      let suffix_changed = false;
      
      const timestamp_removal = remove_trailing_pattern(
        suffix_line,
        timestamp_trailing_regex
      );
      suffix_line = timestamp_removal.updated;
      suffix_changed ||= timestamp_removal.removed;
      
      const fixed_removal = remove_trailing_pattern(
        suffix_line,
        fixed_trailing_regex
      );
      suffix_line = fixed_removal.updated;
      suffix_changed ||= fixed_removal.removed;
      
      if (!suffix_changed) {
        return value;
      }
      
      if (suffix_line.trim().length === 0) {
        return prefix;
      }
      
      return `${prefix}\n${suffix_line}`;
    };
    
    const strip_below_multi_line_suffix = (value: string): string => {
      const lines = value.split('\n');
      if (lines.length === 0) {
        return value;
      }
      
      let changed = false;
      const remove_last_line_if_matches = (pattern: RegExp | null) => {
        if (!pattern || lines.length === 0) {
          return;
        }
        const last_line = lines[lines.length - 1].trim();
        if (pattern.test(last_line)) {
          lines.pop();
          changed = true;
        }
      };
      
      remove_last_line_if_matches(timestamp_line_regex);
      remove_last_line_if_matches(fixed_line_regex);
      
      return changed ? lines.join('\n') : value;
    };
    
    switch (suffix_text_position) {
      case 'adjacent':
        return strip_adjacent_suffix(text);
      case 'below_single_line':
        return strip_below_single_line_suffix(text);
      case 'below_multi_line':
      default:
        return strip_below_multi_line_suffix(text);
    }
  };
  
  /**
   * Append timestamp to annotation text if enabled
   * @param text - Original annotation text
   * @returns Text with timestamp appended (if enabled) or original text
   * Note: Checks config dynamically to handle async config loading in browser
   * If fixed text is provided, format will be: text\n[fixed_text] [timestamp]
   */
  const append_timestamp_if_enabled = (text: string): string => {
    // Check config dynamically since it loads asynchronously in browser
    // Priority: prop > config > default (false)
    const prop_value = append_timestamp_to_text_edits;
    const config_value = config_ref.current?.viewer.append_timestamp_to_text_edits;
    const should_append = prop_value !== undefined
      ? prop_value
      : (config_value ?? false);
    
    // Get fixed text: prop > config > default (empty string)
    const fixed_text_prop = annotation_text_suffix_fixed_text;
    const fixed_text_config = config_ref.current?.viewer.annotation_text_suffix_fixed_text || '';
    const fixed_text = fixed_text_prop !== undefined
      ? fixed_text_prop
      : fixed_text_config;
    
    console.log('[PdfViewer] append_timestamp_if_enabled:', {
      prop_value,
      config_value,
      should_append,
      fixed_text_prop,
      fixed_text_config,
      fixed_text,
      config_loaded: !!config_ref.current,
      original_text: text,
    });
    
    if (!should_append) {
      console.log('[PdfViewer] Timestamp NOT appended (disabled)');
      return text;
    }
    
    const include_fixed_text_suffix = Boolean(fixed_text && fixed_text.trim().length > 0);
    const result = add_suffix_text(
      text,
      include_fixed_text_suffix,
      true,
      fixed_text
    );
    console.log('[PdfViewer] Timestamp appended via add_suffix_text:', {
      original: text,
      fixed_text,
      include_fixed_text_suffix,
      result,
    });
    return result;
  };
  
  // Undo/Redo history
  const [history, setHistory] = useState<PdfAnnotation[][]>([initial_annotations]);
  const [history_index, setHistoryIndex] = useState(0);
  const history_ref = useRef({ saving: false }); // Track if we're applying history to prevent loops
  
  // Context menu state
  const [context_menu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    page_index: number;
    screen_x: number;
    screen_y: number;
    mapper?: CoordinateMapper;
  } | null>(null);
  
  // Text annotation dialog state
  const [text_dialog, setTextDialog] = useState<{
    open: boolean;
    page_index: number;
    x: number; // Viewport X coordinate
    y: number; // Viewport Y coordinate
    screen_x: number;
    screen_y: number;
    mapper?: CoordinateMapper;
    editing_annotation?: PdfAnnotation; // Annotation being edited (if any)
  } | null>(null);

  // Initialize history when initial annotations change
  useEffect(() => {
    if (history.length === 1 && history[0].length === 0 && initial_annotations.length === 0) {
      // Only reset if history is empty and initial is also empty
      return;
    }
    setHistory([initial_annotations]);
    setHistoryIndex(0);
    history_ref.current.saving = false;
  }, [effective_url]); // Reset history when PDF URL changes

  // Load PDF document
  useEffect(() => {
    // Ensure we're in browser environment before loading PDF
    if (typeof window === 'undefined') {
      return;
    }

    if (!effective_url) {
      // In multi-file mode with no files, this is expected - not loading, just empty
      if (is_multi_file_mode) {
        setLoading(false);
        setPdfDocument(null);
      } else {
        console.warn('PdfViewer: No URL provided');
      }
      return;
    }

    setLoading(true);
    setError(null);

    // Use a timeout to ensure we're fully in browser context
    // This helps with React Strict Mode and SSR hydration issues
    const load_timeout = setTimeout(() => {
      load_pdf_document(effective_url)
        .then((document) => {
          setPdfDocument(document);
          setLoading(false);
          if (on_load) {
            on_load(document);
          }
        })
        .catch((err) => {
          console.error('PdfViewer: Error loading PDF:', err);
          const error_obj = err instanceof Error ? err : new Error(String(err));
          setError(error_obj);
          setLoading(false);
          if (on_error) {
            on_error(error_obj);
          }
        });
    }, 0);

    // Cleanup: cancel loading if component unmounts
    return () => {
      clearTimeout(load_timeout);
    };
  }, [effective_url, on_load, on_error, is_multi_file_mode]);

  // Get first page dimensions when PDF document loads (for fit-to-width calculation)
  useEffect(() => {
    if (!pdf_document) {
      setFirstPageWidth(null);
      return;
    }

    // Get first page to determine intrinsic width at scale=1
    pdf_document.getPage(1).then((page) => {
      const viewport = page.getViewport({ scale: 1 });
      setFirstPageWidth(viewport.width);
    }).catch((err) => {
      console.error('PdfViewer: Error getting first page dimensions:', err);
    });
  }, [pdf_document]);

  // Fit-to-width: Calculate scale based on container width and PDF page width
  useEffect(() => {
    if (!fit_to_width || !first_page_width || !content_container_ref.current) {
      return;
    }

    const calculate_fit_scale = () => {
      if (!content_container_ref.current || !first_page_width) return;

      // Get container width (subtract some padding for page margins)
      const container_width = content_container_ref.current.clientWidth;
      const padding = 40; // Account for margins/padding around the page
      const available_width = container_width - padding;

      // Calculate scale to fit PDF width to available width
      const new_scale = Math.max(0.1, Math.min(3.0, available_width / first_page_width));

      // Only update if scale changed significantly (avoid infinite loops)
      if (Math.abs(new_scale - scale) > 0.01) {
        setScale(new_scale);
      }
    };

    // Calculate initial scale
    calculate_fit_scale();

    // Set up ResizeObserver to recalculate on container resize
    const resize_observer = new ResizeObserver(() => {
      calculate_fit_scale();
    });

    resize_observer.observe(content_container_ref.current);

    return () => {
      resize_observer.disconnect();
    };
  }, [fit_to_width, first_page_width, scale]);

  // Previously logged global mouse clicks for debugging; removed for cleaner console.

  // Save to history when annotations change (but not when applying undo/redo)
  const save_to_history = (new_annotations: PdfAnnotation[]) => {
    if (history_ref.current.saving) {
      return; // Don't save to history when applying undo/redo
    }
    
    // Create new history array up to current index, then add new state
    const new_history = history.slice(0, history_index + 1);
    new_history.push(new_annotations);
    
    // Limit history to 50 states to prevent memory issues
    if (new_history.length > 50) {
      new_history.shift();
      setHistory(new_history);
      setHistoryIndex(new_history.length - 1);
    } else {
      setHistory(new_history);
      setHistoryIndex(new_history.length - 1);
    }
  };

  // Handle annotation creation
  const handle_annotation_create = (annotation: PdfAnnotation) => {
    const new_annotations = [...annotations, annotation];
    setAnnotations(new_annotations);
    save_to_history(new_annotations);
    if (on_annotation_create) {
      on_annotation_create(annotation);
    }
  };

  // Handle annotation update
  const handle_annotation_update = (annotation: PdfAnnotation) => {
    const updated_annotations = annotations.map((ann) =>
      ann.id === annotation.id ? annotation : ann
    );
    setAnnotations(updated_annotations);
    save_to_history(updated_annotations);
    if (on_annotation_update) {
      on_annotation_update(annotation);
    }
  };

  // Handle annotation delete
  const handle_annotation_delete = (annotation_id: string) => {
    const filtered_annotations = annotations.filter(
      (ann) => ann.id !== annotation_id
    );
    setAnnotations(filtered_annotations);
    save_to_history(filtered_annotations);
    if (on_annotation_delete) {
      on_annotation_delete(annotation_id);
    }
  };

  // Expose imperative methods via ref for programmatic control
  useImperativeHandle(ref, () => ({
    /**
     * Create a highlight on a specific page region
     * @param page_index - Zero-based page index
     * @param rect - Rectangle coordinates in PDF space [x1, y1, x2, y2]
     * @param options - Optional styling overrides
     * @returns The highlight annotation ID
     */
    highlight_region: (
      page_index: number,
      rect: [number, number, number, number],
      options?: HighlightOptions
    ): string => {
      const highlight_config = config_ref.current?.highlight_annotation || default_config.highlight_annotation;

      const annotation: PdfAnnotation = {
        id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'Highlight',
        page_index,
        rect,
        author: 'API',
        date: new Date().toISOString(),
        contents: '',
        color: options?.background_color || highlight_config.highlight_fill_color,
        flags: 'api_highlight', // Marker to identify API-created highlights
      };

      // Store custom options in subject field as JSON (for rendering)
      if (options) {
        annotation.subject = JSON.stringify({
          border_color: options.border_color,
          background_color: options.background_color,
          background_opacity: options.background_opacity,
        });
      }

      handle_annotation_create(annotation);
      return annotation.id;
    },

    /**
     * Remove a specific highlight by ID
     * @param id - The highlight annotation ID
     * @returns true if highlight was found and removed
     */
    remove_highlight: (id: string): boolean => {
      const annotation = annotations.find(a => a.id === id);
      if (annotation) {
        handle_annotation_delete(id);
        return true;
      }
      return false;
    },

    /**
     * Remove all highlights created via the highlight_region API
     */
    clear_all_highlights: (): void => {
      const api_highlights = annotations.filter(a => a.flags === 'api_highlight');
      api_highlights.forEach(a => handle_annotation_delete(a.id));
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [annotations, handle_annotation_create, handle_annotation_delete]);

  // Handle undo
  const handle_undo = useCallback(() => {
    if (history_index > 0) {
      history_ref.current.saving = true;
      const previous_index = history_index - 1;
      const previous_annotations = history[previous_index];
      setAnnotations([...previous_annotations]); // Create new array to trigger re-render
      setHistoryIndex(previous_index);
      setTimeout(() => {
        history_ref.current.saving = false;
      }, 0);
    }
  }, [history_index, history]);

  // Handle redo
  const handle_redo = useCallback(() => {
    if (history_index < history.length - 1) {
      history_ref.current.saving = true;
      const next_index = history_index + 1;
      const next_annotations = history[next_index];
      setAnnotations([...next_annotations]); // Create new array to trigger re-render
      setHistoryIndex(next_index);
      setTimeout(() => {
        history_ref.current.saving = false;
      }, 0);
    }
  }, [history_index, history]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handle_keydown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Check for Ctrl+Z (undo) or Cmd+Z on Mac
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handle_undo();
      }
      // Check for Ctrl+Y or Ctrl+Shift+Z (redo)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handle_redo();
      }
    };

    window.addEventListener('keydown', handle_keydown);
    return () => {
      window.removeEventListener('keydown', handle_keydown);
    };
  }, [handle_undo, handle_redo]);

  // Handle zoom controls
  const handle_zoom_in = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handle_zoom_out = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handle_zoom_reset = () => {
    setScale(1.0);
  };

  // Handle sidepanel toggle
  const handle_sidepanel_toggle = () => {
    setSidepanelOpen((prev) => !prev);
  };

  // Handle sidepanel width change
  const handle_sidepanel_width_change = (width: number) => {
    setSidepanelWidth(width);
  };

  // Handle file metadata sidepanel toggle
  const handle_file_metadata_sidepanel_toggle = () => {
    setFileMetadataSidepanelOpen((prev) => !prev);
  };

  // Handle file metadata sidepanel width change
  const handle_file_metadata_sidepanel_width_change = (width: number) => {
    setFileMetadataSidepanelWidth(width);
  };

  // Handle metadata change
  const handle_metadata_change = (updatedRow: MetadataDataItem, allData: MetadataInput) => {
    if (on_metadata_change) {
      return on_metadata_change(updatedRow, allData);
    }
    return { updatedRow, allData };
  };

  // Handle popout to new tab
  const handle_popout = useCallback(() => {
    if (!files || files.length === 0) {
      console.warn('PdfViewer: No files to popout');
      return;
    }

    // Create popout context
    const context: PopoutContext = {
      files: files,
      selected_file_id: current_file?.id || files[0].id,
      annotations_map: {},
      viewer_title: viewer_title,
    };

    // If custom handler is provided, use it
    if (on_popout) {
      on_popout(context);
      return;
    }

    // Default behavior: save to sessionStorage and open new tab
    try {
      sessionStorage.setItem(POPOUT_STORAGE_KEY, JSON.stringify(context));
      window.open(popout_route, '_blank');
    } catch (err) {
      console.error('PdfViewer: Failed to popout:', err);
    }
  }, [files, current_file, viewer_title, on_popout, popout_route]);

  // Handle save annotations to PDF
  const handle_save = async () => {
    if (annotations.length === 0) {
      console.warn('PdfViewer: No annotations to save');
      return;
    }

    if (!effective_url) {
      console.error('PdfViewer: No PDF URL available for saving');
      return;
    }

    setSaving(true);
    try {
      // Generate output filename (use current_file.name in multi-file mode)
      const original_filename = is_multi_file_mode && current_file
        ? current_file.name
        : (effective_url.split('/').pop() || 'document.pdf');
      const filename_without_ext = original_filename.replace(/\.pdf$/i, '');
      const output_filename = `${filename_without_ext}_annotated.pdf`;

      // Import save function to get PDF bytes
      const { save_annotations_to_pdf, download_pdf } = await import('../../utils/pdf_saver');

      // Save annotations to PDF and get the modified bytes
      const pdf_bytes = await save_annotations_to_pdf(effective_url, annotations, output_filename, config_ref.current);

      // If callback is provided, call it (caller handles save/download)
      // Otherwise, download the modified PDF
      if (on_save) {
        on_save(pdf_bytes, output_filename);
      } else {
        download_pdf(pdf_bytes, output_filename);
      }
    } catch (error) {
      console.error('PdfViewer: Error saving PDF:', error);
      const error_obj = error instanceof Error ? error : new Error(String(error));
      // Notify parent via error callback
      if (on_error) {
        on_error(error_obj);
      }
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('cls_pdf_viewer', 'cls_pdf_viewer_loading', className)}>
        <div className="cls_pdf_viewer_spinner">Loading PDF document...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('cls_pdf_viewer', 'cls_pdf_viewer_error', className)}>
        <div className="cls_pdf_viewer_error_message">
          Error loading PDF: {error.message}
        </div>
      </div>
    );
  }

  // No document - in multi-file mode, show file manager for uploads
  if (!pdf_document) {
    if (is_multi_file_mode) {
      // Show file manager with empty state for upload
      return (
        <div className={cn('hazo-pdf-root cls_pdf_viewer', className)}>
          <FileManager
            files={files || []}
            selected_file_id={null}
            config={config_ref.current}
            on_file_select={handle_file_select}
            on_file_delete={on_file_delete}
            on_upload={on_upload}
            on_files_change={on_files_change}
          />
          <div className="cls_pdf_viewer_empty_state">
            <div className="cls_pdf_viewer_empty_message">
              Click the + button above to upload a file
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={cn('cls_pdf_viewer', className)}>
        <div className="cls_pdf_viewer_no_document">No PDF document loaded</div>
      </div>
    );
  }

  // Get toolbar config: props override config file values
  const base_toolbar_config = config_ref.current?.toolbar || default_config.toolbar;
  const toolbar_config = {
    ...base_toolbar_config,
    // Props override config file values (undefined means use config value)
    toolbar_show_zoom_controls: show_zoom_controls ?? base_toolbar_config.toolbar_show_zoom_controls,
    toolbar_show_square_button: show_square_button ?? base_toolbar_config.toolbar_show_square_button,
    toolbar_show_undo_button: show_undo_button ?? base_toolbar_config.toolbar_show_undo_button,
    toolbar_show_redo_button: show_redo_button ?? base_toolbar_config.toolbar_show_redo_button,
    toolbar_show_save_button: show_save_button ?? base_toolbar_config.toolbar_show_save_button,
    toolbar_show_metadata_button: show_metadata_button ?? base_toolbar_config.toolbar_show_metadata_button,
    toolbar_show_annotate_button: show_annotate_button ?? base_toolbar_config.toolbar_show_annotate_button,
  };

  // Master toolbar toggle (defaults to true)
  const is_toolbar_enabled = toolbar_enabled ?? true;

  return (
    <div className={cn('hazo-pdf-root cls_pdf_viewer', className)}>
      {/* File Manager for multi-file mode */}
      {is_multi_file_mode && (
        <FileManager
          files={files}
          selected_file_id={current_file?.id || null}
          config={config_ref.current}
          on_file_select={handle_file_select}
          on_file_delete={on_file_delete}
          on_upload={on_upload}
          on_files_change={on_files_change}
        />
      )}

      {/* Toolbar */}
      {is_toolbar_enabled && (
      <div
        className="cls_pdf_viewer_toolbar"
        style={{
          backgroundColor: toolbar_config.toolbar_background_color,
          borderColor: toolbar_config.toolbar_border_color,
          fontFamily: toolbar_config.toolbar_font_family,
          fontSize: `${toolbar_config.toolbar_font_size}px`,
          color: toolbar_config.toolbar_font_color,
        }}
      >
        {/* Zoom Controls */}
        {toolbar_config.toolbar_show_zoom_controls && (
          <div className="cls_pdf_viewer_toolbar_group">
            <button
              type="button"
              onClick={handle_zoom_out}
              className="cls_pdf_viewer_toolbar_button"
              aria-label="Zoom out"
              title="Zoom out"
              style={{
                backgroundColor: toolbar_config.toolbar_button_background_color,
                color: toolbar_config.toolbar_button_text_color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color;
              }}
            >
              <ZoomOut className="cls_pdf_viewer_toolbar_icon" size={16} />
            </button>
            <span className="cls_pdf_viewer_zoom_level">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handle_zoom_in}
              className="cls_pdf_viewer_toolbar_button"
              aria-label="Zoom in"
              title="Zoom in"
              style={{
                backgroundColor: toolbar_config.toolbar_button_background_color,
                color: toolbar_config.toolbar_button_text_color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color;
              }}
            >
              <ZoomIn className="cls_pdf_viewer_toolbar_icon" size={16} />
            </button>
            <button
              type="button"
              onClick={handle_zoom_reset}
              className="cls_pdf_viewer_toolbar_button"
              aria-label="Reset zoom"
              title="Reset zoom"
              style={{
                backgroundColor: toolbar_config.toolbar_button_background_color,
                color: toolbar_config.toolbar_button_text_color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color;
              }}
            >
              <RotateCcw className="cls_pdf_viewer_toolbar_icon" size={16} />
            </button>
          </div>
        )}

        {/* Square Annotation Button */}
        {toolbar_config.toolbar_show_square_button && (
          <div className="cls_pdf_viewer_toolbar_group">
            <button
              type="button"
              onClick={() => setCurrentTool(current_tool === 'Square' ? null : 'Square')}
              className={cn(
                'cls_pdf_viewer_toolbar_button',
                current_tool === 'Square' && 'cls_pdf_viewer_toolbar_button_active'
              )}
              aria-label="Square annotation tool"
              title="Square annotation"
              style={{
                backgroundColor: current_tool === 'Square'
                  ? toolbar_config.toolbar_button_active_background_color
                  : toolbar_config.toolbar_button_background_color,
                color: current_tool === 'Square'
                  ? toolbar_config.toolbar_button_active_text_color
                  : toolbar_config.toolbar_button_text_color,
              }}
              onMouseEnter={(e) => {
                if (current_tool !== 'Square') {
                  e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
                }
              }}
              onMouseLeave={(e) => {
                if (current_tool !== 'Square') {
                  e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color;
                }
              }}
            >
              <Square className="cls_pdf_viewer_toolbar_icon" size={16} />
            </button>
          </div>
        )}

        {/* Annotate (FreeText) Button */}
        {toolbar_config.toolbar_show_annotate_button && (
          <div className="cls_pdf_viewer_toolbar_group">
            <button
              type="button"
              onClick={() => setCurrentTool(current_tool === 'FreeText' ? null : 'FreeText')}
              className={cn(
                'cls_pdf_viewer_toolbar_button',
                current_tool === 'FreeText' && 'cls_pdf_viewer_toolbar_button_active'
              )}
              aria-label="Text annotation tool"
              title="Text annotation"
              style={{
                backgroundColor: current_tool === 'FreeText'
                  ? toolbar_config.toolbar_button_active_background_color
                  : toolbar_config.toolbar_button_background_color,
                color: current_tool === 'FreeText'
                  ? toolbar_config.toolbar_button_active_text_color
                  : toolbar_config.toolbar_button_text_color,
              }}
              onMouseEnter={(e) => {
                if (current_tool !== 'FreeText') {
                  e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
                }
              }}
              onMouseLeave={(e) => {
                if (current_tool !== 'FreeText') {
                  e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color;
                }
              }}
            >
              <Type className="cls_pdf_viewer_toolbar_icon" size={16} />
            </button>
          </div>
        )}

        {/* Undo/Redo Controls */}
        {(toolbar_config.toolbar_show_undo_button || toolbar_config.toolbar_show_redo_button) && (
          <div className="cls_pdf_viewer_toolbar_group">
            {toolbar_config.toolbar_show_undo_button && (
              <button
                type="button"
                onClick={handle_undo}
                disabled={history_index === 0}
                className={cn(
                  'cls_pdf_viewer_toolbar_button',
                  history_index === 0 && 'cls_pdf_viewer_toolbar_button_disabled'
                )}
                aria-label="Undo last annotation"
                title="Undo (Ctrl+Z)"
                style={{
                  backgroundColor: toolbar_config.toolbar_button_background_color,
                  color: toolbar_config.toolbar_button_text_color,
                  opacity: history_index === 0 ? toolbar_config.toolbar_button_disabled_opacity : 1,
                }}
                onMouseEnter={(e) => {
                  if (history_index > 0) {
                    e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color;
                }}
              >
                <Undo2 className="cls_pdf_viewer_toolbar_icon" size={16} />
              </button>
            )}
            {toolbar_config.toolbar_show_redo_button && (
              <button
                type="button"
                onClick={handle_redo}
                disabled={history_index >= history.length - 1}
                className={cn(
                  'cls_pdf_viewer_toolbar_button',
                  history_index >= history.length - 1 && 'cls_pdf_viewer_toolbar_button_disabled'
                )}
                aria-label="Redo last undone annotation"
                title="Redo (Ctrl+Y)"
                style={{
                  backgroundColor: toolbar_config.toolbar_button_background_color,
                  color: toolbar_config.toolbar_button_text_color,
                  opacity: history_index >= history.length - 1 ? toolbar_config.toolbar_button_disabled_opacity : 1,
                }}
                onMouseEnter={(e) => {
                  if (history_index < history.length - 1) {
                    e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color;
                }}
              >
                <Redo2 className="cls_pdf_viewer_toolbar_icon" size={16} />
              </button>
            )}
          </div>
        )}

        {/* Save Button */}
        {toolbar_config.toolbar_show_save_button && (
          <div className="cls_pdf_viewer_toolbar_group">
            <button
              type="button"
              onClick={handle_save}
              disabled={saving || annotations.length === 0}
              className={cn(
                'cls_pdf_viewer_toolbar_button',
                'cls_pdf_viewer_toolbar_button_save',
                (saving || annotations.length === 0) && 'cls_pdf_viewer_toolbar_button_disabled'
              )}
              aria-label="Save annotations to PDF"
              title={saving ? 'Saving...' : (annotations.length === 0 ? 'No annotations to save' : 'Save annotations to PDF')}
              style={{
                backgroundColor: toolbar_config.toolbar_button_save_background_color,
                color: toolbar_config.toolbar_button_save_text_color,
                opacity: (saving || annotations.length === 0) ? toolbar_config.toolbar_button_disabled_opacity : 1,
              }}
              onMouseEnter={(e) => {
                if (!(saving || annotations.length === 0)) {
                  e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_save_background_color_hover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_save_background_color;
              }}
            >
              <Save className="cls_pdf_viewer_toolbar_icon" size={16} />
            </button>
          </div>
        )}

        {/* Sidepanel toggle button (original metadata) */}
        {sidepanel_metadata_enabled && metadata_input && toolbar_config.toolbar_show_metadata_button && (
          <div className="cls_pdf_viewer_toolbar_group">
            <button
              type="button"
              onClick={handle_sidepanel_toggle}
              className={cn(
                'cls_pdf_viewer_toolbar_button',
                sidepanel_open && 'cls_pdf_viewer_toolbar_button_active'
              )}
              aria-label="Toggle metadata panel"
              title="Toggle metadata panel"
              style={{
                backgroundColor: sidepanel_open
                  ? toolbar_config.toolbar_button_active_background_color
                  : toolbar_config.toolbar_button_background_color,
                color: sidepanel_open
                  ? toolbar_config.toolbar_button_active_text_color
                  : toolbar_config.toolbar_button_text_color,
              }}
              onMouseEnter={(e) => {
                if (!sidepanel_open) {
                  e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = sidepanel_open
                  ? toolbar_config.toolbar_button_active_background_color
                  : toolbar_config.toolbar_button_background_color;
              }}
            >
              <PanelRight className="cls_pdf_viewer_toolbar_icon" size={16} />
            </button>
          </div>
        )}

        {/* File metadata sidepanel toggle button */}
        {file_metadata && file_metadata.length > 0 && (
          <div className="cls_pdf_viewer_toolbar_group">
            <button
              type="button"
              onClick={handle_file_metadata_sidepanel_toggle}
              className={cn(
                'cls_pdf_viewer_toolbar_button',
                file_metadata_sidepanel_open && 'cls_pdf_viewer_toolbar_button_active'
              )}
              aria-label="Toggle file metadata panel"
              title="Toggle file metadata panel"
              style={{
                backgroundColor: file_metadata_sidepanel_open
                  ? toolbar_config.toolbar_button_active_background_color
                  : toolbar_config.toolbar_button_background_color,
                color: file_metadata_sidepanel_open
                  ? toolbar_config.toolbar_button_active_text_color
                  : toolbar_config.toolbar_button_text_color,
              }}
              onMouseEnter={(e) => {
                if (!file_metadata_sidepanel_open) {
                  e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = file_metadata_sidepanel_open
                  ? toolbar_config.toolbar_button_active_background_color
                  : toolbar_config.toolbar_button_background_color;
              }}
            >
              <PanelRight className="cls_pdf_viewer_toolbar_icon" size={16} />
            </button>
          </div>
        )}

        {/* Popout Button (shown in multi-file mode when enable_popout is true) */}
        {is_multi_file_mode && enable_popout && (
          <div className="cls_pdf_viewer_toolbar_group">
            <button
              type="button"
              onClick={handle_popout}
              className="cls_pdf_viewer_toolbar_button"
              aria-label="Open in new tab"
              title="Open in new tab"
              style={{
                backgroundColor: toolbar_config.toolbar_button_background_color,
                color: toolbar_config.toolbar_button_text_color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color;
              }}
            >
              <ExternalLink className="cls_pdf_viewer_toolbar_icon" size={16} />
            </button>
          </div>
        )}

        {/* Close Button (shown when on_close callback is provided) */}
        {on_close && (
          <div className="cls_pdf_viewer_toolbar_group">
            <button
              type="button"
              onClick={on_close}
              className="cls_pdf_viewer_toolbar_button"
              aria-label="Close viewer"
              style={{
                backgroundColor: toolbar_config.toolbar_button_background_color,
                color: toolbar_config.toolbar_button_text_color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color_hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = toolbar_config.toolbar_button_background_color;
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
      )}

      {/* PDF Viewer Layout with Sidepanel */}
      {(() => {
        const any_sidepanel_open = sidepanel_open || file_metadata_sidepanel_open;
        const total_sidepanel_width = (sidepanel_open ? sidepanel_width : 0) + (file_metadata_sidepanel_open ? file_metadata_sidepanel_width : 0);
        return (
      <div className={cn('cls_pdf_viewer_content_wrapper', any_sidepanel_open && 'cls_pdf_viewer_content_wrapper_with_sidepanel')}>
        <div
          ref={content_container_ref}
          className={cn('cls_pdf_viewer_content', any_sidepanel_open && 'cls_pdf_viewer_content_with_sidepanel')}
          style={any_sidepanel_open ? { width: `calc(100% - ${total_sidepanel_width}px)` } : undefined}
        >
          <PdfViewerLayout
            pdf_document={pdf_document}
            scale={scale}
            annotations={annotations}
            current_tool={current_tool}
            background_color={effective_background_color}
            config={config_ref.current}
            on_annotation_create={handle_annotation_create}
            on_annotation_click={(annotation, screen_x, screen_y, mapper) => {
              console.log(
                `🟠 [AnnotationClick] opening editor id=${annotation.id}, page=${annotation.page_index}, screen=(${screen_x.toFixed(
                  1
                )}, ${screen_y.toFixed(1)})`
              );
              const dialog_x = window.innerWidth / 2; // Center horizontally
              const dialog_y = Math.max(50, screen_y); // Position near annotation, but at least 50px from top
              
              // Open text dialog for editing
              // For FreeText annotations, show existing text
              // For other annotations, show empty dialog (they don't have text)
              setTextDialog({
                open: true,
                page_index: annotation.page_index,
                x: dialog_x,
                y: dialog_y,
                screen_x,
                screen_y,
                mapper,
                editing_annotation: annotation,
              });
            }}
            on_context_menu={(e, page_index, screen_x, screen_y, mapper) => {
              const menu_x = e.clientX;
              const menu_y = e.clientY;

              setContextMenu({
                visible: true,
                x: menu_x,
                y: menu_y,
                page_index,
                screen_x,
                screen_y,
                mapper,
              });
            }}
            on_freetext_click={(page_index, screen_x, screen_y, mapper) => {
              // Open text dialog at click position (same behavior as right-click annotate)
              setTextDialog({
                open: true,
                page_index,
                x: screen_x,
                y: screen_y,
                screen_x,
                screen_y,
                mapper,
              });
              // Deselect the FreeText tool after creating annotation
              setCurrentTool(null);
            }}
          />
        </div>

        {/* Metadata Sidepanel */}
        {sidepanel_metadata_enabled && metadata_input && (
          <MetadataSidepanel
            is_open={sidepanel_open}
            on_toggle={handle_sidepanel_toggle}
            metadata={metadata_input}
            on_change={handle_metadata_change}
            width={sidepanel_width}
            on_width_change={handle_sidepanel_width_change}
          />
        )}

        {/* File Metadata Sidepanel (flexible JSON metadata) */}
        {file_metadata && file_metadata.length > 0 && (
          <FileMetadataSidepanel
            is_open={file_metadata_sidepanel_open}
            on_toggle={handle_file_metadata_sidepanel_toggle}
            file_metadata={file_metadata}
            current_filename={current_file?.name || (url ? url.split('/').pop() || '' : '')}
            width={file_metadata_sidepanel_width}
            on_width_change={handle_file_metadata_sidepanel_width_change}
          />
        )}
      </div>
        );
      })()}

      {/* Context Menu */}
      {context_menu?.visible && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="cls_pdf_viewer_context_menu_backdrop"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <ContextMenu
            x={context_menu.x}
            y={context_menu.y}
            can_undo={history_index > 0}
            config={config_ref.current}
            custom_stamps={(() => {
              // Get stamps from prop or config (prop takes priority)
              const stamps_json = right_click_custom_stamps || config_ref.current?.context_menu.right_click_custom_stamps || '';
              return parse_custom_stamps(stamps_json);
            })()}
            on_undo={() => {
              handle_undo();
              setContextMenu(null);
            }}
            on_annotate={() => {
              setTextDialog({
                open: true,
                page_index: context_menu.page_index,
                x: context_menu.x, // Use same viewport coordinates as context menu
                y: context_menu.y,
                screen_x: context_menu.screen_x,
                screen_y: context_menu.screen_y,
                mapper: context_menu.mapper,
              });
              setContextMenu(null);
            }}
            on_stamp_click={(stamp) => {
              if (!context_menu || !context_menu.mapper) return;
              
              // Format stamp text with optional suffixes
              const formatted_text = format_stamp_text(stamp, stamp.text);
              
              // Convert screen coordinates to PDF coordinates
              const [pdf_x, pdf_y] = context_menu.mapper.to_pdf(context_menu.screen_x, context_menu.screen_y);
              
              // Get text color - use stamp font_color if provided, otherwise use config
              const fonts_config = config_ref.current?.fonts || default_config.fonts;
              const freetext_config = config_ref.current?.freetext_annotation || default_config.freetext_annotation;
              const text_color = stamp.font_color || 
                (freetext_config.freetext_text_color && freetext_config.freetext_text_color !== '#000000'
                  ? freetext_config.freetext_text_color
                  : fonts_config.font_foreground_color);
              
              // Store stamp styling in subject field as JSON for rendering
              // This allows annotation_overlay to apply stamp-specific styling
              const stamp_styling = {
                stamp_name: stamp.name,
                background_color: stamp.background_color,
                border_size: stamp.border_size,
                font_color: stamp.font_color,
                font_weight: stamp.font_weight,
                font_style: stamp.font_style,
                font_size: stamp.font_size,
                font_name: stamp.font_name,
              };
              
              // Create annotation with stamp styling stored in subject
              const annotation: PdfAnnotation = {
                id: crypto.randomUUID(),
                type: 'FreeText',
                page_index: context_menu.page_index,
                rect: [pdf_x, pdf_y, pdf_x + 10, pdf_y + 10], // Placeholder rect
                author: 'User',
                date: new Date().toISOString(),
                contents: formatted_text,
                color: text_color,
                subject: JSON.stringify(stamp_styling), // Store stamp styling metadata
              };
              
              handle_annotation_create(annotation);
              setContextMenu(null);
            }}
            on_close={() => setContextMenu(null)}
          />
        </>
      )}

      {/* Text Annotation Dialog */}
      {text_dialog && (
        <TextAnnotationDialog
          open={text_dialog.open}
          x={text_dialog.x}
          y={text_dialog.y}
          config={config_ref.current}
          initial_text={text_dialog.editing_annotation 
            ? strip_auto_inserted_suffix(text_dialog.editing_annotation.contents) 
            : ''}
          is_editing={!!text_dialog.editing_annotation}
          on_close={() => setTextDialog(null)}
          on_delete={() => {
            if (text_dialog.editing_annotation) {
              handle_annotation_delete(text_dialog.editing_annotation.id);
            }
            setTextDialog(null);
          }}
          on_submit={(text) => {
            if (!text_dialog || !text_dialog.mapper) return;
            
            // Check if we're editing an existing annotation
            if (text_dialog.editing_annotation) {
              // For editing: strip any existing suffix first, then append new suffix
              // This ensures old suffix is removed and new one is added
              const stripped_text = strip_auto_inserted_suffix(text);
              const final_text = append_timestamp_if_enabled(stripped_text);
              
              // Update existing annotation
              const updated_annotation: PdfAnnotation = {
                ...text_dialog.editing_annotation,
                contents: final_text,
                date: new Date().toISOString(), // Update modification date
              };
              
              handle_annotation_update(updated_annotation);
              setTextDialog(null);
              return;
            }
            
            // For new annotation: append timestamp if enabled
            const final_text = append_timestamp_if_enabled(text);
            
            // Create new annotation (existing code)
            // Convert screen coordinates to PDF coordinates
            // This gives us the exact click position in PDF space
            const [pdf_x, pdf_y] = text_dialog.mapper.to_pdf(text_dialog.screen_x, text_dialog.screen_y);
            
            // Create a text annotation at the clicked position
            //
            // IMPORTANT: For FreeText annotations, the annotation rect serves as a POSITION MARKER only.
            // The actual rendered box dimensions are calculated dynamically during rendering based on:
            // - Text content length
            // - Font size from config
            // - Padding values from config
            //
            // WHY PLACEHOLDER DIMENSIONS:
            // We store minimal placeholder dimensions because:
            // 1. The annotation rect format requires [x1, y1, x2, y2] coordinates
            // 2. We can't know the final text dimensions until we have the text content
            // 3. The rendering logic calculates the actual box size from text + padding
            // 4. Only rect[0] and rect[1] (top-left) matter - they mark the click position
            //
            // ⚠️ DO NOT change placeholder dimensions without updating rendering logic!
            // The rendering code in annotation_overlay.tsx uses screen_x1/y1 directly (not Math.min)
            // to avoid coordinate conversion issues. If placeholder dimensions change significantly,
            // ensure the rendering logic still correctly uses the top-left corner.
            const placeholder_width = 100; // Minimal placeholder width (not used for rendering)
            const placeholder_height = 30; // Minimal placeholder height (not used for rendering)
            
            // Get text color from config with fallback hierarchy:
            // freetext_text_color (if explicitly set) > font_foreground_color > default black
            // Only use freetext_text_color if it's not the default black value
            const freetext_text_color = config_ref.current?.freetext_annotation.freetext_text_color;
            const font_foreground_color = config_ref.current?.fonts.font_foreground_color;
            
            // Use freetext_text_color only if it's explicitly set and not the default black
            // Otherwise, fall back to font_foreground_color
            const text_color = (freetext_text_color && freetext_text_color !== '#000000') 
                              ? freetext_text_color
                              : (font_foreground_color || '#000000');
            
            // Create FreeText annotation
            // rect[0] and rect[1] = pdf_x, pdf_y: These are CRITICAL - they mark where the user clicked
            // rect[2] and rect[3] = placeholder bottom-right: These are NOT used for positioning
            // The rendering code MUST use rect[0]/rect[1] directly after conversion (see annotation_overlay.tsx)
            const annotation: PdfAnnotation = {
              id: crypto.randomUUID(),
              type: 'FreeText',
              page_index: text_dialog.page_index,
              rect: [
                pdf_x,                    // Top-left X (click position)
                pdf_y,                    // Top-left Y (click position)
                pdf_x + placeholder_width,   // Bottom-right X (placeholder)
                pdf_y + placeholder_height,  // Bottom-right Y (placeholder)
              ],
              author: 'User',
              date: new Date().toISOString(),
              contents: final_text,
              color: text_color,
            };
            
            handle_annotation_create(annotation);
            setTextDialog(null);
          }}
        />
      )}
    </div>
  );
});

// Set display name for debugging
PdfViewer.displayName = 'PdfViewer';

export default PdfViewer;

