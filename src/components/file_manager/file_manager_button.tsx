/**
 * File Manager Button Component
 * Compact trigger button with badge showing file count
 */

import React, { useState } from 'react';
import { FaFileAlt, FaFolderOpen } from 'react-icons/fa';
import type { PdfViewerConfig } from '../../types/config';
import { cn } from '../../utils/cn';

export interface FileManagerButtonProps {
  /** Number of files in the file manager */
  file_count: number;
  /** Configuration for styling */
  config: PdfViewerConfig | null;
  /** Callback when button is clicked */
  on_click: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Custom tooltip text */
  tooltip?: string;
  /** Additional CSS class name */
  className?: string;
}

export const FileManagerButton: React.FC<FileManagerButtonProps> = ({
  file_count,
  config,
  on_click,
  disabled = false,
  tooltip,
  className,
}) => {
  const [is_hovered, setIsHovered] = useState(false);

  const button_config = config?.file_button;

  const icon_size = button_config?.icon_size || 24;

  // Determine icon color based on state
  let icon_color = button_config?.icon_color || '#6b7280';
  if (file_count > 0) {
    icon_color = button_config?.icon_color_with_files || '#3b82f6';
  }
  if (is_hovered && !disabled) {
    icon_color = button_config?.icon_color_hover || '#374151';
    if (file_count > 0) {
      icon_color = button_config?.icon_color_with_files || '#3b82f6';
    }
  }

  const badge_background = button_config?.badge_background || '#3b82f6';
  const badge_text_color = button_config?.badge_text_color || '#ffffff';

  // Format badge count
  const badge_text = file_count > 99 ? '99+' : file_count.toString();

  // Generate tooltip text
  const tooltip_text = tooltip || (
    file_count === 0
      ? 'No files'
      : file_count === 1
        ? '1 file'
        : `${file_count} files`
  );

  return (
    <button
      className={cn(
        'cls_file_manager_button',
        disabled && 'cls_file_manager_button_disabled',
        className
      )}
      onClick={on_click}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={tooltip_text}
      title={tooltip_text}
    >
      {file_count > 0 ? (
        <FaFolderOpen size={icon_size} style={{ color: icon_color }} />
      ) : (
        <FaFileAlt size={icon_size} style={{ color: icon_color }} />
      )}

      {file_count > 0 && (
        <span
          className="cls_file_manager_button_badge"
          style={{
            backgroundColor: badge_background,
            color: badge_text_color,
          }}
        >
          {badge_text}
        </span>
      )}
    </button>
  );
};

export default FileManagerButton;
