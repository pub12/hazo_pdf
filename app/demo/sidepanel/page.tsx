/**
 * Side Panel Demo Page
 * Demonstrates PDF viewer as a side panel alongside main content
 */

"use client";

import { Suspense, lazy, useState } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

/**
 * Side panel demo page component
 */
export default function SidepanelDemoPage() {
  const [panel_open, setPanelOpen] = useState(true);
  const [panel_width, setPanelWidth] = useState(50); // percentage

  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">Side Panel Demo</h2>
          <p className="text-muted-foreground">
            PDF viewer displayed as a resizable side panel alongside main content.
            Use the slider to adjust panel width.
          </p>
        </div>

        {/* Controls */}
        <div className="cls_demo_controls mb-4 flex items-center gap-4">
          <button
            onClick={() => setPanelOpen(!panel_open)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {panel_open ? "Hide Panel" : "Show Panel"}
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="panel-width">Panel Width:</label>
            <input
              id="panel-width"
              type="range"
              min="20"
              max="80"
              value={panel_width}
              onChange={(e) => setPanelWidth(Number(e.target.value))}
              className="w-32"
            />
            <span>{panel_width}%</span>
          </div>
        </div>

        {/* Code Example */}
        <CodePreview
          title="Code Example"
          code={`import { PdfViewer } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function App() {
  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 p-4">
        <h1>Main Application Content</h1>
      </div>

      {/* PDF Side Panel */}
      <div style={{ width: '50%' }} className="border-l">
        <PdfViewer
          url="/document.pdf"
          toolbar_enabled={true}
          show_zoom_controls={true}
          show_save_button={false}
        />
      </div>
    </div>
  );
}`}
        />

        {/* Split View */}
        <div className="cls_demo_split_view flex-1 flex min-h-[500px] border rounded-lg overflow-hidden">
          {/* Main Content Area */}
          <div
            className="cls_demo_main_content p-4 bg-gray-50 overflow-auto"
            style={{ width: panel_open ? `${100 - panel_width}%` : "100%" }}
          >
            <h3 className="text-lg font-semibold mb-4">Main Application Content</h3>
            <p className="text-muted-foreground mb-4">
              This area represents your main application content. The PDF viewer is
              displayed in a side panel to the right.
            </p>
            <p className="text-muted-foreground mb-4">
              This pattern is useful for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4">
              <li>Document review alongside data entry</li>
              <li>Comparing documents with forms</li>
              <li>Reference material while working</li>
            </ul>
            <p className="text-muted-foreground">
              The PDF viewer in this demo has the save button hidden to demonstrate
              toolbar customization via props.
            </p>
          </div>

          {/* PDF Side Panel */}
          {panel_open && (
            <div
              className="cls_demo_pdf_panel border-l"
              style={{ width: `${panel_width}%` }}
            >
              <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
                <PdfViewer
                  url="/api/test-app/files/sample.pdf"
                  className="h-full w-full"
                  toolbar_enabled={true}
                  show_zoom_controls={true}
                  show_square_button={true}
                  show_undo_button={true}
                  show_redo_button={true}
                  show_save_button={false}
                  extract_api_endpoint="/api/extract"
                  extract_prompt_area="document"
                  extract_prompt_key="initial_classification"
                  on_extract_complete={(data) => {
                    console.log('[SidepanelDemo] Extraction complete:', data);
                  }}
                  on_extract_error={(error) => {
                    console.error('[SidepanelDemo] Extraction error:', error);
                  }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </TestAppLayout>
  );
}
