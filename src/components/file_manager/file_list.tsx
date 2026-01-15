/**
 * File List Component
 * Horizontal scrollable list of file items with navigation and add button
 */

import React, { useRef, useState, useEffect } from 'react';
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
  /** Callback when add button is clicked */
  on_add_click?: () => void;
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
  className,
}) => {
  const scroll_ref = useRef<HTMLDivElement>(null);
  const [can_scroll_left, setCanScrollLeft] = useState(false);
  const [can_scroll_right, setCanScrollRight] = useState(false);

  const file_manager_config = config?.file_manager;
  const upload_config = config?.file_upload;

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

  const height = file_manager_config?.file_list_height || 60;
  const background_color = file_manager_config?.file_list_background_color || '#f3f4f6';
  const border_color = file_manager_config?.file_list_border_color || '#e5e7eb';
  const allow_delete = file_manager_config?.allow_delete ?? true;
  const show_add_button = upload_config?.show_add_button ?? true;

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

        {/* Add button */}
        {show_add_button && on_add_click && (
          <button
            className="cls_file_list_add_btn"
            onClick={on_add_click}
            aria-label="Add file"
            title="Add file"
          >
            <Plus size={16} />
            <span className="cls_file_list_add_btn_text">Add file</span>
          </button>
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
