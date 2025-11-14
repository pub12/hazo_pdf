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
  /** PDF document proxy */
  pdf_document: PDFDocumentProxy;
  
  /** Initial zoom level */
  scale: number;
  
  /** Existing annotations */
  annotations?: PdfAnnotation[];
  
  /** Current annotation tool */
  current_tool?: 'Square' | 'Highlight' | 'FreeText' | 'CustomBookmark' | null;
  
  /** Callback when annotation is created */
  on_annotation_create?: (annotation: PdfAnnotation) => void;
  
  /** Callback when right-click occurs - provides mapper for coordinate conversion */
  on_context_menu?: (
    event: React.MouseEvent,
    page_index: number,
    screen_x: number,
    screen_y: number,
    mapper: CoordinateMapper
  ) => void;
  
  /** Background color for areas outside PDF pages */
  background_color?: string;
  
  /** Configuration object for styling */
  config?: PdfViewerConfig | null;
  
  /** Optional class name */
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

  // Load all pages from the PDF document
  useEffect(() => {
    if (!pdf_document) {
      console.log('[PdfViewerLayout] No PDF document provided');
      return;
    }

    console.log('[PdfViewerLayout] Loading pages from PDF document, total pages:', pdf_document.numPages);
    setLoading(true);
    const num_pages = pdf_document.numPages;
    const page_promises: Promise<PDFPageProxy>[] = [];

    for (let i = 1; i <= num_pages; i++) {
      page_promises.push(pdf_document.getPage(i));
    }

    Promise.all(page_promises)
      .then((loaded_pages) => {
        console.log('[PdfViewerLayout] Successfully loaded', loaded_pages.length, 'pages');
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
          console.log(`[PdfViewerLayout] Centered horizontal scroll: scrollWidth=${scroll_width}, clientWidth=${client_width}, scrollLeft=${center_scroll.toFixed(1)}`);
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
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        backgroundColor: background_color,
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

              {/* Annotation Overlay */}
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

