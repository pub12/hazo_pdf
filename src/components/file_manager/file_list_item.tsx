/**
 * File List Item Component
 * Simple horizontal tab-style file item
 */

import React, { useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import type { FileItem } from './types';
import type { PdfViewerConfig } from '../../types/config';
import { cn } from '../../utils/cn';

export interface FileListItemProps {
  /** File to display */
  file: FileItem;
  /** Whether this file is currently selected */
  is_selected: boolean;
  /** Whether to show delete button */
  show_delete: boolean;
  /** Configuration for styling */
  config: PdfViewerConfig | null;
  /** Callback when file is selected */
  on_select: (file: FileItem) => void;
  /** Callback when delete is clicked */
  on_delete?: (file_id: string) => void;
}

/**
 * Get display name - truncate if needed
 */
function get_display_name(filename: string, max_length: number = 24): string {
  if (filename.length <= max_length) {
    return filename;
  }

  const ext_index = filename.lastIndexOf('.');
  if (ext_index === -1 || ext_index === 0) {
    return filename.substring(0, max_length - 3) + '...';
  }

  const ext = filename.substring(ext_index);
  const name = filename.substring(0, ext_index);
  const available = max_length - ext.length - 3;

  if (available <= 0) {
    return filename.substring(0, max_length - 3) + '...';
  }

  return name.substring(0, available) + '...' + ext;
}

export const FileListItem: React.FC<FileListItemProps> = ({
  file,
  is_selected,
  show_delete,
  config,
  on_select,
  on_delete,
}) => {
  const [is_hovered, setIsHovered] = useState(false);

  const file_manager_config = config?.file_manager;
  const selected_color = file_manager_config?.selected_color || '#3b82f6';

  const handle_click = () => {
    on_select(file);
  };

  const handle_delete_click = (e: React.MouseEvent) => {
    e.stopPropagation();
    on_delete?.(file.id);
  };

  const display_name = get_display_name(file.name);
  const show_close = show_delete && on_delete && (is_hovered || is_selected);

  return (
    <div
      className={cn(
        'cls_file_tab',
        is_selected && 'cls_file_tab_selected'
      )}
      data-file-id={file.id}
      style={is_selected ? {
        borderColor: selected_color,
      } : undefined}
      onClick={handle_click}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={file.name}
      role="tab"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handle_click();
        }
      }}
      aria-selected={is_selected}
      aria-label={file.name}
    >
      {file.status === 'converting' || file.status === 'uploading' ? (
        <Loader2 size={16} className="cls_file_tab_icon cls_file_tab_spinner" />
      ) : file.type === 'pdf' ? (
        <FileText size={16} className="cls_file_tab_icon" />
      ) : null}
      <span className="cls_file_tab_name">
        {display_name}
      </span>

      {show_close && (
        <button
          className="cls_file_tab_close"
          onClick={handle_delete_click}
          aria-label={`Close ${file.name}`}
          title={`Close ${file.name}`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default FileListItem;
