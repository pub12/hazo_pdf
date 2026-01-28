/**
 * PdfViewerDialog component
 * Renders PdfViewer in a modal/dialog overlay
 */

"use client";

import React, { Suspense, useCallback, useEffect, useRef, lazy } from "react";
import type { PdfViewerProps } from "../../types";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("./pdf_viewer").then((mod) => ({ default: mod.PdfViewer }))
);

/**
 * Props for PdfViewerDialog component
 * Extends PdfViewerProps with dialog-specific props
 */
export interface PdfViewerDialogProps extends Omit<PdfViewerProps, "on_close"> {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when open state should change (close requested) */
  on_open_change: (open: boolean) => void;

  /** Dialog width (default: "90vw") */
  dialog_width?: string;

  /** Dialog height (default: "90vh") */
  dialog_height?: string;

  /** Whether clicking the backdrop closes the dialog (default: true) */
  close_on_backdrop_click?: boolean;

  /** Whether pressing Escape closes the dialog (default: true) */
  close_on_escape?: boolean;

  /** Loading fallback content (default: "Loading PDF viewer...") */
  loading_fallback?: React.ReactNode;

  /** Additional class names for the dialog container */
  dialog_class_name?: string;

  /** Additional class names for the backdrop overlay */
  backdrop_class_name?: string;
}

/**
 * PdfViewerDialog component
 * Renders PdfViewer in a centered modal with backdrop overlay
 *
 * @example
 * ```tsx
 * import { PdfViewerDialog } from "hazo_pdf";
 * import "hazo_pdf/styles.css";
 *
 * function App() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Open PDF</button>
 *       <PdfViewerDialog
 *         open={isOpen}
 *         on_open_change={setIsOpen}
 *         url="/document.pdf"
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function PdfViewerDialog({
  open,
  on_open_change,
  dialog_width = "90vw",
  dialog_height = "90vh",
  close_on_backdrop_click = true,
  close_on_escape = true,
  loading_fallback,
  dialog_class_name,
  backdrop_class_name,
  className,
  ...pdf_viewer_props
}: PdfViewerDialogProps) {
  const dialog_ref = useRef<HTMLDivElement>(null);

  // Handle close
  const handle_close = useCallback(() => {
    on_open_change(false);
  }, [on_open_change]);

  // Handle backdrop click
  const handle_backdrop_click = useCallback(
    (e: React.MouseEvent) => {
      if (close_on_backdrop_click && e.target === e.currentTarget) {
        handle_close();
      }
    },
    [close_on_backdrop_click, handle_close]
  );

  // Handle escape key
  useEffect(() => {
    if (!open || !close_on_escape) return;

    const handle_keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handle_close();
      }
    };

    document.addEventListener("keydown", handle_keydown);
    return () => document.removeEventListener("keydown", handle_keydown);
  }, [open, close_on_escape, handle_close]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (!open) return;

    const original_overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original_overflow;
    };
  }, [open]);

  // Focus trap - focus dialog when opened
  useEffect(() => {
    if (open && dialog_ref.current) {
      dialog_ref.current.focus();
    }
  }, [open]);

  // Don't render if not open
  if (!open) {
    return null;
  }

  const default_fallback = (
    <div className="flex items-center justify-center h-full w-full p-8 text-center text-gray-500">
      Loading PDF viewer...
    </div>
  );

  return (
    <div
      className={`cls_pdf_viewer_dialog_backdrop fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${backdrop_class_name || ""}`}
      onClick={handle_backdrop_click}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialog_ref}
        className={`cls_pdf_viewer_dialog bg-white rounded-lg overflow-hidden shadow-xl ${dialog_class_name || ""}`}
        style={{ width: dialog_width, height: dialog_height }}
        tabIndex={-1}
      >
        <Suspense fallback={loading_fallback || default_fallback}>
          <PdfViewer
            {...pdf_viewer_props}
            className={`h-full w-full ${className || ""}`}
            on_close={handle_close}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default PdfViewerDialog;
