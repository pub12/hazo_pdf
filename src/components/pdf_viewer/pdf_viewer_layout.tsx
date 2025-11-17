/**
 * PDF Viewer Layout Component
 * Main layout container with scrollable viewport
 * Manages page rendering and annotation overlay
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { PDFPageProxy, PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfAnnotation, CoordinateMapper, PageDimensions, PdfViewerConfig } from '../../types';
import { PdfPageRenderer } from './pdf_page_renderer';
import { AnnotationOverlay } from './annotation_overlay';
import { cn } from '../../utils/cn';

/**
 * Props for PdfViewerLayout component
 */
export interface PdfViewerLayoutProps {
  pdf_document: PDFDocumentProxy;
  scale: number;
  annotations: PdfAnnotation[];
  current_tool: 'Square' | 'Highlight' | 'FreeText' | 'CustomBookmark' | null;
  on_annotation_create: (annotation: PdfAnnotation) => void;
  on_context_menu: (e: React.MouseEvent, page_index: number, screen_x: number, screen_y: number, mapper: CoordinateMapper) => void;
  on_annotation_click: (annotation: PdfAnnotation, screen_x: number, screen_y: number, mapper: CoordinateMapper) => void;
  background_color?: string;
  config: PdfViewerConfig | null;
  className?: string;
}

/**
 * PDF Viewer Layout Component
 * Manages page rendering and annotation overlay coordination
 */
