/**
 * Dialog Demo Page
 * Demonstrates PDF viewer in a modal/dialog
 */

"use client";

import { Suspense, lazy, useState } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";

// Lazy load PdfViewer and PdfViewerDialog to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

const PdfViewerDialog = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewerDialog }))
);

/**
 * Dialog demo page component
 */
export default function DialogDemoPage() {
  const [is_open, setIsOpen] = useState(false);
  const [is_dialog_open, setIsDialogOpen] = useState(false);

  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full overflow-auto">
        {/* Modern Header */}
        <div className="cls_demo_header mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dialog/Modal Demo
              </h2>
              <p className="text-sm text-gray-500">
                Open PDFs in modal dialogs for focused viewing
              </p>
            </div>
          </div>
        </div>

        {/* PdfViewerDialog Component Example */}
        <CodePreview
          title="Using PdfViewerDialog (Recommended)"
          code={`import { PdfViewerDialog } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open PDF</button>
      <PdfViewerDialog
        open={isOpen}
        on_open_change={setIsOpen}
        url="/document.pdf"
        // Optional customization:
        // dialog_width="80vw"
        // dialog_height="80vh"
        // close_on_backdrop_click={true}
        // close_on_escape={true}
      />
    </>
  );
}`}
        />

        {/* Open Button for PdfViewerDialog */}
        <div className="mb-6">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:from-emerald-600 hover:to-green-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Open with PdfViewerDialog
          </button>
        </div>

        {/* PdfViewerDialog */}
        <Suspense fallback={null}>
          <PdfViewerDialog
            open={is_dialog_open}
            on_open_change={setIsDialogOpen}
            url="/api/test-app/files/sample.pdf"
            extract_api_endpoint="/api/extract"
            extract_prompt_area="document"
            extract_prompt_key="initial_classification"
            on_extract_complete={(data) => {
              console.log('[DialogDemo] Extraction complete:', data);
            }}
            on_extract_error={(error) => {
              console.error('[DialogDemo] Extraction error:', error);
            }}
          />
        </Suspense>

        {/* Manual Approach Example */}
        <CodePreview
          title="Manual Approach (Custom Dialog Wrapper)"
          code={`import { PdfViewer } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open PDF</button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden">
            <PdfViewer
              url="/document.pdf"
              on_close={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}`}
        />

        {/* Open Button for Manual Approach */}
        <div className="mb-6">
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:from-blue-600 hover:to-indigo-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open with Manual Wrapper
          </button>
        </div>

        {/* Manual Dialog Modal */}
        {is_open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="cls_demo_dialog w-[90vw] h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <span className="text-sm text-gray-500">Loading PDF viewer...</span>
                  </div>
                </div>
              }>
                <PdfViewer
                  url="/api/test-app/files/sample.pdf"
                  className="h-full w-full"
                  on_close={() => setIsOpen(false)}
                  extract_api_endpoint="/api/extract"
                  extract_prompt_area="document"
                  extract_prompt_key="initial_classification"
                  on_extract_complete={(data) => {
                    console.log('[DialogDemo] Extraction complete:', data);
                  }}
                  on_extract_error={(error) => {
                    console.error('[DialogDemo] Extraction error:', error);
                  }}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </TestAppLayout>
  );
}
