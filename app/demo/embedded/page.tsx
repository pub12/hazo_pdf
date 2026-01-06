/**
 * Embedded Demo Page
 * Demonstrates full embedded PDF viewer usage
 */

"use client";

import { Suspense, lazy } from "react";
import { TestAppLayout } from "@/app/test-app-layout";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

/**
 * Embedded demo page component
 */
export default function EmbeddedDemoPage() {
  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">Embedded Viewer Demo</h2>
          <p className="text-muted-foreground">
            Full-width/height PDF viewer embedded in the main content area. This is the simplest usage pattern.
          </p>
        </div>

        {/* Code Example */}
        <div className="cls_demo_code mb-4 p-4 bg-gray-100 rounded-lg overflow-auto">
          <pre className="text-sm">
{`import { PdfViewer } from 'hazo_pdf';
import 'hazo_pdf/styles.css'; // No preflight, safe for consuming apps

function App() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <PdfViewer
        url="/api/test-app/files/sample.pdf"
        className="h-full w-full"
      />
    </div>
  );
}`}
          </pre>
        </div>

        {/* PDF Viewer */}
        <div className="cls_demo_viewer flex-1 min-h-[500px] border rounded-lg overflow-hidden">
          <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
            <PdfViewer
              url="/api/test-app/files/sample.pdf"
              className="h-full w-full"
            />
          </Suspense>
        </div>
      </div>
    </TestAppLayout>
  );
}