export const PdfViewerLayout: React.FC<PdfViewerLayoutProps> = ({
  pdf_document,
  scale,
  annotations = [],
  current_tool = 'Square',
  on_annotation_create,
  on_context_menu,
  on_annotation_click,
  background_color = '#2d2d2d',
  config = null,
  className = '',
}) => {
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [coordinate_mappers, setCoordinateMappers] = useState<
    Map<number, { mapper: CoordinateMapper; dimensions: PageDimensions }>
  >(new Map());
  const container_ref = useRef<HTMLDivElement>(null);
  const has_centered_ref = useRef(false);
  
  // Pan/scroll state
  const [is_panning, setIsPanning] = useState(false);
  const pan_start_ref = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  // Load all pages from the PDF document
  useEffect(() => {
    if (!pdf_document) {
      return;
    }
    setLoading(true);
    const num_pages = pdf_document.numPages;
    const page_promises: Promise<PDFPageProxy>[] = [];

    for (let i = 1; i <= num_pages; i++) {
      page_promises.push(pdf_document.getPage(i));
    }

    Promise.all(page_promises)
      .then((loaded_pages) => {
        setPages(loaded_pages);
        setLoading(false);
        // Reset centered flag when PDF document changes
        has_centered_ref.current = false;
      })
      .catch((error) => {
        console.error('[PdfViewerLayout] Error loading PDF pages:', error);
        setLoading(false);
      });
  }, [pdf_document]);

  // Handle coordinate mapper ready callback - memoized to prevent re-renders
  const handle_coordinate_mapper_ready = useCallback((
    page_index: number,
    mapper: CoordinateMapper,
    dimensions: PageDimensions
  ) => {
    setCoordinateMappers((prev) => {
      // Check if the mapper data has actually changed to avoid unnecessary updates
      const existing = prev.get(page_index);
      if (existing && 
          existing.dimensions.width === dimensions.width && 
          existing.dimensions.height === dimensions.height) {
        // Dimensions haven't changed, don't update
        return prev;
      }
      const new_map = new Map(prev);
      new_map.set(page_index, { mapper, dimensions });
      return new_map;
    });
  }, []);

  // Center horizontal scroll when PDF first loads
  useEffect(() => {
    // Only center once when pages are loaded and we have at least one mapper
    if (loading || pages.length === 0 || coordinate_mappers.size === 0 || has_centered_ref.current) {
      return;
    }

    // Wait for next frame to ensure layout is calculated
    const timeout_id = setTimeout(() => {
      if (container_ref.current) {
        const container = container_ref.current;
        const scroll_width = container.scrollWidth;
        const client_width = container.clientWidth;
        
        // Only center if content is wider than container
        if (scroll_width > client_width) {
          const center_scroll = (scroll_width - client_width) / 2;
          container.scrollLeft = center_scroll;
          has_centered_ref.current = true;
        } else {
          // Content fits, mark as centered anyway
          has_centered_ref.current = true;
        }
      }
    }, 100); // Small delay to ensure layout is complete

    return () => {
      clearTimeout(timeout_id);
    };
  }, [loading, pages.length, coordinate_mappers.size]);

  // Pan/scroll handlers (only active when current_tool is null/pan mode)
  const handle_mouse_down = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    const native_event = e.nativeEvent as unknown as { __annotation_clicked?: string; __annotation_click_source?: string };
    if (native_event?.__annotation_clicked) {
      console.log(
        `🟢 [AnnotationClick] layout received marker id=${native_event.__annotation_clicked}, source=${native_event.__annotation_click_source || 'unknown'}`
      );
      return;
    }
    
    // Only pan when no tool is selected (pan mode)
    if (current_tool !== null) return;
    
    if (container_ref.current) {
      setIsPanning(true);
      pan_start_ref.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: container_ref.current.scrollLeft,
        scrollTop: container_ref.current.scrollTop,
      };
      e.preventDefault(); // Prevent text selection while panning
      e.stopPropagation(); // Prevent event bubbling
      container_ref.current.style.cursor = 'grabbing';
      
    }
  }, [current_tool]);

  const handle_mouse_move = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!is_panning || !pan_start_ref.current || !container_ref.current) return;
    
    // Prevent default to avoid text selection and other default behaviors
    e.preventDefault();
    
    const delta_x = pan_start_ref.current.x - e.clientX;
    const delta_y = pan_start_ref.current.y - e.clientY;
    
    // Calculate new scroll positions
    const max_scroll_left = Math.max(0, container_ref.current.scrollWidth - container_ref.current.clientWidth);
    const max_scroll_top = Math.max(0, container_ref.current.scrollHeight - container_ref.current.clientHeight);
    
    const new_scroll_left = Math.max(0, Math.min(max_scroll_left, pan_start_ref.current.scrollLeft + delta_x));
    const new_scroll_top = Math.max(0, Math.min(max_scroll_top, pan_start_ref.current.scrollTop + delta_y));
    
    // Update both horizontal and vertical scroll positions (browser will clamp these anyway)
    container_ref.current.scrollLeft = new_scroll_left;
    container_ref.current.scrollTop = new_scroll_top;
    
  }, [is_panning]);

  const handle_mouse_up = useCallback(() => {
    if (container_ref.current) {
      container_ref.current.style.cursor = current_tool === null ? 'grab' : 'default';
    }
    setIsPanning(false);
    pan_start_ref.current = null;
  }, [current_tool]);

  // Update cursor style based on current tool
  useEffect(() => {
    if (container_ref.current) {
      if (current_tool === null) {
        container_ref.current.style.cursor = is_panning ? 'grabbing' : 'grab';
      } else {
        container_ref.current.style.cursor = 'default';
      }
    }
  }, [current_tool, is_panning]);

  // Add global mouse move and up listeners for panning
  useEffect(() => {
    if (is_panning) {
      window.addEventListener('mousemove', handle_mouse_move);
      window.addEventListener('mouseup', handle_mouse_up);
      
      return () => {
        window.removeEventListener('mousemove', handle_mouse_move);
        window.removeEventListener('mouseup', handle_mouse_up);
      };
    }
    return undefined;
  }, [is_panning, handle_mouse_move, handle_mouse_up]);

  // AnnotationOverlay now handles annotation clicks directly and stamps native events.
  // The container only pans when those markers are absent, preventing accidental grab mode.

  if (loading) {
    return (
      <div className={cn('cls_pdf_viewer_loading', className)}>
        <div className="cls_pdf_viewer_spinner">Loading PDF...</div>
      </div>
    );
  }

  return (
    <div
      ref={container_ref}
      className={cn('cls_pdf_viewer_layout', className)}
      style={{
        // Don't constrain width/height - let content determine size
        // This allows container to expand beyond viewport when zoomed
        position: 'relative',
        backgroundColor: background_color,
        // Cursor is managed dynamically - default to grab in pan mode, but annotations will override
        cursor: current_tool === null ? (is_panning ? 'grabbing' : 'grab') : 'default',
        userSelect: is_panning ? 'none' : 'auto',
        // Allow both horizontal and vertical scrolling
        overflow: 'auto',
        overflowX: 'auto',
        overflowY: 'auto',
        // Container must be viewport size (100%) to create scrollable area
        // Content inside (pages_container) expands beyond this to enable scrolling
        width: '100%',
        height: '100%',
        // Don't constrain content expansion
        minWidth: 0,
        minHeight: 0,
      }}
      onMouseDown={handle_mouse_down}
      onMouseMove={(e) => {
        // Check if mouse is over an annotation overlay
        // If so, don't override cursor - let the annotation overlay manage it
        const target = e.target as HTMLElement;
        if (target.closest('svg.cls_annotation_overlay') || target.closest('rect[style*="cursor: pointer"]')) {
          // Don't override cursor - annotation overlay will handle it
          return;
        }
        
        // Update cursor for pan mode if not over annotation
        if (container_ref.current && current_tool === null && !is_panning) {
          container_ref.current.style.cursor = 'grab';
        }
      }}
    >
      <div className="cls_pdf_viewer_pages_container">
        {pages.map((page, index) => {
          const mapper_data = coordinate_mappers.get(index);
          const page_annotations = annotations?.filter(
            (ann) => ann.page_index === index
          ) || [];

          return (
            <div
              key={index}
              className="cls_pdf_viewer_page_wrapper"
              style={{
                position: 'relative',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'center',
                // Inherit cursor from parent (grab/grabbing in pan mode)
                cursor: 'inherit',
                // Ensure page wrapper doesn't constrain width
                width: 'auto',
                minWidth: 'fit-content',
              }}
            >
              {/* PDF Page Renderer */}
              <PdfPageRenderer
                page={page}
                page_index={index}
                scale={scale}
                config={config}
                on_coordinate_mapper_ready={(mapper, dimensions) =>
                  handle_coordinate_mapper_ready(index, mapper, dimensions)
                }
              />

              {/* Annotation Overlay - Must be positioned absolutely to overlay the canvas */}
              {mapper_data && (
                <AnnotationOverlay
                  width={mapper_data.dimensions.width}
                  height={mapper_data.dimensions.height}
                  page_index={index}
                  map_coords={mapper_data.mapper}
                  annotations={page_annotations}
                  current_tool={current_tool}
                  config={config}
                  on_annotation_create={on_annotation_create}
                  on_context_menu={(e, screen_x, screen_y) => {
                    if (on_context_menu && mapper_data.mapper) {
                      on_context_menu(e, index, screen_x, screen_y, mapper_data.mapper);
                    }
                  }}
                  on_annotation_click={(annotation, screen_x, screen_y) => {
                    if (on_annotation_click && mapper_data.mapper) {
                      on_annotation_click(annotation, screen_x, screen_y, mapper_data.mapper);
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PdfViewerLayout;

