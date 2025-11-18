/**
 * Metadata Sidepanel Component
 * Displays JSON metadata with header, data (accordions), and footer sections
 * Supports editable fields with inline editing
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Pencil, CheckCircle2, X } from 'lucide-react';
import type { MetadataInput, MetadataDataItem } from '../../types';
import { cn } from '../../utils/cn';

/**
 * Props for MetadataSidepanel component
 */
export interface MetadataSidepanelProps {
  /** Whether the panel is open */
  is_open: boolean;
  /** Callback to toggle panel open/closed */
  on_toggle: () => void;
  /** Metadata input structure */
  metadata: MetadataInput;
  /** Callback when metadata is changed via editing */
  on_change: (updatedRow: MetadataDataItem, allData: MetadataInput) => { updatedRow: MetadataDataItem; allData: MetadataInput };
  /** Current width of the panel */
  width: number;
  /** Callback when panel width changes */
  on_width_change: (width: number) => void;
}

/**
 * Format text component based on style type
 */
const FormatText: React.FC<{ style: string; children: React.ReactNode; className?: string }> = ({ style, children, className }) => {
  const baseClassName = cn('cls_metadata_text', className);
  
  switch (style) {
    case 'h1':
      return <h1 className={cn(baseClassName, 'cls_metadata_h1')}>{children}</h1>;
    case 'h2':
      return <h2 className={cn(baseClassName, 'cls_metadata_h2')}>{children}</h2>;
    case 'h3':
      return <h3 className={cn(baseClassName, 'cls_metadata_h3')}>{children}</h3>;
    case 'h4':
      return <h4 className={cn(baseClassName, 'cls_metadata_h4')}>{children}</h4>;
    case 'h5':
      return <h5 className={cn(baseClassName, 'cls_metadata_h5')}>{children}</h5>;
    case 'body':
    default:
      return <p className={cn(baseClassName, 'cls_metadata_body')}>{children}</p>;
  }
};

/**
 * Metadata Sidepanel Component
 */
