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
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">Dialog/Modal Demo</h2>
          <p className="text-muted-foreground">
            PDF viewer displayed in a modal dialog. Two approaches are shown below.
          </p>
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
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
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
        <div className="mb-4">
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Open with Manual Wrapper
          </button>
        </div>

        {/* Manual Dialog Modal */}
        {is_open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="cls_demo_dialog w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden shadow-xl">
              <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
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
