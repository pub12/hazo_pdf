"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "next/navigation";
import { TestAppLayout } from "../../test-app-layout";
import type { MetadataInput, MetadataDataItem } from "../../../src/types";

/**
 * Lazy load PdfViewer component only on client side
 * PDF.js requires client-side rendering only
 */
const PdfViewer = typeof window !== "undefined" 
  ? lazy(() => import("hazo_pdf").then((mod) => ({ default: mod.PdfViewer })))
  : () => null;

/**
 * Test metadata for sidepanel - demonstrates all variations
 * Includes different format types (h1-h5, body), editable and non-editable fields
 */
const test_metadata: MetadataInput = {
  header: [
    { style: 'h1', label: 'Document Information' },
    { style: 'h3', label: 'Test Document Metadata' },
    { style: 'body', label: 'Last updated: 2025-01-15' }
  ],
  data: [
    {
      label: 'Document Title',
      style: 'h2',
      value: 'Annual Report 2024',
      editable: true
    },
    {
      label: 'Author Information',
      style: 'h3',
      value: 'John Doe\nSenior Analyst\nDepartment of Finance',
      editable: true
    },
    {
      label: 'Document Status',
      style: 'h4',
      value: 'Approved',
      editable: false
    },
    {
      label: 'Version',
      style: 'h5',
      value: '1.0.0',
      editable: true
    },
    {
      label: 'Category',
      style: 'body',
      value: 'Financial Report',
      editable: false
    },
    {
      label: 'Keywords',
      style: 'body',
      value: 'financial, annual, report, 2024',
      editable: true
    },
    {
      label: 'Document ID',
      style: 'h5',
      value: 'DOC-2024-001',
      editable: false
    },
    {
      label: 'Notes',
      style: 'body',
      value: 'This document contains comprehensive financial data for the fiscal year 2024. Please review all sections carefully before finalizing.',
      editable: true
    },
    {
      label: 'Confidentiality Level',
      style: 'h4',
      value: 'Internal Use Only',
      editable: false
    },
    {
      label: 'Approval Date',
      style: 'body',
      value: '2025-01-10',
      editable: false
    }
  ],
  footer: [
    { style: 'body', label: 'This is a test metadata example' },
    { style: 'h5', label: 'Version 1.0 - Test App' }
  ]
};

/**
 * PDF Viewer page component
 * Displays a PDF file using the hazo_pdf PdfViewer component
 * Wrapped in TestAppLayout to show the sidebar
 */
export default function ViewerPage() {
  const params = useParams();
  const filename = params?.filename as string | undefined;
  const [is_mounted, setIsMounted] = useState(false);
  const [metadata, setMetadata] = useState<MetadataInput>(test_metadata);
  
  // Ensure component only renders on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Construct PDF URL - serve from API route
  const pdf_url = filename 
    ? `/api/test-app/files/${encodeURIComponent(filename)}`
    : null;

  // Handle metadata changes
  const handle_metadata_change = (updatedRow: MetadataDataItem, allData: MetadataInput) => {
    console.log('[TestApp] Metadata updated:', { updatedRow, allData });
    setMetadata(allData);
    // In a real app, you would save to backend here
    return { updatedRow, allData };
  };

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
                config_file="config/hazo_pdf_config.ini"
                className="cls_viewer_page_pdf_viewer h-full w-full"
                sidepanel_metadata_enabled={true}
                metadata_input={metadata}
                on_metadata_change={handle_metadata_change}
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

