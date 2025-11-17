/**
 * Annotation Overlay Component
 * DOM/SVG layer for handling annotation interactions
 * Positioned above the canvas layer
 */

import React, { useState, useRef } from 'react';
import type { PdfAnnotation, CoordinateMapper, PdfViewerConfig } from '../../types';
import {
  calculate_rectangle_coords,
  is_rectangle_too_small,
} from '../../utils/annotation_utils';
import { default_config } from '../../config/default_config';
import { cn } from '../../utils/cn';

/**
 * Props for AnnotationOverlay component
 */
export interface AnnotationOverlayProps {
  /** Page dimensions in screen space */
  width: number;
  height: number;
  
  /** Zero-based page index */
  page_index: number;
  
  /** Coordinate mapper for PDF ↔ Screen conversion */
  map_coords: CoordinateMapper;
  
  /** Existing annotations for this page */
  annotations?: PdfAnnotation[];
  
  /** Current annotation tool type */
  current_tool?: 'Square' | 'Highlight' | 'FreeText' | 'CustomBookmark' | null;
  
  /** Callback when annotation is created */
  on_annotation_create?: (annotation: PdfAnnotation) => void;
  
  /** Callback when right-click occurs */
  on_context_menu?: (event: React.MouseEvent, screen_x: number, screen_y: number) => void;
  
  /** Callback when annotation is clicked */
  on_annotation_click?: (annotation: PdfAnnotation, screen_x: number, screen_y: number) => void;
  
  /** Configuration object for styling */
  config?: PdfViewerConfig | null;
  
  /** Optional class name */
  className?: string;
}

/**
 * Temporary drawing box component
 * Shows visual feedback while drawing
 */
const TempDrawBox: React.FC<{
  start: { x: number; y: number } | null;
  current: { x: number; y: number } | null;
  tool_type?: string;
  config?: PdfViewerConfig | null;
}> = ({ start, current, tool_type = 'Square', config = null }) => {
  if (!start || !current) return null;

  const { x, y, width, height } = calculate_rectangle_coords(start, current);

  // Get config values or use defaults
  const highlight_config = config?.highlight_annotation || default_config.highlight_annotation;
  const square_config = config?.square_annotation || default_config.square_annotation;

  // Helper to convert hex color to rgba
  const hex_to_rgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Determine fill color and opacity based on tool type
  const get_fill_props = () => {
    switch (tool_type) {
      case 'Highlight':
        return {
          fill: hex_to_rgba(highlight_config.highlight_fill_color, highlight_config.highlight_fill_opacity),
          stroke: highlight_config.highlight_border_color,
        };
      case 'Square':
        return {
          fill: hex_to_rgba(square_config.square_fill_color, square_config.square_fill_opacity),
          stroke: square_config.square_border_color,
        };
      default:
        return {
          fill: 'rgba(0, 0, 255, 0.2)',
          stroke: '#0000FF',
        };
    }
  };

  const { fill, stroke } = get_fill_props();

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      stroke={stroke}
      strokeWidth="2"
      fill={fill}
      pointerEvents="none"
    />
  );
};

/**
 * Annotation Overlay Component
 * Handles mouse interactions for creating annotations
 */
