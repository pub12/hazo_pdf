/**
 * Multi-File Demo Page
 * Demonstrates multi-file PDF viewer with file list
 */

"use client";

import { Suspense, lazy, useState, useEffect } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";
import type { FileItem, PdfAnnotation, UploadResult } from "@/app/lib/hazo_pdf";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

/**
 * Multi-file demo page component
 */
export default function MultiFileDemoPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load files from test-app directory on mount
  useEffect(() => {
    async function loadFiles() {
      try {
        const response = await fetch('/api/test-app/files');
        const data = await response.json();

        if (data.files && Array.isArray(data.files)) {
          // Convert to FileItem format
          const file_items: FileItem[] = data.files
            .filter((f: { name: string }) => f.name.endsWith('.pdf'))
            .map((f: { name: string }, index: number) => ({
              id: `file_${index}`,
              name: f.name,
              url: `/api/test-app/files/${encodeURIComponent(f.name)}`,
              type: 'pdf' as const,
              mime_type: 'application/pdf',
            }));
          setFiles(file_items);
        }
      } catch (error) {
        console.error('Failed to load files:', error);
        // Fallback to sample.pdf
        setFiles([{
          id: 'file_0',
          name: 'sample.pdf',
          url: '/api/test-app/files/sample.pdf',
          type: 'pdf',
          mime_type: 'application/pdf',
        }]);
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, []);

  const handle_file_select = (file: FileItem) => {
    console.log('File selected:', file.name);
  };

  const handle_file_delete = (file_id: string) => {
    setFiles(prev => prev.filter(f => f.id !== file_id));
  };

  const handle_files_change = (new_files: FileItem[]) => {
    setFiles(new_files);
  };

  // Upload handler - creates local blob URLs for demonstration
  const handle_upload = async (file: File, converted_pdf?: Uint8Array): Promise<UploadResult> => {
    console.log('Upload requested:', file.name, converted_pdf ? '(converted to PDF)' : '');

    // Create local blob URL for demonstration
    // Use new Uint8Array to ensure proper ArrayBuffer type for Blob constructor
    const blob = converted_pdf
      ? new Blob([new Uint8Array(converted_pdf)], { type: 'application/pdf' })
      : file;
    const url = URL.createObjectURL(blob);

    const new_file: FileItem = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: converted_pdf ? file.name.replace(/\.[^.]+$/, '.pdf') : file.name,
      url: url,
      type: 'pdf',
      mime_type: 'application/pdf',
      size: blob.size,
      is_converted: !!converted_pdf,
    };

    return {
      success: true,
      file: new_file,
    };
  };

  const handle_annotation_create = (annotation: PdfAnnotation) => {
    console.log('Annotation created:', annotation);
  };

  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">Multi-File Viewer Demo</h2>
          <p className="text-muted-foreground">
            PDF viewer with file list for switching between multiple documents.
            Features include file upload with conversion (images, text, HTML to PDF),
            popout to new tab, and file management.
          </p>
        </div>

        {/* Code Example */}
        <CodePreview
          title="Code Example"
          code={`import { PdfViewer, FileItem, UploadResult } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function App() {
  const [files, setFiles] = useState<FileItem[]>([
    { id: '1', name: 'document1.pdf', url: '/docs/doc1.pdf', type: 'pdf' },
    { id: '2', name: 'document2.pdf', url: '/docs/doc2.pdf', type: 'pdf' },
  ]);

  // Optional upload handler for file uploads/conversions
  const handle_upload = async (file: File, converted_pdf?: Uint8Array): Promise<UploadResult> => {
    const blob = converted_pdf
      ? new Blob([converted_pdf], { type: 'application/pdf' })
      : file;
    const url = URL.createObjectURL(blob);
    return {
      success: true,
      file: {
        id: Date.now().toString(),
        name: converted_pdf ? file.name.replace(/\\.[^.]+$/, '.pdf') : file.name,
        url,
        type: 'pdf',
      },
    };
  };

  return (
    <PdfViewer
      files={files}
      on_file_select={(file) => console.log('Selected:', file.name)}
      on_file_delete={(id) => setFiles(f => f.filter(x => x.id !== id))}
      on_files_change={(newFiles) => setFiles(newFiles)}
      on_upload={handle_upload}
      enable_popout={true}           // Enable popout to new tab
      popout_route="/pdf-viewer"     // Route for popout destination
      viewer_title="My Documents"    // Title shown in new tab
      className="h-full w-full"
    />
  );
}`}
        />

        {/* PDF Viewer */}
        <div className="cls_demo_viewer flex-1 min-h-[500px] border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading files...</div>
          ) : (
            <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
              <PdfViewer
                files={files}
                on_file_select={handle_file_select}
                on_file_delete={handle_file_delete}
                on_upload={handle_upload}
                on_files_change={handle_files_change}
                on_annotation_create={handle_annotation_create}
                enable_popout={true}
                popout_route="/pdf-viewer"
                viewer_title="Hazo PDF Viewer"
                className="h-full w-full"
              />
            </Suspense>
          )}
        </div>
      </div>
    </TestAppLayout>
  );
}
