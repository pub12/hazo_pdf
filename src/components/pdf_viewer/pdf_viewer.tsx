/**
 * PDF Viewer Component
 * Main component for displaying and interacting with PDF documents
 * Integrates PDF rendering, annotation overlay, and layout management
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Save, Undo2, Redo2, Hand } from 'lucide-react';
import { load_pdf_document } from './pdf_worker_setup';
import { PdfViewerLayout } from './pdf_viewer_layout';
import { ContextMenu } from './context_menu';
import { TextAnnotationDialog } from './text_annotation_dialog';
import type { PdfViewerProps, PdfAnnotation, CoordinateMapper, PdfViewerConfig } from '../../types';
import { load_pdf_config, load_pdf_config_async } from '../../utils/config_loader';
import { cn } from '../../utils/cn';

/**
 * PDF Viewer Component
 * Main entry point for PDF viewing and annotation
 */
export const PdfViewer: React.FC<PdfViewerProps> = ({
  url,
  className = '',
  scale: initial_scale = 1.0,
  on_load,
  on_error,
  annotations: initial_annotations = [],
  on_annotation_create,
  on_annotation_update,
  on_annotation_delete,
  on_save,
  background_color,
  config_file,
}) => {
  const [pdf_document, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [scale, setScale] = useState(initial_scale);
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>(initial_annotations);
  // Default tool is Pan (null) for scrolling the document
  const [current_tool, setCurrentTool] = useState<'Square' | 'Highlight' | 'FreeText' | 'CustomBookmark' | null>(null);
  const [saving, setSaving] = useState(false);
  
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
          console.log(`[PdfViewer] Config loaded in browser, background_color: "${config.freetext_annotation.freetext_background_color}", opacity: ${config.freetext_annotation.freetext_background_opacity}`);
        })
        .catch(error => {
          console.warn(`[PdfViewer] Could not load config file "${config_file}", using defaults:`, error);
          config_ref.current = load_pdf_config(); // Use defaults
        });
    } else {
      // Node.js: use hazo_config (preferred method)
      config_ref.current = load_pdf_config(config_file);
      console.log(`[PdfViewer] Config loaded using hazo_config, background_color: "${config_ref.current?.freetext_annotation.freetext_background_color}", opacity: ${config_ref.current?.freetext_annotation.freetext_background_opacity}`);
    }
  }, [config_file]);
  
  // Get effective background color: prop > config > default
  const effective_background_color = background_color || 
    config_ref.current?.viewer.viewer_background_color || 
    '#2d2d2d';
  
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
  }, [url]); // Reset history when PDF URL changes

  // Load PDF document
  useEffect(() => {
    // Ensure we're in browser environment before loading PDF
    if (typeof window === 'undefined') {
      return;
    }
    
    if (!url) {
      console.warn('PdfViewer: No URL provided');
      return;
    }

    console.log('PdfViewer: Loading PDF from URL:', url);
    setLoading(true);
    setError(null);

    // Use a timeout to ensure we're fully in browser context
    // This helps with React Strict Mode and SSR hydration issues
    const load_timeout = setTimeout(() => {
      load_pdf_document(url)
        .then((document) => {
          console.log('PdfViewer: PDF loaded successfully, pages:', document.numPages);
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
  }, [url, on_load, on_error]);

  // Debug: Log mouse position on left mouse button click
  useEffect(() => {
    const handle_mouse_click = (e: MouseEvent) => {
      // Only log left mouse button clicks
      if (e.button === 0) {
        console.log(`🖱️ Mouse click: x=${e.clientX}, y=${e.clientY}`);
      }
    };

    // Add event listener to window
    window.addEventListener('mousedown', handle_mouse_click);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousedown', handle_mouse_click);
    };
  }, []);

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

  // Handle annotation update (for future use)
  // Prefixed with _ to indicate intentionally unused
  const _handle_annotation_update = (annotation: PdfAnnotation) => {
    const updated_annotations = annotations.map((ann) =>
      ann.id === annotation.id ? annotation : ann
    );
    setAnnotations(updated_annotations);
    save_to_history(updated_annotations);
    if (on_annotation_update) {
      on_annotation_update(annotation);
    }
  };

  // Handle annotation delete (for future use)
  // Prefixed with _ to indicate intentionally unused
  const _handle_annotation_delete = (annotation_id: string) => {
    const filtered_annotations = annotations.filter(
      (ann) => ann.id !== annotation_id
    );
    setAnnotations(filtered_annotations);
    save_to_history(filtered_annotations);
    if (on_annotation_delete) {
      on_annotation_delete(annotation_id);
    }
  };

  // Reference unused handlers to suppress TypeScript errors
  // These are kept for future functionality
  void _handle_annotation_update;
  void _handle_annotation_delete;

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

  // Handle save annotations to PDF
  const handle_save = async () => {
    if (annotations.length === 0) {
      console.warn('PdfViewer: No annotations to save');
      return;
    }

    if (!url) {
      console.error('PdfViewer: No PDF URL available for saving');
      return;
    }

    setSaving(true);
    try {
      // Generate output filename
      const original_filename = url.split('/').pop() || 'document.pdf';
      const filename_without_ext = original_filename.replace(/\.pdf$/i, '');
      const output_filename = `${filename_without_ext}_annotated.pdf`;

      // Import save function to get PDF bytes
      const { save_annotations_to_pdf, download_pdf } = await import('../../utils/pdf_saver');
      
      // Save annotations to PDF and get the modified bytes
      const pdf_bytes = await save_annotations_to_pdf(url, annotations, output_filename, config_ref.current);
      
      // Download the modified PDF
      download_pdf(pdf_bytes, output_filename);

      // If callback is provided, call it with the modified PDF bytes
      if (on_save) {
        on_save(pdf_bytes, output_filename);
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

  // No document
  if (!pdf_document) {
    return (
      <div className={cn('cls_pdf_viewer', className)}>
        <div className="cls_pdf_viewer_no_document">No PDF document loaded</div>
      </div>
    );
  }

  return (
    <div className={cn('cls_pdf_viewer', className)}>
      {/* Toolbar */}
      <div className="cls_pdf_viewer_toolbar">
        <div className="cls_pdf_viewer_toolbar_group">
          <button
            type="button"
            onClick={handle_zoom_out}
            className="cls_pdf_viewer_toolbar_button"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="cls_pdf_viewer_zoom_level">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handle_zoom_in}
            className="cls_pdf_viewer_toolbar_button"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={handle_zoom_reset}
            className="cls_pdf_viewer_toolbar_button"
            aria-label="Reset zoom"
          >
            Reset
          </button>
        </div>

        <div className="cls_pdf_viewer_toolbar_group">
          <button
            type="button"
            onClick={() => setCurrentTool(null)}
            className={cn(
              'cls_pdf_viewer_toolbar_button',
              !current_tool && 'cls_pdf_viewer_toolbar_button_active'
            )}
            aria-label="Pan tool (drag to scroll)"
            title="Pan tool (drag to scroll)"
          >
            <Hand className="cls_pdf_viewer_toolbar_icon" size={16} />
            <span className="cls_pdf_viewer_toolbar_button_text">Pan</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTool('Square')}
            className={cn(
              'cls_pdf_viewer_toolbar_button',
              current_tool === 'Square' && 'cls_pdf_viewer_toolbar_button_active'
            )}
            aria-label="Square annotation tool"
          >
            Square
          </button>
          <button
            type="button"
            onClick={() => setCurrentTool('Highlight')}
            className={cn(
              'cls_pdf_viewer_toolbar_button',
              current_tool === 'Highlight' && 'cls_pdf_viewer_toolbar_button_active'
            )}
            aria-label="Highlight annotation tool"
          >
            Highlight
          </button>
        </div>

        <div className="cls_pdf_viewer_toolbar_group">
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
          >
            <Undo2 className="cls_pdf_viewer_toolbar_icon" size={16} />
            <span className="cls_pdf_viewer_toolbar_button_text">Undo</span>
          </button>
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
          >
            <Redo2 className="cls_pdf_viewer_toolbar_icon" size={16} />
            <span className="cls_pdf_viewer_toolbar_button_text">Redo</span>
          </button>
        </div>

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
            title={annotations.length === 0 ? 'No annotations to save' : 'Save annotations to PDF'}
          >
            <Save className="cls_pdf_viewer_toolbar_icon" size={16} />
            <span className="cls_pdf_viewer_toolbar_button_text">
              {saving ? 'Saving...' : 'Save'}
            </span>
          </button>
        </div>
      </div>

      {/* PDF Viewer Layout */}
      <div className="cls_pdf_viewer_content">
        <PdfViewerLayout
          pdf_document={pdf_document}
          scale={scale}
          annotations={annotations}
          current_tool={current_tool}
          background_color={effective_background_color}
          config={config_ref.current}
          on_annotation_create={handle_annotation_create}
          on_context_menu={(e, page_index, screen_x, screen_y, mapper) => {
            const menu_x = e.clientX;
            const menu_y = e.clientY;
            
            console.log(`🟢 [PdfViewer] Context menu state set: page=${page_index}, x=${menu_x}, y=${menu_y}, screenX=${screen_x.toFixed(1)}, screenY=${screen_y.toFixed(1)}, valid=${isFinite(menu_x) && isFinite(menu_y)}`);
            
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
        />
      </div>

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
          on_close={() => setTextDialog(null)}
          on_submit={(text) => {
            if (!text_dialog || !text_dialog.mapper) return;
            
            // Log the original click coordinates before conversion
            console.log(`🖱️ [PdfViewer] Creating FreeText annotation: click_screen=(${text_dialog.screen_x.toFixed(1)}, ${text_dialog.screen_y.toFixed(1)}), dialog_viewport=(${text_dialog.x.toFixed(1)}, ${text_dialog.y.toFixed(1)}), page=${text_dialog.page_index}`);
            
            // Convert screen coordinates to PDF coordinates
            // This gives us the exact click position in PDF space
            const [pdf_x, pdf_y] = text_dialog.mapper.to_pdf(text_dialog.screen_x, text_dialog.screen_y);
            
            // Log PDF coordinates
            console.log(`📄 [PdfViewer] Converted to PDF coords: pdf=(${pdf_x.toFixed(1)}, ${pdf_y.toFixed(1)}), from screen=(${text_dialog.screen_x.toFixed(1)}, ${text_dialog.screen_y.toFixed(1)})`);
            
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
              contents: text,
              color: text_color,
            };
            
            console.log(`✅ [PdfViewer] Created annotation: id=${annotation.id}, rect=[${pdf_x.toFixed(1)}, ${pdf_y.toFixed(1)}, ${(pdf_x + placeholder_width).toFixed(1)}, ${(pdf_y + placeholder_height).toFixed(1)}]`);
            
            handle_annotation_create(annotation);
            setTextDialog(null);
          }}
        />
      )}
    </div>
  );
};

export default PdfViewer;

