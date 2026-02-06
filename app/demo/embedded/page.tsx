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
        {/* Modern Header */}
        <div className="cls_demo_header mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Embedded Viewer
              </h2>
              <p className="text-sm text-gray-500">
                Full-width PDF viewer embedded directly in your content area
              </p>
            </div>
          </div>
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
        <div className="cls_demo_viewer flex-1 min-h-[500px] border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
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
