/**
 * Upload Progress Component
 * Shows upload progress for files being uploaded/converted
 */

import React from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { UploadProgress } from './types';
import { cn } from '../../utils/cn';

export interface UploadProgressProps {
  /** Array of upload progress items */
  uploads: UploadProgress[];
  /** Additional CSS class name */
  className?: string;
}

/**
 * Get status icon based on upload status
 */
function get_status_icon(status: UploadProgress['status']) {
  switch (status) {
    case 'complete':
      return <CheckCircle size={16} className="cls_upload_progress_icon_success" />;
    case 'error':
      return <XCircle size={16} className="cls_upload_progress_icon_error" />;
    case 'converting':
    case 'uploading':
    case 'pending':
      return <Loader2 size={16} className="cls_upload_progress_icon_loading" />;
    default:
      return null;
  }
}

/**
 * Get status text for display
 */
function get_status_text(upload: UploadProgress): string {
  switch (upload.status) {
    case 'pending':
      return 'Waiting...';
    case 'uploading':
      return `${upload.progress}%`;
    case 'converting':
      return 'Converting...';
    case 'complete':
      return 'Done';
    case 'error':
      return upload.error_message || 'Failed';
    default:
      return '';
  }
}

export const UploadProgressDisplay: React.FC<UploadProgressProps> = ({
  uploads,
  className,
}) => {
  if (uploads.length === 0) {
    return null;
  }

  return (
    <div className={cn('cls_upload_progress_container', className)}>
      {uploads.map((upload) => (
        <div
          key={upload.file_id}
          className={cn(
            'cls_upload_progress_item',
            upload.status === 'error' && 'cls_upload_progress_item_error',
            upload.status === 'complete' && 'cls_upload_progress_item_complete'
          )}
        >
          <div className="cls_upload_progress_icon">
            {get_status_icon(upload.status)}
          </div>

          <span className="cls_upload_progress_filename" title={upload.filename}>
            {upload.filename}
          </span>

          <div className="cls_upload_progress_bar_container">
            <div
              className={cn(
                'cls_upload_progress_bar',
                upload.status === 'error' && 'cls_upload_progress_bar_error',
                upload.status === 'complete' && 'cls_upload_progress_bar_complete'
              )}
              style={{ width: `${upload.progress}%` }}
            />
          </div>

          <span className="cls_upload_progress_status">
            {get_status_text(upload)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default UploadProgressDisplay;