export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  width,
  height,
  page_index,
  map_coords,
  annotations = [],
  current_tool = 'Square',
  on_annotation_create,
  on_context_menu,
  on_annotation_click,
  config = null,
  className = '',
}) => {
  const [is_drawing, setIsDrawing] = useState(false);
  const [start_point, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [current_point, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [hovered_annotation_id, setHoveredAnnotationId] = useState<string | null>(null);
  const svg_ref = useRef<SVGSVGElement>(null);

  /**
   * Emit a concise debug log whenever we dispatch an annotation click.
   * This helps confirm left-click routing without flooding the console.
   */
  const log_annotation_click = (
    annotation: PdfAnnotation,
    origin: string,
    point: { x: number; y: number }
  ) => {
    console.log(
      `🟢 [AnnotationClick] origin=${origin}, id=${annotation.id}, page=${annotation.page_index}, screen=(${point.x.toFixed(
        1
      )}, ${point.y.toFixed(1)})`
    );
  };

  // Filter annotations for this page
  const page_annotations = annotations.filter(
    (ann) => ann.page_index === page_index
  );

  // Check if a point is inside an annotation
  const is_point_in_annotation = (
    point: { x: number; y: number },
    annotation: PdfAnnotation
  ): boolean => {
    // Convert PDF coordinates to screen coordinates
    const [screen_x1, screen_y1] = map_coords.to_screen(
      annotation.rect[0],
      annotation.rect[1]
    );
    const [screen_x2, screen_y2] = map_coords.to_screen(
      annotation.rect[2],
      annotation.rect[3]
    );

    // For FreeText annotations, calculate box dimensions
    if (annotation.type === 'FreeText') {
      const fonts_config = config?.fonts || default_config.fonts;
      const freetext_config = config?.freetext_annotation || default_config.freetext_annotation;
      
      const text = annotation.contents || '';
      if (!text) return false;
      
      const font_size = fonts_config.freetext_font_size_default;
      const padding_h = freetext_config.freetext_padding_horizontal;
      const padding_v = freetext_config.freetext_padding_vertical;
      const text_width_estimate = font_size * 0.6 * text.length;
      const box_width = text_width_estimate + (padding_h * 2);
      const box_height = font_size + (padding_v * 2);
      
      const box_x = screen_x1;
      const box_y = screen_y1;
      
      // Check if point is inside the box
      return (
        point.x >= box_x &&
        point.x <= box_x + box_width &&
        point.y >= box_y &&
        point.y <= box_y + box_height
      );
    }
    
    // For rectangle annotations (Square, Highlight)
    const screen_x = Math.min(screen_x1, screen_x2);
    const screen_y = Math.min(screen_y1, screen_y2);
    const screen_width = Math.abs(screen_x2 - screen_x1);
    const screen_height = Math.abs(screen_y2 - screen_y1);
    
    // Check if point is inside the rectangle
    return (
      point.x >= screen_x &&
      point.x <= screen_x + screen_width &&
      point.y >= screen_y &&
      point.y <= screen_y + screen_height
    );
  };

  // Mouse event handlers
  const handle_mouse_down = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only handle left mouse button
    if (e.button !== 0) return;

    // Get mouse position relative to SVG
    const rect = svg_ref.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // CRITICAL: Check if clicking on an existing annotation FIRST
    // This must happen before any other mode checking (pan/drawing)
    // Annotations should be clickable in ALL modes (pan, Square, Highlight, etc.)
    // Only handle left mouse button - right-click is handled by context menu
    if (e.button === 0 && on_annotation_click) {
      for (const annotation of page_annotations) {
        if (is_point_in_annotation(point, annotation)) {
          
          // Mark event so pan handler knows an annotation was clicked
          (e.nativeEvent as any).__annotation_clicked = annotation.id;
          (e.nativeEvent as any).__annotation_click_source = 'svg_hit_test';
          
          // Stop all event propagation - prevent pan mode and drawing from starting
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation(); // Also stop immediate propagation
          // Call click handler with annotation and screen coordinates
          log_annotation_click(annotation, 'svg_hit_test', point);
          on_annotation_click(annotation, point.x, point.y);
          return;
        }
      }
    } else if (e.button !== 0) {
      // Right-click or other buttons - let context menu handler process it
      return;
    } else if (!on_annotation_click) {
      console.warn(`⚠️ [AnnotationOverlay] on_annotation_click not provided`);
    }

    // In pan mode (current_tool === null), allow panning by not capturing events
    if (!current_tool) {
      // Do not stop propagation; allow parent to handle pan
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoint(point);
  };

  const handle_mouse_move = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!is_drawing || !start_point) return;

    const rect = svg_ref.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setCurrentPoint(point);
  };

  const handle_mouse_up = (_e: React.MouseEvent<SVGSVGElement>) => {
    if (!is_drawing || !start_point || !current_point) return;

    setIsDrawing(false);

    // Calculate final rectangle
    const screen_rect = calculate_rectangle_coords(start_point, current_point);

    // Ignore tiny clicks/drags
    if (is_rectangle_too_small(screen_rect, 5)) {
      setStartPoint(null);
      setCurrentPoint(null);
      return;
    }

    // Convert screen coordinates to PDF coordinates
    const [pdf_x1, pdf_y1] = map_coords.to_pdf(screen_rect.x, screen_rect.y);
    const [pdf_x2, pdf_y2] = map_coords.to_pdf(
      screen_rect.x + screen_rect.width,
      screen_rect.y + screen_rect.height
    );

    // Create PDF rect (ensure proper ordering)
    const pdf_rect: [number, number, number, number] = [
      Math.min(pdf_x1, pdf_x2),
      Math.min(pdf_y1, pdf_y2),
      Math.max(pdf_x1, pdf_x2),
      Math.max(pdf_y1, pdf_y2),
    ];

    // Get config values for default colors
    const highlight_config = config?.highlight_annotation || default_config.highlight_annotation;
    const square_config = config?.square_annotation || default_config.square_annotation;
    
    // Create new annotation object
    const new_annotation: PdfAnnotation = {
      id: crypto.randomUUID(),
      type: current_tool || 'Square',
      page_index: page_index,
      rect: pdf_rect,
      author: 'User',
      date: new Date().toISOString(),
      contents: '',
      color: current_tool === 'Highlight' ? highlight_config.highlight_fill_color : square_config.square_fill_color,
    };

    // Notify parent component
    if (on_annotation_create) {
      on_annotation_create(new_annotation);
    }

    // Reset drawing state
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handle_mouse_leave = () => {
    // Stop drawing if mouse leaves the overlay
    if (is_drawing) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  // Handle context menu (right-click)
  const handle_context_menu = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Get mouse position relative to SVG
    const rect = svg_ref.current?.getBoundingClientRect();
    if (!rect) {
      console.warn('[AnnotationOverlay] Could not get SVG bounding rect');
      return;
    }
    
    if (!on_context_menu) {
      console.warn('[AnnotationOverlay] on_context_menu callback not provided');
      return;
    }

    // Log complete mouse position details
    const mouse_client_x = e.clientX;
    const mouse_client_y = e.clientY;
    const screen_x = e.clientX - rect.left;
    const screen_y = e.clientY - rect.top;

    // Call parent handler with event and screen coordinates
    on_context_menu(e, screen_x, screen_y);
  };

  // Render existing annotations
  const render_annotation = (annotation: PdfAnnotation) => {
    // Convert PDF coordinates to screen coordinates
    // annotation.rect format: [x1, y1, x2, y2] where (x1, y1) is top-left, (x2, y2) is bottom-right
    // In PDF coordinates: origin (0,0) is at bottom-left, Y increases upward
    // In screen coordinates: origin (0,0) is at top-left, Y increases downward
    const [screen_x1, screen_y1] = map_coords.to_screen(
      annotation.rect[0],  // Top-left X in PDF space
      annotation.rect[1]   // Top-left Y in PDF space
    );
    const [screen_x2, screen_y2] = map_coords.to_screen(
      annotation.rect[2],  // Bottom-right X in PDF space
      annotation.rect[3]   // Bottom-right Y in PDF space
    );

    // For rectangle annotations (Square, Highlight), calculate normalized screen coordinates
    // Math.min ensures we always get the top-left corner, regardless of how rect was stored
    const screen_x = Math.min(screen_x1, screen_x2);
    const screen_y = Math.min(screen_y1, screen_y2);
    const screen_width = Math.abs(screen_x2 - screen_x1);
    const screen_height = Math.abs(screen_y2 - screen_y1);
    
    // Get config values or use defaults
    const fonts_config = config?.fonts || default_config.fonts;
    const highlight_config = config?.highlight_annotation || default_config.highlight_annotation;
    const square_config = config?.square_annotation || default_config.square_annotation;
    const freetext_config = config?.freetext_annotation || default_config.freetext_annotation;
    
    // Helper to convert hex color to rgba
    const hex_to_rgba = (hex: string, opacity: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // ============================================================================
    // FreeText Annotation Rendering
    // ============================================================================
    // 
    // FreeText annotations differ from rectangle annotations (Square, Highlight) because:
    // 1. The annotation rect serves as a POSITION MARKER only (rect[0], rect[1] = click position)
    // 2. Box dimensions are calculated dynamically from text content + padding
    // 3. Positioning MUST use screen_x1/y1 directly, NOT Math.min()
    //
    // See detailed comments below for why Math.min() breaks positioning.
    //
    if (annotation.type === 'FreeText') {
      const text = annotation.contents || '';
      if (!text) return null; // Don't render if no text

      // Calculate font size - use config default, not based on annotation rect height
      // The annotation rect height is just a placeholder and shouldn't affect font size
      const font_size = fonts_config.freetext_font_size_default;
      
      // Text color priority: annotation.color > freetext_text_color (if not default) > font_foreground_color > default black
      // Only use freetext_text_color if it's explicitly set and not the default black value
      // This allows font_foreground_color to be used when freetext_text_color is not configured
      const text_color = annotation.color || 
                         (freetext_config.freetext_text_color && freetext_config.freetext_text_color !== '#000000'
                           ? freetext_config.freetext_text_color
                           : fonts_config.font_foreground_color) ||
                         '#000000';
      
      // Get padding values
      const padding_h = freetext_config.freetext_padding_horizontal;
      const padding_v = freetext_config.freetext_padding_vertical;
      
      // Measure text width - estimate based on font size and text length
      // Average character is about 0.6 * font_size wide for most fonts
      const text_width_estimate = font_size * 0.6 * text.length;
      
      // Calculate box dimensions based on text width + padding
      const box_width = text_width_estimate + (padding_h * 2);
      const box_height = font_size + (padding_v * 2);
      
      // ⚠️ CRITICAL FIX: Position must use screen_x1/screen_y1 DIRECTLY, not Math.min!
      //
      // WHY THIS MATTERS:
      // For FreeText annotations, annotation.rect[0] and annotation.rect[1] represent the EXACT
      // click position in PDF space (where the user right-clicked). When we convert these to
      // screen coordinates, we get screen_x1 and screen_y1, which is the exact click position.
      //
      // The annotation rect also has placeholder dimensions (rect[2], rect[3]) representing a
      // minimal placeholder box. When converted to screen coordinates, these become screen_x2/y2.
      //
      // COORDINATE SYSTEM DIFFERENCE:
      // - PDF coordinates: Y=0 at bottom, Y increases upward
      // - Screen coordinates: Y=0 at top, Y increases downward
      // Because of this difference, when converting the placeholder bottom-right:
      // - screen_y2 will be SMALLER than screen_y1 (higher on screen = lower Y value)
      // - Using Math.min(screen_y1, screen_y2) would incorrectly select screen_y2
      // - This creates an offset equal to the placeholder height, misaligning the border
      //
      // SOLUTION:
      // Always use screen_x1 and screen_y1 directly for FreeText annotations. These represent
      // the converted coordinates of annotation.rect[0]/rect[1], which is the exact click position.
      // Do NOT use Math.min() here - it will break positioning due to coordinate system differences.
      //
      // NOTE: For rectangle annotations (Square, Highlight), we DO use Math.min because those
      // annotations have actual meaningful dimensions, not placeholders.
      const box_x = screen_x1;
      const box_y = screen_y1;
      
      // Text position: add padding offset from box top-left
      const text_x = box_x + padding_h;
      const text_y = box_y + padding_v + font_size; // Y is baseline, so add padding_v + font_size
      
      // Determine if we need a background or border (check even if values are empty)
      // Trim whitespace and check for non-empty strings
      const border_color_trimmed = freetext_config.freetext_border_color?.trim() || '';
      const background_color_trimmed = freetext_config.freetext_background_color?.trim() || '';
      
      const has_border = freetext_config.freetext_border_width > 0 && border_color_trimmed !== '';
      const has_background = background_color_trimmed !== '';
      
      // Helper to convert hex/rgb to rgba for background
      // Supports both hex (#RRGGBB) and rgb(r, g, b) formats
      const hex_to_rgba_bg = (color_str: string, opacity: number): string => {
        if (!color_str || color_str === '') return 'transparent';
        
        // Trim whitespace from color string
        const trimmed = color_str.trim();
        
        // Handle rgb(r, g, b) format - case insensitive and flexible spacing
        // Matches: rgb(0, 54, 105), rgb(0,54,105), RGB(0, 54, 105), etc.
        const rgb_pattern = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
        const rgb_match = trimmed.match(rgb_pattern);
        if (rgb_match) {
          const r = parseInt(rgb_match[1], 10);
          const g = parseInt(rgb_match[2], 10);
          const b = parseInt(rgb_match[3], 10);
          // Validate RGB values (0-255)
          if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          }
          console.warn(`[FreeText] Invalid RGB values: r=${r}, g=${g}, b=${b} (must be 0-255)`);
          return 'transparent';
        }
        
        // Handle hex format (#RRGGBB)
        if (trimmed.startsWith('#')) {
          const hex = trimmed.slice(1).trim(); // Remove # and trim
          if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          }
          console.warn(`[FreeText] Invalid hex color format: ${trimmed}`);
          return 'transparent';
        }
        
        console.warn(`[FreeText] Unrecognized color format: ${trimmed}`);
        return 'transparent';
      };

      return (
        <g key={annotation.id}>
          {/* Background rectangle (if configured) */}
          {has_background && (
            <rect
              x={box_x}
              y={box_y}
              width={box_width}
              height={box_height}
              fill={hex_to_rgba_bg(background_color_trimmed, freetext_config.freetext_background_opacity)}
              pointerEvents="none"
            />
          )}
          
          {/* Border rectangle (if configured) */}
          {has_border && (
            <rect
              x={box_x}
              y={box_y}
              width={box_width}
              height={box_height}
              fill="none"
              stroke={border_color_trimmed}
              strokeWidth={freetext_config.freetext_border_width}
              pointerEvents="none"
            />
          )}
          
          {/* Clickable overlay for FreeText annotations */}
          <rect
            x={box_x}
            y={box_y}
            width={box_width}
            height={box_height}
            fill="transparent"
            stroke="none"
            pointerEvents="auto"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => {
              setHoveredAnnotationId(annotation.id);
              // Change SVG cursor when hovering over annotation
              if (svg_ref.current) {
                svg_ref.current.style.cursor = 'pointer';
              }
            }}
            onMouseLeave={() => {
              setHoveredAnnotationId(null);
              // Restore SVG cursor when leaving annotation
              if (svg_ref.current) {
                if (current_tool === null) {
                  svg_ref.current.style.cursor = 'inherit';
                } else {
                  svg_ref.current.style.cursor = current_tool ? 'crosshair' : 'default';
                }
              }
            }}
            onMouseDown={(e) => {
              // This handler is now the primary click detector for annotations
              if (e.button !== 0) return; // Only handle left-click
              // Mark native event for upstream listeners
              (e.nativeEvent as any).__annotation_clicked = annotation.id;
              (e.nativeEvent as any).__annotation_click_source = 'freetext_rect';
              e.stopPropagation(); // Stop event from bubbling to the SVG's onMouseDown
              e.nativeEvent.stopImmediatePropagation();

              if (on_annotation_click) {
                const rect = svg_ref.current?.getBoundingClientRect();
                if (!rect) return;
                const click_x = e.clientX - rect.left;
                const click_y = e.clientY - rect.top;
                log_annotation_click(annotation, 'freetext_rect', { x: click_x, y: click_y });
                on_annotation_click(annotation, click_x, click_y);
              }
            }}
            onClick={(e) => {
              // Also handle onClick as backup
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          
          {/* Text content - positioned with padding (always rendered, even if no border/background) */}
          <text
            x={text_x}
            y={text_y} // Y coordinate is baseline for text in SVG
            fontSize={font_size}
            fill={text_color}
            pointerEvents="none"
            style={{
              fontFamily: fonts_config.freetext_font_family,
              fontWeight: freetext_config.freetext_font_weight,
              fontStyle: freetext_config.freetext_font_style,
              textDecoration: freetext_config.freetext_text_decoration,
              userSelect: 'none',
            }}
          >
            {text}
          </text>
        </g>
      );
    }

    // Get fill properties based on annotation type for rectangle annotations
    const get_annotation_props = () => {
      switch (annotation.type) {
        case 'Highlight':
          // Use annotation color if provided, otherwise use config
          const highlight_color = annotation.color || highlight_config.highlight_fill_color;
          return {
            fill: hex_to_rgba(highlight_color, highlight_config.highlight_fill_opacity),
            stroke: highlight_config.highlight_border_color,
          };
        case 'Square':
          // Use annotation color if provided, otherwise use config
          const square_color = annotation.color || square_config.square_fill_color;
          return {
            fill: hex_to_rgba(square_color, square_config.square_fill_opacity),
            stroke: square_config.square_border_color,
          };
        default:
          return {
            fill: 'rgba(0, 0, 255, 0.2)',
            stroke: '#0000FF',
          };
      }
    };

    const { fill, stroke } = get_annotation_props();

    return (
      <g key={annotation.id}>
        {/* Clickable overlay for rectangle annotations */}
        <rect
          x={screen_x}
          y={screen_y}
          width={screen_width}
          height={screen_height}
          fill="transparent"
          stroke="none"
          pointerEvents="auto"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => {
            setHoveredAnnotationId(annotation.id);
            // Change SVG cursor when hovering over annotation
            if (svg_ref.current) {
              svg_ref.current.style.cursor = 'pointer';
            }
          }}
          onMouseLeave={() => {
            setHoveredAnnotationId(null);
            // Restore SVG cursor when leaving annotation
            if (svg_ref.current) {
              if (current_tool === null) {
                svg_ref.current.style.cursor = 'inherit';
              } else {
                svg_ref.current.style.cursor = current_tool ? 'crosshair' : 'default';
              }
            }
          }}
          onMouseDown={(e) => {
            // This handler is now the primary click detector for annotations
            if (e.button !== 0) return; // Only handle left-click
            // Mark native event for upstream listeners
            (e.nativeEvent as any).__annotation_clicked = annotation.id;
            (e.nativeEvent as any).__annotation_click_source = 'rect_overlay';
            e.stopPropagation(); // Stop event from bubbling to the SVG's onMouseDown
            e.nativeEvent.stopImmediatePropagation();

            if (on_annotation_click) {
              const rect = svg_ref.current?.getBoundingClientRect();
              if (!rect) return;
              const click_x = e.clientX - rect.left;
              const click_y = e.clientY - rect.top;
              log_annotation_click(annotation, 'rect_overlay', { x: click_x, y: click_y });
              on_annotation_click(annotation, click_x, click_y);
            }
          }}
          onClick={(e) => {
            // Also handle onClick as backup
            e.preventDefault();
            e.stopPropagation();
          }}
        />
        {/* Visual annotation rectangle */}
        <rect
          x={screen_x}
          y={screen_y}
          width={screen_width}
          height={screen_height}
          stroke={stroke}
          strokeWidth="2"
          fill={fill}
          pointerEvents="none"
        />
      </g>
    );
  };

  return (
    <svg
      ref={svg_ref}
      className={cn('cls_annotation_overlay', className)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        // Cursor will be dynamically updated by onMouseEnter/Leave on annotations
        // Default: In pan mode, inherit cursor from parent (grab/grabbing)
        // In annotation mode, show crosshair
        cursor: hovered_annotation_id 
          ? 'pointer' 
          : (current_tool === null ? 'inherit' : (current_tool ? 'crosshair' : 'default')),
        // Always allow pointer events so context menu (right-click) and annotation clicks work
        // Left-click panning is handled by returning early in handle_mouse_down
        pointerEvents: 'auto',
        zIndex: 10, // Ensure annotations are above the canvas but below dialogs
      }}
      width={width}
      height={height}
      onMouseDown={handle_mouse_down}
      onMouseMove={handle_mouse_move}
      onMouseUp={handle_mouse_up}
      onMouseLeave={(e) => {
        // Reset hover state when mouse leaves SVG entirely
        setHoveredAnnotationId(null);
        handle_mouse_leave(e);
      }}
      onContextMenu={handle_context_menu}
    >
      {/* Render existing annotations */}
      {page_annotations.map(render_annotation)}

      {/* Render temporary drawing box */}
      {is_drawing && (
        <TempDrawBox
          start={start_point}
          current={current_point}
          tool_type={current_tool || 'Square'}
          config={config}
        />
      )}
    </svg>
  );
};

export default AnnotationOverlay;

