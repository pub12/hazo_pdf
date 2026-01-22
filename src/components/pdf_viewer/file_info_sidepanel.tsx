/**
 * File Info Sidepanel Component
 * Displays combined file information:
 * - Extracted metadata (from LLM extraction)
 * - File system info (from hazo_files package)
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { FileMetadataInput } from '../../types';
import { cn } from '../../utils/cn';

/**
 * FileSystemItem interface matching hazo_files
 */
interface FileSystemItem {
  name: string;
  path: string;
  is_directory: boolean;
  size?: number;
  modified?: Date;
  created?: Date;
  extension?: string;
  mime_type?: string;
}

/**
 * Props for FileInfoSidepanel component
 */
export interface FileInfoSidepanelProps {
  /** Whether the panel is open */
  is_open: boolean;
  /** Callback to toggle panel open/closed */
  on_toggle: () => void;
  /** File item to display info for */
  item: FileSystemItem | null;
  /** Current width of the panel */
  width: number;
  /** Callback when panel width changes */
  on_width_change: (width: number) => void;
  /** Optional file metadata (extraction data) */
  file_metadata?: FileMetadataInput;
  /** Current filename to match against metadata */
  current_filename?: string;
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
 * File Info Sidepanel Component
 * Combines extracted metadata with file system info
 */
export const FileInfoSidepanel: React.FC<FileInfoSidepanelProps> = ({
  is_open,
  on_toggle,
  item,
  width,
  on_width_change,
  file_metadata,
  current_filename,
}) => {
  const [expanded_tables, setExpandedTables] = useState<Set<string>>(new Set());
  const resize_ref = useRef<HTMLDivElement>(null);
  const is_resizing_ref = useRef(false);
  const start_width_ref = useRef(0);
  const start_x_ref = useRef(0);

  // Find metadata matching current filename
  const filename = current_filename || item?.name || '';
  const current_metadata = file_metadata?.find(
    (meta) => meta.filename === filename
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

  // Separate extracted fields into simple values and tables
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

  const has_extracted_data = simple_fields.length > 0 || table_fields.length > 0;
  const has_file_info = item !== null;

  return (
    <>
      {/* Toggle button on right edge when closed */}
      {!is_open && (
        <button
          type="button"
          onClick={on_toggle}
          className="cls_file_info_sidepanel_toggle_edge"
          aria-label="Open file info panel"
          title="Open file info panel"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Sidepanel */}
      <div
        className={cn('cls_file_info_sidepanel', is_open && 'cls_file_info_sidepanel_open')}
        style={{ width: is_open ? `${width}px` : '0', display: is_open ? 'flex' : 'none' }}
      >
        {/* Resize handle */}
        {is_open && (
          <div
            ref={resize_ref}
            className="cls_file_info_sidepanel_resize_handle"
            onMouseDown={handle_resize_start}
            aria-label="Resize panel"
          />
        )}

        {/* Panel content */}
        <div className="cls_file_info_sidepanel_content">
          {/* Header with close button */}
          <div className="cls_file_info_sidepanel_header">
            <span className="cls_file_info_sidepanel_title">File Info</span>
            <button
              type="button"
              onClick={on_toggle}
              className="cls_file_info_sidepanel_close"
              aria-label="Close file info panel"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="cls_file_info_sidepanel_body">
            {/* Extracted Metadata Section */}
            {has_extracted_data && (
              <div className="cls_file_info_extracted_section">
                <div className="cls_file_info_section_header">Extracted Data</div>

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

                      {/* Table content - two column layout per row */}
                      {is_expanded && (
                        <div className="cls_file_metadata_table_content">
                          {rows.map((row, row_index) => (
                            <div key={row_index} className="cls_file_metadata_table_row">
                              <table className="cls_file_metadata_row_table">
                                <tbody>
                                  {Object.entries(row).map(([field_name, field_value]) => (
                                    <tr key={field_name} className="cls_file_metadata_row_tr">
                                      <td className="cls_file_metadata_row_label">
                                        {format_field_name(field_name)}
                                      </td>
                                      <td className="cls_file_metadata_row_value">
                                        {field_value}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Divider between sections */}
            {has_extracted_data && has_file_info && (
              <div className="cls_file_info_divider" />
            )}

            {/* File System Info Section */}
            {has_file_info && item && (
              <div className="cls_file_info_system_section">
                <div className="cls_file_info_section_header">File</div>
                <div className="cls_file_info_properties">
                  <div className="cls_file_info_property">
                    <span className="cls_file_info_property_label">Name</span>
                    <span className="cls_file_info_property_value">{item.name}</span>
                  </div>
                  <div className="cls_file_info_property">
                    <span className="cls_file_info_property_label">Path</span>
                    <span className="cls_file_info_property_value cls_file_info_path">{item.path}</span>
                  </div>
                </div>
              </div>
            )}

            {/* No data message */}
            {!has_extracted_data && !has_file_info && (
              <div className="cls_file_info_no_data">
                No file information available
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
