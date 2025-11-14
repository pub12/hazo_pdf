/**
 * PDF Page Renderer Component
 * Renders a single PDF page to a canvas element
 * Provides coordinate mapping utilities for annotations
 */

import React, { useRef, useEffect, useMemo } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { create_coordinate_mapper } from '../../utils/coordinate_mapper';
import type { CoordinateMapper, PageDimensions, PdfViewerConfig } from '../../types';
import { default_config } from '../../config/default_config';
import { cn } from '../../utils/cn';

/**
 * Props for PDFPageRenderer component
 */
export interface PdfPageRendererProps {
  /** PDF page proxy object */
  page: PDFPageProxy;
  
  /** Zero-based page index */
  page_index: number;
  
  /** Zoom/scale factor */
  scale: number;
  
  /** Optional class name */
  className?: string;
  
  /** Callback to provide coordinate mapper to parent */
  on_coordinate_mapper_ready?: (mapper: CoordinateMapper, dimensions: PageDimensions) => void;
  
  /** Configuration object for styling */
  config?: PdfViewerConfig | null;
}

/**
 * PDF Page Renderer Component
 * Handles rendering of a single PDF page to canvas
 */
export const PdfPageRenderer: React.FC<PdfPageRendererProps> = ({
  page,
  page_index,
  scale,
  className = '',
  on_coordinate_mapper_ready,
  config = null,
}) => {
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const render_task_ref = useRef<any>(null);
  const notified_dimensions_ref = useRef<{ width: number; height: number; scale: number } | null>(null);
  const callback_ref = useRef(on_coordinate_mapper_ready);
  
  // Update callback ref when it changes (but don't trigger re-render)
  useEffect(() => {
    callback_ref.current = on_coordinate_mapper_ready;
  }, [on_coordinate_mapper_ready]);
  
  // Calculate dimensions from viewport (doesn't change unless page or scale changes)
  const viewport_dimensions = useMemo(() => {
    if (!page) return { width: 0, height: 0 };
    const viewport = page.getViewport({ scale });
    return {
      width: viewport.width,
      height: viewport.height,
    };
  }, [page, scale]);

  // Create coordinate mapper - memoized to prevent recreation
  const coordinate_mapper = useMemo(() => {
    if (!page) return null;
    return create_coordinate_mapper(page, scale);
  }, [page, scale]);

  // Notify parent of coordinate mapper - only when dimensions actually change
  useEffect(() => {
    if (!page || !coordinate_mapper) return;
    
    const current_dimensions = viewport_dimensions;
    const last_notified = notified_dimensions_ref.current;
    
    // Only notify if dimensions or scale have actually changed
    if (!last_notified || 
        last_notified.width !== current_dimensions.width || 
        last_notified.height !== current_dimensions.height ||
        last_notified.scale !== scale) {
      if (callback_ref.current) {
        callback_ref.current(coordinate_mapper, current_dimensions);
        notified_dimensions_ref.current = { ...current_dimensions, scale };
      }
    }
  }, [page, coordinate_mapper, viewport_dimensions.width, viewport_dimensions.height, scale]);

  // Render the page onto the canvas
  useEffect(() => {
    if (!page) {
      return;
    }

    if (!canvas_ref.current) {
      return;
    }

    // Cancel any previous render task
    if (render_task_ref.current) {
      render_task_ref.current.cancel();
    }

    // Get the viewport with the current scale
    const viewport = page.getViewport({ scale });

    // Set up canvas
    const canvas = canvas_ref.current;
    const context = canvas.getContext('2d');
    if (!context) {
      console.error(`[PdfPageRenderer] Page ${page_index}: Cannot get 2D context`);
      return;
    }

    // Handle high DPI displays
    const output_scale = window.devicePixelRatio || 1;

    // Set native canvas size for sharp rendering
    // Note: Setting canvas.width/height automatically clears the canvas
    canvas.width = viewport.width * output_scale;
    canvas.height = viewport.height * output_scale;

    // Set CSS size (what the browser displays)
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    // Scale the context to match device pixel ratio
    context.scale(output_scale, output_scale);

    // Render the page
    const render_context = {
      canvasContext: context,
      viewport: viewport,
    };

    const render_task = page.render(render_context);
    render_task_ref.current = render_task;

    render_task.promise
      .then(() => {
        render_task_ref.current = null;
      })
      .catch((error) => {
        console.error(`[PdfPageRenderer] Page ${page_index}: Error rendering:`, error);
        render_task_ref.current = null;
      });

    // Cleanup: cancel rendering if component unmounts or dependencies change
    return () => {
      if (render_task_ref.current) {
        render_task_ref.current.cancel();
        render_task_ref.current = null;
      }
    };
  }, [page, scale, page_index]);

  // Show loading only if we don't have a page yet
  if (!page) {
    return (
      <div className={cn('cls_pdf_page_loading', className)}>
        <div className="cls_pdf_page_spinner">Loading page...</div>
      </div>
    );
  }

  // Get styling values from config or use defaults
  const page_config = config?.page_styling || default_config.page_styling;
  
  return (
    <div
      className={cn('cls_pdf_page_container', className)}
      style={{
        position: 'relative',
        width: viewport_dimensions.width,
        height: viewport_dimensions.height,
        margin: '0 auto',
        border: `1px solid ${page_config.page_border_color}`,
        boxShadow: page_config.page_box_shadow,
        backgroundColor: page_config.page_background_color,
      }}
    >
      {/* Canvas: The PDF rendering base layer */}
      <canvas
        ref={canvas_ref}
        className="cls_pdf_page_canvas"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // Allow events to pass through to SVG overlay
        }}
        aria-label={`PDF page ${page_index + 1}`}
      />
    </div>
  );
};

export default PdfPageRenderer;

