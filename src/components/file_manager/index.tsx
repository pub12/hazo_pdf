/**
 * File Manager Component
 * Main orchestrator for multi-file management in hazo_pdf
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { FileItem, UploadProgress, UploadResult } from './types';
import type { PdfViewerConfig } from '../../types/config';
import { FileList } from './file_list';
import { UploadDropzone } from './upload_dropzone';
import { FileManagerButton } from './file_manager_button';
import { convert_to_pdf, can_convert_to_pdf } from '../../utils/pdf_converter';
import { cn } from '../../utils/cn';

export interface FileManagerProps {
  /** Initial files to display */
  files?: FileItem[];
  /** Currently selected file ID */
  selected_file_id?: string | null;
  /** Configuration for styling */
  config: PdfViewerConfig | null;
  /** Callback when a file is selected */
  on_file_select?: (file: FileItem) => void;
  /** Callback when a file is deleted */
  on_file_delete?: (file_id: string) => void;
  /** Callback for file upload (caller handles actual storage) */
  on_upload?: (file: File, converted_pdf?: Uint8Array) => Promise<UploadResult>;
  /** Callback when files array changes */
  on_files_change?: (files: FileItem[]) => void;
  /** Whether to show only the compact button trigger */
  show_button_only?: boolean;
  /** Callback to open file manager dialog (for button mode) */
  on_open_dialog?: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Generate a unique ID for a file
 */
