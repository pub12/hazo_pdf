/**
 * Upload Dropzone Component
 * Drag-and-drop file upload zone with click-to-upload support
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import type { PdfViewerConfig } from '../../types/config';
import type { UploadProgress } from './types';
import { UploadProgressDisplay } from './upload_progress';
import { cn } from '../../utils/cn';

export interface UploadDropzoneProps {
  /** Configuration for styling and upload settings */
  config: PdfViewerConfig | null;
  /** Current upload progress items */
  uploads: UploadProgress[];
  /** Callback when files are selected for upload */
  on_files_selected: (files: File[]) => void;
  /** Whether the dropzone is disabled */
  disabled?: boolean;
  /** Callback to close the dropzone (for modal mode) */
  on_close?: () => void;
  /** Additional CSS class name */
  className?: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  config,
  uploads,
  on_files_selected,
  disabled = false,
  on_close,
  className,
}) => {
  const [is_dragging, setIsDragging] = useState(false);
  const [validation_error, setValidationError] = useState<string | null>(null);
  const input_ref = useRef<HTMLInputElement>(null);
  const drag_counter = useRef(0);

  const upload_config = config?.file_upload;

  // Parse allowed types from config
  const allowed_types = (upload_config?.allowed_types || 'application/pdf').split(',').map(t => t.trim());
  const max_file_size = upload_config?.max_file_size || 10485760; // 10MB
  const max_files = upload_config?.max_files || 10;

  /**
   * Validate a single file
   */
  const validate_file = useCallback((file: File): string | null => {
    // Check file type
    const is_type_allowed = allowed_types.some(type => {
      const trimmed = type.trim().toLowerCase();
      const file_type = file.type.toLowerCase();

      // Handle wildcard patterns like image/*
      if (trimmed.endsWith('/*')) {
        const prefix = trimmed.slice(0, -2);
        return file_type.startsWith(prefix);
      }

      return file_type === trimmed;
    });

    if (!is_type_allowed) {
      return `File type "${file.type || 'unknown'}" is not allowed`;
    }

    // Check file size
    if (file.size > max_file_size) {
      const max_mb = Math.round(max_file_size / 1024 / 1024);
      const file_mb = (file.size / 1024 / 1024).toFixed(1);
      return `File is too large (${file_mb}MB). Maximum size is ${max_mb}MB`;
    }

    return null;
  }, [allowed_types, max_file_size]);

  /**
   * Handle selected files (from drag or click)
   */
  const handle_files = useCallback((file_list: FileList | File[]) => {
    const files = Array.from(file_list);
    setValidationError(null);

    if (files.length === 0) {
      return;
    }

    // Check max files limit
    if (files.length > max_files) {
      setValidationError(`Too many files. Maximum is ${max_files} files.`);
      return;
    }

    // Validate each file
    const valid_files: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const error = validate_file(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        valid_files.push(file);
      }
    }

    // Show first error if any
    if (errors.length > 0) {
      setValidationError(errors[0]);
    }

    // Process valid files
    if (valid_files.length > 0) {
      on_files_selected(valid_files);
    }
  }, [max_files, validate_file, on_files_selected]);

  // Drag handlers
  const handle_drag_enter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag_counter.current++;
    if (!disabled && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handle_drag_leave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag_counter.current--;
    if (drag_counter.current === 0) {
      setIsDragging(false);
    }
  };

  const handle_drag_over = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handle_drop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    drag_counter.current = 0;

    if (!disabled && e.dataTransfer.files) {
      handle_files(e.dataTransfer.files);
    }
  };

  // Click handler
  const handle_click = () => {
    if (!disabled) {
      input_ref.current?.click();
    }
  };

  // File input change handler
  const handle_input_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handle_files(e.target.files);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  // Get accept string for file input
  const accept_string = allowed_types.join(',');

  // Styling from config
  const border_color = is_dragging
    ? (upload_config?.dropzone_border_color_active || '#3b82f6')
    : (upload_config?.dropzone_border_color || '#d1d5db');
  const background_color = upload_config?.dropzone_background_color || '#f9fafb';

  return (
    <div className={cn('cls_upload_dropzone_wrapper', className)}>
      {/* Close button for modal mode */}
      {on_close && (
        <button
          className="cls_upload_dropzone_close_btn"
          onClick={on_close}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      )}

      {/* Dropzone area */}
      <div
        className={cn(
          'cls_upload_dropzone',
          is_dragging && 'cls_upload_dropzone_active',
          disabled && 'cls_upload_dropzone_disabled'
        )}
        style={{
          borderColor: border_color,
          backgroundColor: is_dragging ? `${border_color}10` : background_color,
        }}
        onDragEnter={handle_drag_enter}
        onDragLeave={handle_drag_leave}
        onDragOver={handle_drag_over}
        onDrop={handle_drop}
        onClick={handle_click}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            handle_click();
          }
        }}
        aria-label="Drop files here or click to upload"
        aria-disabled={disabled}
      >
        <input
          ref={input_ref}
          type="file"
          accept={accept_string}
          multiple
          onChange={handle_input_change}
          className="cls_upload_dropzone_input"
          aria-hidden="true"
          tabIndex={-1}
        />

        <Upload
          size={40}
          className={cn(
            'cls_upload_dropzone_icon',
            is_dragging && 'cls_upload_dropzone_icon_active'
          )}
          style={{ color: is_dragging ? border_color : '#9ca3af' }}
        />

        <p className="cls_upload_dropzone_text">
          {is_dragging ? 'Drop files here' : 'Drop files here or click to upload'}
        </p>

        <p className="cls_upload_dropzone_hint">
          PDF, images, text files, or Excel spreadsheets
        </p>

        {/* Validation error */}
        {validation_error && (
          <p className="cls_upload_dropzone_error">
            {validation_error}
          </p>
        )}
      </div>

      {/* Upload progress */}
      <UploadProgressDisplay uploads={uploads} />
    </div>
  );
};

export default UploadDropzone;
