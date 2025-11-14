"use client";

import * as React from "react";
import { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "next/navigation";
import { TestAppLayout } from "../../test-app-layout";

/**
 * Lazy load PdfViewer component only on client side
 * PDF.js requires client-side rendering only
 */
const PdfViewer = typeof window !== "undefined" 
  ? lazy(() => import("hazo_pdf").then((mod) => ({ default: mod.PdfViewer })))
  : () => null;

/**
 * PDF Viewer page component
 * Displays a PDF file using the hazo_pdf PdfViewer component
 * Wrapped in TestAppLayout to show the sidebar
 */
export default function ViewerPage() {
  const params = useParams();
  const filename = params?.filename as string | undefined;
  const [is_mounted, setIsMounted] = useState(false);
  
  // Ensure component only renders on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Construct PDF URL - serve from API route
  const pdf_url = filename 
    ? `/api/test-app/files/${encodeURIComponent(filename)}`
    : null;

  if (!filename || !pdf_url) {
    return (
      <TestAppLayout>
        <div className="cls_viewer_page_error flex flex-col items-center justify-center h-full p-8">
          <h2 className="text-2xl font-bold mb-4">File Not Found</h2>
          <p className="text-muted-foreground mb-4">
            No filename specified or invalid file.
          </p>
        </div>
      </TestAppLayout>
    );
  }

  return (
    <TestAppLayout>
      <div className="cls_viewer_page flex flex-col h-full w-full">
        <div className="cls_viewer_page_header flex items-center gap-4 p-4 border-b bg-background mb-4">
          <h1 className="text-lg font-semibold truncate flex-1" title={filename}>
            {filename}
          </h1>
        </div>
        <div className="cls_viewer_page_content flex-1 overflow-hidden">
          {is_mounted ? (
            <Suspense
              fallback={
                <div className="cls_viewer_page_loading flex items-center justify-center h-full">
                  <div className="text-muted-foreground">Loading PDF viewer...</div>
                </div>
              }
            >
              <PdfViewer
                url={pdf_url}
                config_file="hazo_pdf_config.ini"
                className="cls_viewer_page_pdf_viewer h-full w-full"
              />
            </Suspense>
          ) : (
            <div className="cls_viewer_page_loading flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading PDF viewer...</div>
            </div>
          )}
        </div>
      </div>
    </TestAppLayout>
  );
}

