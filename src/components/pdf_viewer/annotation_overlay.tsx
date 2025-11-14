/**
 * Annotation Overlay Component
 * DOM/SVG layer for handling annotation interactions
 * Positioned above the canvas layer
 */

import React, { useState, useRef, useEffect } from 'react';
import type { PdfAnnotation, CoordinateMapper, PageDimensions, PdfViewerConfig } from '../../types';
import {
  calculate_rectangle_coords,
  is_rectangle_too_small,
  rectangle_to_pdf_rect,
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
  config = null,
  className = '',
}) => {
  const [is_drawing, setIsDrawing] = useState(false);
  const [start_point, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [current_point, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const svg_ref = useRef<SVGSVGElement>(null);

  // Filter annotations for this page
  const page_annotations = annotations.filter(
    (ann) => ann.page_index === page_index
  );

  // Mouse event handlers
  const handle_mouse_down = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only handle left mouse button
    if (e.button !== 0) return;

    // Only draw if a tool is selected
    if (!current_tool) return;

    // Get mouse position relative to SVG
    const rect = svg_ref.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

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

  const handle_mouse_up = (e: React.MouseEvent<SVGSVGElement>) => {
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

    // Get all parent elements for hierarchy debugging
    const svg_element = svg_ref.current;
    const page_wrapper = svg_element?.parentElement?.parentElement;
    const pages_container = page_wrapper?.parentElement;
    const layout_container = pages_container?.parentElement;
    
    // Get parent bounding rects
    const page_wrapper_rect = page_wrapper?.getBoundingClientRect();
    const pages_container_rect = pages_container?.getBoundingClientRect();
    const layout_container_rect = layout_container?.getBoundingClientRect();

    // Log complete mouse position details
    const mouse_client_x = e.clientX;
    const mouse_client_y = e.clientY;
    const mouse_page_x = e.pageX;
    const mouse_page_y = e.pageY;
    const screen_x = e.clientX - rect.left;
    const screen_y = e.clientY - rect.top;
    const click_time = performance.now();

    console.log(`🔵 [AnnotationOverlay] Context menu click: page=${page_index}, clientX=${mouse_client_x}, clientY=${mouse_client_y}, screenX=${screen_x.toFixed(1)}, screenY=${screen_y.toFixed(1)}, svg_rect=(${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}, ${rect.width.toFixed(1)}x${rect.height.toFixed(1)})`);

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
    
    // Log coordinate conversion for FreeText annotations (for debugging)
    if (annotation.type === 'FreeText') {
      console.log(`🔄 [AnnotationOverlay] Converting FreeText annotation: pdf_rect=[${annotation.rect[0].toFixed(1)}, ${annotation.rect[1].toFixed(1)}, ${annotation.rect[2].toFixed(1)}, ${annotation.rect[3].toFixed(1)}], screen_coords=(${screen_x1.toFixed(1)}, ${screen_y1.toFixed(1)}) -> (${screen_x2.toFixed(1)}, ${screen_y2.toFixed(1)}), min=(${screen_x.toFixed(1)}, ${screen_y.toFixed(1)})`);
    }

    // Get config values or use defaults
    const fonts_config = config?.fonts || default_config.fonts;
    const highlight_config = config?.highlight_annotation || default_config.highlight_annotation;
    const square_config = config?.square_annotation || default_config.square_annotation;
    const freetext_config = config?.freetext_annotation || default_config.freetext_annotation;
    
    // Debug: Log config values being used for rendering
    if (annotation.type === 'FreeText' && annotation.id) {
      console.log(`[AnnotationOverlay] Config values for FreeText:`, {
        font_foreground_color: fonts_config.font_foreground_color,
        freetext_text_color: freetext_config.freetext_text_color,
        freetext_background_color: freetext_config.freetext_background_color,
        freetext_background_opacity: freetext_config.freetext_background_opacity,
        annotation_color: annotation.color,
      });
    }

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
      
      // Debug: Log config values for troubleshooting
      if (annotation.id) {
        console.log(`🎨 [FreeText] Background config: raw="${freetext_config.freetext_background_color}", trimmed="${background_color_trimmed}", has_background=${has_background}, opacity=${freetext_config.freetext_background_opacity}`);
      }
      
      // Debug: Log border/box position and dimensions
      console.log(`📦 [FreeText] Border position: top-left=(${box_x.toFixed(1)}, ${box_y.toFixed(1)}), top-right=(${(box_x + box_width).toFixed(1)}, ${box_y.toFixed(1)}), bottom-right=(${(box_x + box_width).toFixed(1)}, ${(box_y + box_height).toFixed(1)}), width=${box_width.toFixed(1)}, height=${box_height.toFixed(1)}, text_width_est=${text_width_estimate.toFixed(1)}, font_size=${font_size.toFixed(1)}, text="${text}", padding_h=${padding_h}, padding_v=${padding_v}, has_border=${has_border}, has_background=${has_background}, using_screen_x1_y1=(${screen_x1.toFixed(1)}, ${screen_y1.toFixed(1)}), screen_x2_y2=(${screen_x2.toFixed(1)}, ${screen_y2.toFixed(1)}), Math.min_result=(${screen_x.toFixed(1)}, ${screen_y.toFixed(1)})`);
      
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
      <rect
        key={annotation.id}
        x={screen_x}
        y={screen_y}
        width={screen_width}
        height={screen_height}
        stroke={stroke}
        strokeWidth="2"
        fill={fill}
        pointerEvents="none"
      />
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
        cursor: current_tool ? 'crosshair' : 'default',
        pointerEvents: 'auto',
        zIndex: 10,
      }}
      width={width}
      height={height}
      onMouseDown={handle_mouse_down}
      onMouseMove={handle_mouse_move}
      onMouseUp={handle_mouse_up}
      onMouseLeave={handle_mouse_leave}
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

