/**
 * Context Menu Component
 * Displays a context menu on right-click
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Undo2, FileText } from 'lucide-react';
import type { PdfViewerConfig } from '../../types';
import { default_config } from '../../config/default_config';
import { cn } from '../../utils/cn';

/**
 * Props for ContextMenu component
 */
export interface ContextMenuProps {
  /** X position of the menu */
  x: number;
  
  /** Y position of the menu */
  y: number;
  
  /** Whether undo is available */
  can_undo?: boolean;
  
  /** Callback when undo is clicked */
  on_undo?: () => void;
  
  /** Callback when annotate is clicked */
  on_annotate?: () => void;
  
  /** Callback to close the menu */
  on_close?: () => void;
  
  /** Configuration object for styling */
  config?: PdfViewerConfig | null;
}

/**
 * Context Menu Component
 * Displays a menu with undo and annotate options
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  can_undo = false,
  on_undo,
  on_annotate,
  on_close,
  config = null,
}) => {
  const menu_ref = useRef<HTMLDivElement>(null);
  const render_count_ref = useRef(0);
  const [adjusted_position, setAdjustedPosition] = useState({ x, y });
  const props_received_time_ref = useRef(performance.now());
  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted (client-side only) before creating portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Track when props change
  useEffect(() => {
    props_received_time_ref.current = performance.now();
  }, [x, y]);

  // Adjust position once we know the menu's dimensions
  useEffect(() => {
    render_count_ref.current += 1;
    
    if (menu_ref.current && mounted) {
      const rect = menu_ref.current.getBoundingClientRect();
      
      // Calculate the actual position (accounting for any transforms or offsets)
      const actual_x = x;
      const actual_y = y;
      
      // Get parent elements for hierarchy debugging
      const menu_element = menu_ref.current;
      
      // Walk up the DOM to find all positioned ancestors
      const positioned_ancestors: Array<{ element: Element; boundingRect: DOMRect; computedStyle: CSSStyleDeclaration }> = [];
      let current: Element | null = menu_element.parentElement;
      while (current && current !== document.body && current !== document.documentElement) {
        const style = window.getComputedStyle(current);
        const position = style.position;
        if (position === 'fixed' || position === 'absolute' || position === 'relative' || position === 'sticky') {
          positioned_ancestors.push({
            element: current,
            boundingRect: current.getBoundingClientRect(),
            computedStyle: style,
          });
        }
        current = current.parentElement;
      }

      // Check for transforms in ancestors
      const parent_transforms: Array<{ element: Element; transform: string }> = [];
      let check: Element | null = menu_element.parentElement;
      while (check && check !== document.body) {
        const style = window.getComputedStyle(check);
        const transform = style.transform;
        if (transform && transform !== 'none') {
          parent_transforms.push({
            element: check,
            transform: transform,
          });
        }
        check = check.parentElement;
      }
      
      const x_offset = rect.left - x;
      const y_offset = rect.top - y;
      const position_correct = Math.abs(x_offset) < 1 && Math.abs(y_offset) < 1;
      const parent_transform_count = parent_transforms.length;
      const positioned_ancestor_count = positioned_ancestors.length;
      
      console.log(`🟡 [ContextMenu] Position debug: render=${render_count_ref.current}, expected=(${x}, ${y}), actual=(${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}), offset=(${x_offset.toFixed(1)}, ${y_offset.toFixed(1)}), correct=${position_correct}, ancestors=${positioned_ancestor_count}, transforms=${parent_transform_count}`);

      // Offset adjustment - currently disabled (set to zero)
      // If bottom-left is at mouse, adjust so top-left is at mouse
      // Check if bottom-left is close to mouse position (within 5px tolerance)
      const bottom_left_x = rect.left;
      const bottom_left_y = rect.bottom;
      const tolerance = 5;
      const offset_x = 0; // Offset disabled for now
      const offset_y = 0; // Offset disabled for now
      
      if (Math.abs(bottom_left_x - x) < tolerance && Math.abs(bottom_left_y - y) < tolerance) {
        console.log('[ContextMenu] Detected bottom-left positioning, adjusting to top-left');
        // Menu height is already known, adjust Y upward
        setAdjustedPosition({
          x: actual_x + offset_x,
          y: actual_y + offset_y - rect.height,
        });
      } else {
        // Use original position with offset (currently zero)
        setAdjustedPosition({ 
          x: actual_x + offset_x, 
          y: actual_y + offset_y 
        });
      }
    }
  }, [x, y, mounted]);

  const handle_item_click = (callback?: () => void) => {
    if (callback) {
      callback();
    }
    if (on_close) {
      on_close();
    }
  };

  console.log(`⚪ [ContextMenu] Render call: render=${render_count_ref.current}, props=(${x}, ${y}), adjusted=(${adjusted_position.x}, ${adjusted_position.y}), mounted=${mounted}`);

  // Don't render until mounted (to avoid SSR issues)
  if (!mounted) {
    return null;
  }

  // Handle mouse leave - close menu when mouse moves away
  const handle_mouse_leave = () => {
    if (on_close) {
      on_close();
    }
  };

  // Get config values or use defaults
  const menu_config = config?.context_menu || default_config.context_menu;
  
  // Render menu content
  const menu_content = (
    <div
      ref={menu_ref}
      className="cls_pdf_viewer_context_menu"
      style={{
        position: 'fixed',
        left: `${adjusted_position.x}px`,
        top: `${adjusted_position.y}px`,
        zIndex: 10000,
        backgroundColor: menu_config.context_menu_background_color,
        borderColor: menu_config.context_menu_border_color,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseLeave={handle_mouse_leave}
    >
      <div className="cls_pdf_viewer_context_menu_items">
        {/* Undo option */}
        <button
          type="button"
          onClick={() => handle_item_click(on_undo)}
          disabled={!can_undo}
          className={cn(
            'cls_pdf_viewer_context_menu_item',
            !can_undo && 'cls_pdf_viewer_context_menu_item_disabled'
          )}
          style={{
            opacity: !can_undo ? menu_config.context_menu_item_disabled_opacity : 1,
          }}
          onMouseEnter={(e) => {
            if (can_undo) {
              (e.currentTarget as HTMLElement).style.backgroundColor = menu_config.context_menu_item_hover_background;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          }}
          aria-label="Undo"
        >
          <Undo2 className="cls_pdf_viewer_context_menu_icon" size={16} />
          <span className="cls_pdf_viewer_context_menu_text">Undo</span>
        </button>

        {/* Annotate option */}
        <button
          type="button"
          onClick={() => handle_item_click(on_annotate)}
          className="cls_pdf_viewer_context_menu_item"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = menu_config.context_menu_item_hover_background;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          }}
          aria-label="Annotate"
        >
          <FileText className="cls_pdf_viewer_context_menu_icon" size={16} />
          <span className="cls_pdf_viewer_context_menu_text">Annotate</span>
        </button>
      </div>
    </div>
  );

  // CRITICAL: Use portal to render at document.body level to escape any containing blocks
  // This ensures position: fixed works relative to viewport, not Storybook containers
  return createPortal(menu_content, document.body);
};

export default ContextMenu;