export const MetadataSidepanel: React.FC<MetadataSidepanelProps> = ({
  is_open,
  on_toggle,
  metadata,
  on_change,
  width,
  on_width_change,
}) => {
  const [expanded_items, setExpandedItems] = useState<Set<number>>(new Set());
  const [editing_index, setEditingIndex] = useState<number | null>(null);
  const [edit_value, setEditValue] = useState<string>('');
  const resize_ref = useRef<HTMLDivElement>(null);
  const is_resizing_ref = useRef(false);
  const start_width_ref = useRef(0);
  const start_x_ref = useRef(0);

  // Toggle accordion item expanded/collapsed
  const toggle_item = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Start editing a field
  const start_edit = (index: number, current_value: string) => {
    setEditingIndex(index);
    setEditValue(current_value);
  };

  // Cancel editing
  const cancel_edit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  // Save edited value
  const save_edit = () => {
    if (editing_index === null) return;

    const updated_data = [...metadata.data];
    const updated_row = { ...updated_data[editing_index], value: edit_value };
    updated_data[editing_index] = updated_row;

    const updated_metadata: MetadataInput = {
      header: metadata.header,
      data: updated_data,
      footer: metadata.footer,
    };

    const result = on_change(updated_row, updated_metadata);
    setEditingIndex(null);
    setEditValue('');
  };

  // Handle resize start
  const handle_resize_start = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    is_resizing_ref.current = true;
    start_width_ref.current = width;
    start_x_ref.current = e.clientX;
    
    document.addEventListener('mousemove', handle_resize_move);
    document.addEventListener('mouseup', handle_resize_end);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle resize move
  const handle_resize_move = (e: MouseEvent) => {
    if (!is_resizing_ref.current) return;
    
    const delta_x = start_x_ref.current - e.clientX; // Reverse because we're resizing from left
    const new_width = Math.max(200, Math.min(800, start_width_ref.current + delta_x));
    on_width_change(new_width);
  };

  // Handle resize end
  const handle_resize_end = () => {
    is_resizing_ref.current = false;
    document.removeEventListener('mousemove', handle_resize_move);
    document.removeEventListener('mouseup', handle_resize_end);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Cleanup resize listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handle_resize_move);
      document.removeEventListener('mouseup', handle_resize_end);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <>
      {/* Toggle button on right edge when closed */}
      {!is_open && (
        <button
          type="button"
          onClick={on_toggle}
          className="cls_metadata_sidepanel_toggle_edge"
          aria-label="Open metadata panel"
          title="Open metadata panel"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Sidepanel */}
      <div
        className={cn('cls_metadata_sidepanel', is_open && 'cls_metadata_sidepanel_open')}
        style={{ width: is_open ? `${width}px` : '0', display: is_open ? 'flex' : 'none' }}
      >
        {/* Resize handle */}
        {is_open && (
          <div
            ref={resize_ref}
            className="cls_metadata_sidepanel_resize_handle"
            onMouseDown={handle_resize_start}
            aria-label="Resize panel"
          />
        )}

        {/* Panel content */}
        <div className="cls_metadata_sidepanel_content">
          {/* Header with close button */}
          <div className="cls_metadata_sidepanel_header">
            <span className="cls_metadata_sidepanel_title">Metadata</span>
            <button
              type="button"
              onClick={on_toggle}
              className="cls_metadata_sidepanel_close"
              aria-label="Close metadata panel"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="cls_metadata_sidepanel_body">
            {/* Header section */}
            {metadata.header && metadata.header.length > 0 && (
              <div className="cls_metadata_section cls_metadata_header_section">
                {metadata.header.map((item, index) => (
                  <FormatText key={`header-${index}`} style={item.style}>
                    {item.label}
                  </FormatText>
                ))}
              </div>
            )}

            {/* Data section (accordions) */}
            {metadata.data && metadata.data.length > 0 && (
              <div className="cls_metadata_section cls_metadata_data_section">
                {metadata.data.map((item, index) => {
                  const is_expanded = expanded_items.has(index);
                  const is_editing = editing_index === index;

                  return (
                    <div key={`data-${index}`} className="cls_metadata_accordion">
                      {/* Accordion header */}
                      <button
                        type="button"
                        onClick={() => toggle_item(index)}
                        className="cls_metadata_accordion_header"
                        aria-expanded={is_expanded}
                      >
                        <FormatText style={item.style} className="cls_metadata_accordion_label">
                          {item.label}
                        </FormatText>
                        {is_expanded ? (
                          <ChevronUp className="cls_metadata_accordion_icon" size={16} />
                        ) : (
                          <ChevronDown className="cls_metadata_accordion_icon" size={16} />
                        )}
                      </button>

                      {/* Accordion content */}
                      {is_expanded && (
                        <div className="cls_metadata_accordion_content">
                          {is_editing ? (
                            <div className="cls_metadata_edit_mode">
                              <input
                                type="text"
                                value={edit_value}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="cls_metadata_edit_input"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    save_edit();
                                  } else if (e.key === 'Escape') {
                                    cancel_edit();
                                  }
                                }}
                              />
                              <div className="cls_metadata_edit_buttons">
                                <button
                                  type="button"
                                  onClick={save_edit}
                                  className="cls_metadata_edit_save"
                                  aria-label="Save"
                                >
                                  <CheckCircle2 size={18} className="text-green-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancel_edit}
                                  className="cls_metadata_edit_cancel"
                                  aria-label="Cancel"
                                >
                                  <X size={18} className="text-red-600" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="cls_metadata_value_container">
                              <span className="cls_metadata_value">{item.value}</span>
                              {item.editable && (
                                <button
                                  type="button"
                                  onClick={() => start_edit(index, item.value)}
                                  className="cls_metadata_edit_button"
                                  aria-label="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer section */}
            {metadata.footer && metadata.footer.length > 0 && (
              <div className="cls_metadata_section cls_metadata_footer_section">
                {metadata.footer.map((item, index) => (
                  <FormatText key={`footer-${index}`} style={item.style}>
                    {item.label}
                  </FormatText>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

