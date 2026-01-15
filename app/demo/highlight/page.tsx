/**
 * Highlight API Demo Page
 * Demonstrates programmatic highlight creation via ref
 */

"use client";

import { Suspense, lazy, useRef, useState } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";
import type { PdfViewerRef } from "@/app/lib/hazo_pdf";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

/**
 * Highlight API demo page component
 */
export default function HighlightDemoPage() {
  const viewer_ref = useRef<PdfViewerRef>(null);
  const [highlight_ids, set_highlight_ids] = useState<string[]>([]);
  const [last_action, set_last_action] = useState<string>("");

  // Add a highlight with default colors (from config)
  const add_default_highlight = () => {
    const id = viewer_ref.current?.highlight_region(0, [50, 700, 300, 750]);
    if (id) {
      set_highlight_ids((prev) => [...prev, id]);
      set_last_action(`Added highlight with default colors: ${id}`);
    }
  };

  // Add a highlight with custom colors
  const add_custom_highlight = () => {
    const id = viewer_ref.current?.highlight_region(0, [50, 600, 300, 650], {
      border_color: "#FF0000",
      background_color: "#FFCCCC",
      background_opacity: 0.5,
    });
    if (id) {
      set_highlight_ids((prev) => [...prev, id]);
      set_last_action(`Added highlight with red border/pink fill: ${id}`);
    }
  };

  // Add a highlight with green styling
  const add_green_highlight = () => {
    const id = viewer_ref.current?.highlight_region(0, [50, 500, 300, 550], {
      border_color: "#006400",
      background_color: "#90EE90",
      background_opacity: 0.4,
    });
    if (id) {
      set_highlight_ids((prev) => [...prev, id]);
      set_last_action(`Added highlight with green styling: ${id}`);
    }
  };

  // Remove the last highlight
  const remove_last_highlight = () => {
    if (highlight_ids.length > 0) {
      const last_id = highlight_ids[highlight_ids.length - 1];
      const success = viewer_ref.current?.remove_highlight(last_id);
      if (success) {
        set_highlight_ids((prev) => prev.slice(0, -1));
        set_last_action(`Removed highlight: ${last_id}`);
      }
    }
  };

  // Clear all API-created highlights
  const clear_all = () => {
    viewer_ref.current?.clear_all_highlights();
    set_highlight_ids([]);
    set_last_action("Cleared all API-created highlights");
  };

  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">Highlight API Demo</h2>
          <p className="text-muted-foreground">
            Programmatically create and manage highlights using the ref API.
          </p>
        </div>

        {/* Code Example */}
        <CodePreview
          title="Code Example"
          code={`import { PdfViewer, PdfViewerRef } from 'hazo_pdf';
import { useRef } from 'react';

function App() {
  const viewer_ref = useRef<PdfViewerRef>(null);

  const addHighlight = () => {
    // Create highlight with custom colors (PDF coordinates)
    const id = viewer_ref.current?.highlight_region(
      0,                              // page_index (0-based)
      [50, 700, 300, 750],           // rect [x1, y1, x2, y2]
      {
        border_color: '#FF0000',     // optional
        background_color: '#FFFF00', // optional
        background_opacity: 0.4      // optional
      }
    );
    console.log('Created highlight:', id);
  };

  return <PdfViewer ref={viewer_ref} url="/document.pdf" />;
}`}
        />

        {/* Controls */}
        <div className="cls_demo_controls mb-4 flex flex-wrap gap-2">
          <button
            onClick={add_default_highlight}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            Add Default Highlight
          </button>
          <button
            onClick={add_custom_highlight}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Add Red/Pink Highlight
          </button>
          <button
            onClick={add_green_highlight}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Add Green Highlight
          </button>
          <button
            onClick={remove_last_highlight}
            disabled={highlight_ids.length === 0}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Remove Last
          </button>
          <button
            onClick={clear_all}
            disabled={highlight_ids.length === 0}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>

        {/* Status */}
        <div className="cls_demo_status mb-4 p-3 bg-gray-50 rounded border text-sm">
          <div>
            <strong>Highlights created:</strong> {highlight_ids.length}
          </div>
          {last_action && (
            <div className="text-muted-foreground mt-1">
              <strong>Last action:</strong> {last_action}
            </div>
          )}
        </div>

        {/* PDF Viewer */}
        <div className="cls_demo_viewer flex-1 min-h-[500px] border rounded-lg overflow-hidden">
          <Suspense
            fallback={
              <div className="p-8 text-center">Loading PDF viewer...</div>
            }
          >
            <PdfViewer
              ref={viewer_ref}
              url="/api/test-app/files/sample.pdf"
              className="h-full w-full"
            />
          </Suspense>
        </div>
      </div>
    </TestAppLayout>
  );
}
