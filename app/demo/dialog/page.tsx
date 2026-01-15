/**
 * Dialog Demo Page
 * Demonstrates PDF viewer in a modal/dialog
 */

"use client";

import { Suspense, lazy, useState } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

/**
 * Dialog demo page component
 */
export default function DialogDemoPage() {
  const [is_open, setIsOpen] = useState(false);

  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">Dialog/Modal Demo</h2>
          <p className="text-muted-foreground">
            PDF viewer displayed in a modal dialog. Click the button below to open the viewer.
            The close button (X) appears when <code>on_close</code> callback is provided.
          </p>
        </div>

        {/* Code Example */}
        <CodePreview
          title="Code Example"
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

        {/* Open Button */}
        <div className="mb-4">
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Open PDF in Dialog
          </button>
        </div>

        {/* Dialog Modal */}
        {is_open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="cls_demo_dialog w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden shadow-xl">
              <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
                <PdfViewer
                  url="/api/test-app/files/sample.pdf"
                  className="h-full w-full"
                  on_close={() => setIsOpen(false)}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </TestAppLayout>
  );
}