function generate_file_id(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine file type from MIME type
 */
function get_file_type(mime_type: string): FileItem['type'] {
  if (mime_type === 'application/pdf') return 'pdf';
  if (mime_type.startsWith('image/')) return 'image';
  if (mime_type.startsWith('text/')) return 'text';
  return 'other';
}

export const FileManager: React.FC<FileManagerProps> = ({
  files: external_files,
  selected_file_id: external_selected_id,
  config,
  on_file_select,
  on_file_delete,
  on_upload,
  on_files_change,
  show_button_only = false,
  on_open_dialog,
  className,
}) => {
  // Internal state for files if not controlled externally
  const [internal_files, setInternalFiles] = useState<FileItem[]>(external_files || []);
  const [internal_selected_id, setInternalSelectedId] = useState<string | null>(
    external_selected_id || external_files?.[0]?.id || null
  );
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [show_dropzone, setShowDropzone] = useState(false);

  // Use external files if provided, otherwise use internal
  const files = external_files ?? internal_files;
  const selected_file_id = external_selected_id ?? internal_selected_id;

  // Sync internal state with external files when they change
  useEffect(() => {
    if (external_files !== undefined) {
      setInternalFiles(external_files);
    }
  }, [external_files]);

  useEffect(() => {
    if (external_selected_id !== undefined) {
      setInternalSelectedId(external_selected_id);
    }
  }, [external_selected_id]);

  /**
   * Handle file selection
   */
  const handle_file_select = useCallback((file: FileItem) => {
    setInternalSelectedId(file.id);
    on_file_select?.(file);
  }, [on_file_select]);

  /**
   * Handle file deletion
   */
  const handle_file_delete = useCallback((file_id: string) => {
    const new_files = files.filter(f => f.id !== file_id);
    setInternalFiles(new_files);
    // Defer callback to avoid setState during render
    setTimeout(() => on_files_change?.(new_files), 0);
    on_file_delete?.(file_id);

    // Select next file if deleted file was selected
    if (selected_file_id === file_id && new_files.length > 0) {
      handle_file_select(new_files[0]);
    } else if (new_files.length === 0) {
      setInternalSelectedId(null);
    }
  }, [files, selected_file_id, on_files_change, on_file_delete, handle_file_select]);

  /**
   * Handle files selected for upload
   */
  const handle_files_selected = useCallback(async (selected_files: File[]) => {
    const conversion_config = config?.pdf_conversion;

    for (const file of selected_files) {
      const file_id = generate_file_id();
      const needs_conversion = file.type !== 'application/pdf' &&
        conversion_config?.conversion_enabled !== false &&
        can_convert_to_pdf(file.type);

      // Add placeholder file immediately to show in the list
      const placeholder_file: FileItem = {
        id: file_id,
        name: needs_conversion ? file.name.replace(/\.[^.]+$/, '.pdf') : file.name,
        url: '', // Empty URL until ready
        type: 'pdf',
        mime_type: 'application/pdf',
        status: needs_conversion ? 'converting' : 'uploading',
        original_file: file,
      };

      // Add placeholder to file list immediately
      setInternalFiles(prev => {
        const updated = [...prev, placeholder_file];
        // Defer callback to avoid setState during render
        setTimeout(() => on_files_change?.(updated), 0);
        return updated;
      });

      // Add to upload progress
      setUploads(prev => [...prev, {
        file_id,
        filename: file.name,
        progress: 0,
        status: needs_conversion ? 'converting' : 'uploading',
      }]);

      try {
        let converted_pdf: Uint8Array | undefined;
        let final_mime_type = file.type;
        let final_name = file.name;
        let is_converted = false;

        // Check if conversion is needed
        if (needs_conversion) {
          setUploads(prev => prev.map(u =>
            u.file_id === file_id ? { ...u, status: 'converting', progress: 30 } : u
          ));

          const result = await convert_to_pdf(file, file.name, {
            page_size: conversion_config?.page_size || 'letter',
            image_quality: conversion_config?.image_quality || 0.85,
            image_fit: conversion_config?.image_fit || 'fit',
            margin: conversion_config?.margin || 36,
          });

          if (result.success && result.pdf_bytes) {
            converted_pdf = result.pdf_bytes;
            final_mime_type = 'application/pdf';
            final_name = result.pdf_filename || file.name.replace(/\.[^.]+$/, '.pdf');
            is_converted = true;

            setUploads(prev => prev.map(u =>
              u.file_id === file_id ? { ...u, progress: 60 } : u
            ));
          } else {
            throw new Error(result.error || 'Conversion failed');
          }
        }

        // If caller provides on_upload, use it
        if (on_upload) {
          setUploads(prev => prev.map(u =>
            u.file_id === file_id ? { ...u, status: 'uploading', progress: 80 } : u
          ));

          // Update placeholder to uploading status
          setInternalFiles(prev => {
            const updated = prev.map(f => f.id === file_id ? { ...f, status: 'uploading' as const } : f);
            // Defer callback to avoid setState during render
            setTimeout(() => on_files_change?.(updated), 0);
            return updated;
          });

          const upload_result = await on_upload(file, converted_pdf);

          if (upload_result.success && upload_result.file) {
            const new_file: FileItem = {
              ...upload_result.file,
              id: file_id, // Keep original ID
              is_converted,
              original_file: is_converted ? file : undefined,
              status: 'ready',
            };

            // Update placeholder with real file data
            setInternalFiles(prev => {
              const updated = prev.map(f => f.id === file_id ? new_file : f);
              // Defer callback to avoid setState during render
              setTimeout(() => on_files_change?.(updated), 0);
              return updated;
            });

            setUploads(prev => prev.map(u =>
              u.file_id === file_id ? { ...u, status: 'complete', progress: 100 } : u
            ));

            // Auto-select the newly uploaded file
            handle_file_select(new_file);
          } else {
            throw new Error(upload_result.error || 'Upload failed');
          }
        } else {
          // Create data URL for local display
          // Create new Uint8Array to ensure proper ArrayBuffer type for Blob constructor
          const blob = converted_pdf
            ? new Blob([new Uint8Array(converted_pdf)], { type: 'application/pdf' })
            : file;
          const url = URL.createObjectURL(blob);

          const new_file: FileItem = {
            id: file_id,
            name: final_name,
            url: url,
            type: get_file_type(final_mime_type),
            mime_type: final_mime_type,
            size: blob.size,
            is_converted,
            original_file: is_converted ? file : undefined,
            status: 'ready',
          };

          // Update placeholder with real file data
          setInternalFiles(prev => {
            const updated = prev.map(f => f.id === file_id ? new_file : f);
            // Defer callback to avoid setState during render
            setTimeout(() => on_files_change?.(updated), 0);
            return updated;
          });

          setUploads(prev => prev.map(u =>
            u.file_id === file_id ? { ...u, status: 'complete', progress: 100 } : u
          ));

          // Auto-select the newly uploaded file
          handle_file_select(new_file);
        }
      } catch (error) {
        console.error('[FileManager] Upload/conversion error:', error);

        // Update placeholder to error status
        setInternalFiles(prev => {
          const updated = prev.map(f => f.id === file_id ? { ...f, status: 'error' as const } : f);
          // Defer callback to avoid setState during render
          setTimeout(() => on_files_change?.(updated), 0);
          return updated;
        });

        setUploads(prev => prev.map(u =>
          u.file_id === file_id ? {
            ...u,
            status: 'error',
            progress: 0,
            error_message: error instanceof Error ? error.message : 'Upload failed',
          } : u
        ));
      }
    }

    // Clear completed uploads after delay
    setTimeout(() => {
      setUploads(prev => prev.filter(u => u.status !== 'complete'));
    }, 3000);

    // Close dropzone after files are selected
    setShowDropzone(false);
  }, [config, on_upload, on_files_change, handle_file_select]);

  const file_manager_config = config?.file_manager;
  const upload_config = config?.file_upload;

  // If button-only mode, render just the button
  if (show_button_only) {
    return (
      <FileManagerButton
        file_count={files.length}
        config={config}
        on_click={() => on_open_dialog?.()}
        className={className}
      />
    );
  }

  return (
    <div className={cn('cls_file_manager', className)}>
      {/* File list */}
      {file_manager_config?.show_file_list !== false && (
        <FileList
          files={files}
          selected_file_id={selected_file_id}
          config={config}
          on_select={handle_file_select}
          on_delete={file_manager_config?.allow_delete !== false ? handle_file_delete : undefined}
          on_add_click={upload_config?.upload_enabled !== false ? () => setShowDropzone(true) : undefined}
        />
      )}

      {/* Dropzone overlay */}
      {show_dropzone && (
        <div className="cls_file_manager_dropzone_overlay">
          <div className="cls_file_manager_dropzone_dialog">
            <UploadDropzone
              config={config}
              uploads={uploads}
              on_files_selected={handle_files_selected}
              on_close={() => setShowDropzone(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Re-export sub-components
export { FileList } from './file_list';
export { FileListItem } from './file_list_item';
export { FileManagerButton } from './file_manager_button';
export { UploadDropzone } from './upload_dropzone';
export { UploadProgressDisplay } from './upload_progress';
export type { FileItem, UploadProgress, UploadResult, FileManagerDisplayMode, PopoutContext } from './types';

export default FileManager;
