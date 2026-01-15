/**
 * PDF Viewer Popout Page
 * Standalone viewer that reads context from sessionStorage
 * This page is opened in a new tab when user clicks the popout button
 */

"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import type { FileItem, PdfAnnotation, PopoutContext } from "@/app/lib/hazo_pdf";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

// Storage key for popout context
const POPOUT_STORAGE_KEY = 'hazo_pdf_popout';

/**
 * PDF Viewer popout page component
 */
export default function PdfViewerPopoutPage() {
  const [context, setContext] = useState<PopoutContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);

  // Read popout context from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(POPOUT_STORAGE_KEY);

      if (!stored) {
        setError('No popout context found. This page should be opened via the popout button in the PDF viewer.');
        return;
      }

      const parsed_context: PopoutContext = JSON.parse(stored);

      if (!parsed_context.files || !Array.isArray(parsed_context.files)) {
        setError('Invalid popout context: missing files array');
        return;
      }

      setContext(parsed_context);
      setFiles(parsed_context.files);

      // Update document title if viewer_title was provided
      if (parsed_context.viewer_title) {
        document.title = parsed_context.viewer_title;
      } else {
        document.title = 'PDF Viewer';
      }

      // Optionally clear the storage after reading (one-time use)
      // sessionStorage.removeItem(POPOUT_STORAGE_KEY);
    } catch (err) {
      console.error('[PdfViewerPopout] Error reading context:', err);
      setError(err instanceof Error ? err.message : 'Failed to load popout context');
    }
  }, []);

  const handle_file_select = (file: FileItem) => {
    console.log('[PdfViewerPopout] File selected:', file.name);
  };

  const handle_file_delete = (file_id: string) => {
    setFiles(prev => prev.filter(f => f.id !== file_id));
  };

  const handle_annotation_create = (annotation: PdfAnnotation) => {
    console.log('[PdfViewerPopout] Annotation created:', annotation);
  };

  const handle_annotation_update = (annotation: PdfAnnotation) => {
    console.log('[PdfViewerPopout] Annotation updated:', annotation);
  };

  const handle_annotation_delete = (annotation_id: string) => {
    console.log('[PdfViewerPopout] Annotation deleted:', annotation_id);
  };

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!context) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF viewer...</p>
        </div>
      </div>
    );
  }

  // Main viewer
  return (
    <div className="h-screen w-screen overflow-hidden">
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF viewer...</p>
            </div>
          </div>
        }
      >
        <PdfViewer
          files={files}
          on_file_select={handle_file_select}
          on_file_delete={handle_file_delete}
          on_annotation_create={handle_annotation_create}
          on_annotation_update={handle_annotation_update}
          on_annotation_delete={handle_annotation_delete}
          className="h-full w-full"
          viewer_title={context.viewer_title}
        />
      </Suspense>
    </div>
  );
}
