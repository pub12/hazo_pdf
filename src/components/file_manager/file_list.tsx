/**
 * File List Component
 * Horizontal scrollable list of file items with navigation and add button
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { FileItem } from './types';
import type { PdfViewerConfig } from '../../types/config';
import { FileListItem } from './file_list_item';
import { cn } from '../../utils/cn';

export interface FileListProps {
  /** Array of files to display */
  files: FileItem[];
  /** ID of the currently selected file */
  selected_file_id: string | null;
  /** Configuration for styling */
  config: PdfViewerConfig | null;
  /** Callback when a file is selected */
  on_select: (file: FileItem) => void;
  /** Callback when a file is deleted */
  on_delete?: (file_id: string) => void;
  /** Callback when add button is clicked (opens dropzone overlay) */
  on_add_click?: () => void;
  /** Callback when files are selected directly (for direct_upload mode) */
  on_files_selected?: (files: File[]) => void;
  /** Additional CSS class name */
  className?: string;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selected_file_id,
  config,
  on_select,
  on_delete,
  on_add_click,
  on_files_selected,
  className,
}) => {
  const scroll_ref = useRef<HTMLDivElement>(null);
  const file_input_ref = useRef<HTMLInputElement>(null);
  const drag_counter = useRef(0);
  const [can_scroll_left, setCanScrollLeft] = useState(false);
  const [can_scroll_right, setCanScrollRight] = useState(false);
  const [is_dragging, setIsDragging] = useState(false);

  const file_manager_config = config?.file_manager;
  const upload_config = config?.file_upload;
  const is_direct_upload = !!on_files_selected;

  // Parse allowed types for file input accept attribute
  const accept_string = upload_config?.allowed_types || 'application/pdf';

  // Check scroll state
  const update_scroll_state = () => {
    if (!scroll_ref.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scroll_ref.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  // Update scroll state on mount and when files change
  useEffect(() => {
    update_scroll_state();
    window.addEventListener('resize', update_scroll_state);
    return () => window.removeEventListener('resize', update_scroll_state);
  }, [files]);

  // Scroll handlers
  const scroll_left = () => {
    if (scroll_ref.current) {
      scroll_ref.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scroll_right = () => {
    if (scroll_ref.current) {
      scroll_ref.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Scroll selected file into view
  useEffect(() => {
    if (!scroll_ref.current || !selected_file_id) return;

    const selected_element = scroll_ref.current.querySelector(
      `[data-file-id="${selected_file_id}"]`
    );
    if (selected_element) {
      selected_element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [selected_file_id]);

  // Direct upload: click opens file picker
  const handle_add_click = useCallback(() => {
    if (is_direct_upload) {
      file_input_ref.current?.click();
    } else {
      on_add_click?.();
    }
  }, [is_direct_upload, on_add_click]);

  // Direct upload: file input change
  const handle_input_change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      on_files_selected?.(Array.from(e.target.files));
      e.target.value = '';
    }
  }, [on_files_selected]);

  // Direct upload: drag handlers for add button
  const handle_drag_enter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag_counter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handle_drag_leave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag_counter.current--;
    if (drag_counter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handle_drag_over = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handle_drop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    drag_counter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      on_files_selected?.(Array.from(e.dataTransfer.files));
    }
  }, [on_files_selected]);

  const height = file_manager_config?.file_list_height || 60;
  const background_color = file_manager_config?.file_list_background_color || '#f3f4f6';
  const border_color = file_manager_config?.file_list_border_color || '#e5e7eb';
  const allow_delete = file_manager_config?.allow_delete ?? true;
  const show_add_button = upload_config?.show_add_button ?? true;
  const has_add_handler = is_direct_upload || !!on_add_click;

  return (
    <div
      className={cn('cls_file_list_container', className)}
      style={{
        minHeight: `${height}px`,
        backgroundColor: background_color,
        borderBottomColor: border_color,
      }}
    >
      {/* Scroll left button */}
      <button
        className={cn(
          'cls_file_list_scroll_btn cls_file_list_scroll_btn_left',
          !can_scroll_left && 'cls_file_list_scroll_btn_disabled'
        )}
        onClick={scroll_left}
        disabled={!can_scroll_left}
        aria-label="Scroll left"
        title="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Scrollable file list */}
      <div
        ref={scroll_ref}
        className="cls_file_list_scroll"
        onScroll={update_scroll_state}
      >
        {files.map((file) => (
          <FileListItem
            key={file.id}
            file={file}
            is_selected={file.id === selected_file_id}
            show_delete={allow_delete}
            config={config}
            on_select={on_select}
            on_delete={on_delete}
          />
        ))}

        {/* Add button - in direct_upload mode, also acts as dropzone */}
        {show_add_button && has_add_handler && (
          <>
            <button
              className={cn(
                'cls_file_list_add_btn',
                is_dragging && 'cls_file_list_add_btn_dragging'
              )}
              onClick={handle_add_click}
              onDragEnter={is_direct_upload ? handle_drag_enter : undefined}
              onDragLeave={is_direct_upload ? handle_drag_leave : undefined}
              onDragOver={is_direct_upload ? handle_drag_over : undefined}
              onDrop={is_direct_upload ? handle_drop : undefined}
              aria-label="Add file"
              title={is_direct_upload ? 'Click to browse or drag files here' : 'Add file'}
            >
              <Plus size={16} />
              <span className="cls_file_list_add_btn_text">
                {is_dragging ? 'Drop here' : 'Add file'}
              </span>
            </button>
            {/* Hidden file input for direct upload mode */}
            {is_direct_upload && (
              <input
                ref={file_input_ref}
                type="file"
                accept={accept_string}
                multiple
                onChange={handle_input_change}
                style={{ display: 'none' }}
                aria-hidden="true"
                tabIndex={-1}
              />
            )}
          </>
        )}
      </div>

      {/* Scroll right button */}
      <button
        className={cn(
          'cls_file_list_scroll_btn cls_file_list_scroll_btn_right',
          !can_scroll_right && 'cls_file_list_scroll_btn_disabled'
        )}
        onClick={scroll_right}
        disabled={!can_scroll_right}
        aria-label="Scroll right"
        title="Scroll right"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default FileList;
