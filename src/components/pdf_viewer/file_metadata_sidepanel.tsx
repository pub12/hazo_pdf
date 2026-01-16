/**
 * File Metadata Sidepanel Component
 * Displays flexible JSON metadata with field name/value pairs and collapsible tables
 * Matches metadata to current file by filename
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { FileMetadataInput } from '../../types';
import { cn } from '../../utils/cn';

/**
 * Props for FileMetadataSidepanel component
 */
export interface FileMetadataSidepanelProps {
  /** Whether the panel is open */
  is_open: boolean;
  /** Callback to toggle panel open/closed */
  on_toggle: () => void;
  /** Array of file metadata items */
  file_metadata: FileMetadataInput;
  /** Current filename to match against */
  current_filename: string;
  /** Current width of the panel */
  width: number;
  /** Callback when panel width changes */
  on_width_change: (width: number) => void;
}

/**
 * Format field name for display (converts snake_case to Title Case)
 */
const format_field_name = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Check if a value is a table (array of objects)
 */
const is_table = (value: unknown): value is Array<Record<string, string>> => {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object';
};

/**
 * File Metadata Sidepanel Component
 */
export const FileMetadataSidepanel: React.FC<FileMetadataSidepanelProps> = ({
  is_open,
  on_toggle,
  file_metadata,
  current_filename,
  width,
  on_width_change,
}) => {
  const [expanded_tables, setExpandedTables] = useState<Set<string>>(new Set());
  const resize_ref = useRef<HTMLDivElement>(null);
  const is_resizing_ref = useRef(false);
  const start_width_ref = useRef(0);
  const start_x_ref = useRef(0);

  // Find metadata matching current filename
  const current_metadata = file_metadata.find(
    (item) => item.filename === current_filename
  );

  // Toggle table expanded/collapsed
  const toggle_table = (table_name: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(table_name)) {
        next.delete(table_name);
      } else {
        next.add(table_name);
      }
      return next;
    });
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

    const delta_x = start_x_ref.current - e.clientX;
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

  // Separate fields into simple values and tables
  const simple_fields: Array<[string, string]> = [];
  const table_fields: Array<[string, Array<Record<string, string>>]> = [];

  if (current_metadata?.file_data) {
    for (const [key, value] of Object.entries(current_metadata.file_data)) {
      if (is_table(value)) {
        table_fields.push([key, value]);
      } else if (typeof value === 'string') {
        simple_fields.push([key, value]);
      }
    }
  }

  return (
    <>
      {/* Toggle button on right edge when closed */}
      {!is_open && (
        <button
          type="button"
          onClick={on_toggle}
          className="cls_file_metadata_sidepanel_toggle_edge"
          aria-label="Open file metadata panel"
          title="Open file metadata panel"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Sidepanel */}
      <div
        className={cn('cls_file_metadata_sidepanel', is_open && 'cls_file_metadata_sidepanel_open')}
        style={{ width: is_open ? `${width}px` : '0', display: is_open ? 'flex' : 'none' }}
      >
        {/* Resize handle */}
        {is_open && (
          <div
            ref={resize_ref}
            className="cls_file_metadata_sidepanel_resize_handle"
            onMouseDown={handle_resize_start}
            aria-label="Resize panel"
          />
        )}

        {/* Panel content */}
        <div className="cls_file_metadata_sidepanel_content">
          {/* Header with close button */}
          <div className="cls_file_metadata_sidepanel_header">
            <span className="cls_file_metadata_sidepanel_title">File Metadata</span>
            <button
              type="button"
              onClick={on_toggle}
              className="cls_file_metadata_sidepanel_close"
              aria-label="Close file metadata panel"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="cls_file_metadata_sidepanel_body">
            {!current_metadata ? (
              <div className="cls_file_metadata_no_data">
                No metadata available for this file
              </div>
            ) : (
              <>
                {/* Simple field values */}
                {simple_fields.length > 0 && (
                  <div className="cls_file_metadata_fields">
                    {simple_fields.map(([key, value]) => (
                      <div key={key} className="cls_file_metadata_field">
                        <span className="cls_file_metadata_field_label">
                          {format_field_name(key)}
                        </span>
                        <span className="cls_file_metadata_field_value">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Table sections */}
                {table_fields.map(([table_name, rows]) => {
                  const is_expanded = expanded_tables.has(table_name);

                  return (
                    <div key={table_name} className="cls_file_metadata_table_section">
                      {/* Table header (accordion toggle) */}
                      <button
                        type="button"
                        onClick={() => toggle_table(table_name)}
                        className="cls_file_metadata_table_header"
                        aria-expanded={is_expanded}
                      >
                        <span className="cls_file_metadata_table_name">
                          {format_field_name(table_name)}
                        </span>
                        <span className="cls_file_metadata_table_count">
                          ({rows.length} {rows.length === 1 ? 'item' : 'items'})
                        </span>
                        {is_expanded ? (
                          <ChevronUp className="cls_file_metadata_table_icon" size={16} />
                        ) : (
                          <ChevronDown className="cls_file_metadata_table_icon" size={16} />
                        )}
                      </button>

                      {/* Table content */}
                      {is_expanded && (
                        <div className="cls_file_metadata_table_content">
                          {rows.map((row, row_index) => (
                            <div key={row_index} className="cls_file_metadata_table_row">
                              {Object.entries(row).map(([field_name, field_value]) => (
                                <div key={field_name} className="cls_file_metadata_table_cell">
                                  <span className="cls_file_metadata_cell_label">
                                    {format_field_name(field_name)}
                                  </span>
                                  <span className="cls_file_metadata_cell_value">
                                    {field_value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
