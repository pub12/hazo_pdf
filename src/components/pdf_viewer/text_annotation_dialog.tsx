/**
 * Text Annotation Dialog Component
 * Dialog for entering text annotation
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Trash2 } from 'lucide-react';
import type { PdfViewerConfig } from '../../types';
import { default_config } from '../../config/default_config';
import { cn } from '../../utils/cn';

/**
 * Props for TextAnnotationDialog component
 */
export interface TextAnnotationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** X position of the dialog (viewport coordinates) */
  x: number;
  
  /** Y position of the dialog (viewport coordinates) */
  y: number;
  
  /** Callback when dialog is closed */
  on_close: () => void;
  
  /** Callback when text is submitted */
  on_submit: (text: string) => void;
  
  /** Callback when annotation is deleted (only used in edit mode) */
  on_delete?: () => void;
  
  /** Initial text value */
  initial_text?: string;
  
  /** Whether this is editing an existing annotation (shows delete button) */
  is_editing?: boolean;
  
  /** Configuration object for styling */
  config?: PdfViewerConfig | null;
}

/**
 * Text Annotation Dialog Component
 * Slim inline dialog for entering text annotation
 */
export const TextAnnotationDialog: React.FC<TextAnnotationDialogProps> = ({
  open,
  x,
  y,
  on_close,
  on_submit,
  on_delete,
  initial_text = '',
  is_editing = false,
  config = null,
}) => {
  const [text, setText] = useState(initial_text);
  const input_ref = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted (client-side only) before creating portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset text when dialog opens/closes
  useEffect(() => {
    if (open) {
      setText(initial_text);
      // Focus input when dialog opens
      setTimeout(() => {
        input_ref.current?.focus();
        input_ref.current?.select();
      }, 0);
    }
  }, [open, initial_text]);

  // Handle submit
  const handle_submit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (text.trim()) {
      on_submit(text.trim());
      setText('');
      on_close();
    }
  };

  // Handle cancel
  const handle_cancel = () => {
    setText('');
    on_close();
  };

  // Handle delete
  const handle_delete = () => {
    if (on_delete) {
      on_delete();
      setText('');
      on_close();
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handle_keydown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        handle_cancel();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handle_submit();
      }
    };

    if (open) {
      window.addEventListener('keydown', handle_keydown);
      return () => {
        window.removeEventListener('keydown', handle_keydown);
      };
    }
    return undefined;
  }, [open, text]);

  if (!open || !mounted) {
    return null;
  }

  // Get config values or use defaults
  const dialog_config = config?.dialog || default_config.dialog;

  // Render dialog content
  const dialog_content = (
    <>
      {/* Backdrop */}
      <div
        className="cls_pdf_viewer_dialog_backdrop"
        onClick={handle_cancel}
        aria-hidden="true"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${dialog_config.dialog_backdrop_opacity})`,
        }}
      />

      {/* Slim Dialog - positioned at x, y coordinates */}
      <div
        className="cls_pdf_viewer_text_dialog"
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
          zIndex: 10001, // Higher than context menu
          backgroundColor: dialog_config.dialog_background_color,
          borderColor: dialog_config.dialog_border_color,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handle_submit} className="cls_pdf_viewer_dialog_form">
          <input
            ref={input_ref}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="cls_pdf_viewer_dialog_input"
            placeholder="Enter annotation text..."
            autoFocus
          />
          <div className="cls_pdf_viewer_dialog_buttons">
            {/* Delete button - only shown when editing */}
            {is_editing && on_delete && (
              <button
                type="button"
                onClick={handle_delete}
                className={cn(
                  'cls_pdf_viewer_dialog_button',
                  'cls_pdf_viewer_dialog_button_delete'
                )}
                style={{
                  color: dialog_config.dialog_button_cancel_color,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = dialog_config.dialog_button_cancel_color_hover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = dialog_config.dialog_button_cancel_color;
                }}
                aria-label="Delete annotation"
                title="Delete annotation"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={handle_cancel}
              className={cn(
                'cls_pdf_viewer_dialog_button',
                'cls_pdf_viewer_dialog_button_cancel'
              )}
              style={{
                color: dialog_config.dialog_button_cancel_color,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = dialog_config.dialog_button_cancel_color_hover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = dialog_config.dialog_button_cancel_color;
              }}
              aria-label="Cancel"
              title="Cancel (Esc)"
            >
              <X size={14} />
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className={cn(
                'cls_pdf_viewer_dialog_button',
                'cls_pdf_viewer_dialog_button_submit',
                !text.trim() && 'cls_pdf_viewer_dialog_button_disabled'
              )}
              style={{
                color: !text.trim() ? undefined : dialog_config.dialog_button_submit_color,
                opacity: !text.trim() ? dialog_config.dialog_button_disabled_opacity : 1,
              }}
              onMouseEnter={(e) => {
                if (text.trim()) {
                  (e.currentTarget as HTMLElement).style.color = dialog_config.dialog_button_submit_color_hover;
                }
              }}
              onMouseLeave={(e) => {
                if (text.trim()) {
                  (e.currentTarget as HTMLElement).style.color = dialog_config.dialog_button_submit_color;
                }
              }}
              aria-label="Submit"
              title="Submit (Enter)"
            >
              <Check size={14} />
            </button>
          </div>
        </form>
      </div>
    </>
  );

  // Use portal to render at document.body level to escape any containing blocks
  return createPortal(dialog_content, document.body);
};

export default TextAnnotationDialog;

