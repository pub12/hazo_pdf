/**
 * Embedded Demo Page
 * Demonstrates full embedded PDF viewer usage
 */

"use client";

import { Suspense, lazy } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
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
        <CodePreview
          title="Code Example"
          code={`import { PdfViewer } from 'hazo_pdf';
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
        />

        {/* PDF Viewer */}
        <div className="cls_demo_viewer flex-1 min-h-[500px] border rounded-lg overflow-hidden">
          <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
            <PdfViewer
              url="/api/test-app/files/sample.pdf"
              fit_to_width={true}
              className="h-full w-full"
              extract_api_endpoint="/api/extract"
              extract_prompt_area="document"
              extract_prompt_key="initial_classification"
              on_extract_complete={(data) => {
                console.log('[EmbeddedDemo] Extraction complete:', data);
              }}
              on_extract_error={(error) => {
                console.error('[EmbeddedDemo] Extraction error:', error);
              }}
            />
          </Suspense>
        </div>
      </div>
    </TestAppLayout>
  );
}
