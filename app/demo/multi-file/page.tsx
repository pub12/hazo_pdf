/**
 * Multi-File Demo Page
 * Demonstrates multi-file PDF viewer with file list
 */

"use client";

import { Suspense, lazy, useState, useEffect } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";
import type { FileItem, PdfAnnotation, UploadResult, FileMetadataInput, FileMetadataItem, Logger } from "@/app/lib/hazo_pdf";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

/**
 * Database file metadata record from /api/files
 */
interface DbFileMetadataRecord {
  id: string;
  filename: string;
  file_type: string;
  file_data: {
    raw_data?: Array<{
      id: string;
      extracted_at: string;
      data: Record<string, unknown>;
    }>;
    merged_data?: Record<string, unknown>;
    [key: string]: unknown;
  };
  file_path: string;
  storage_type: string;
  created_at: string;
  changed_at: string;
}

/**
 * Transform database extraction data to FileMetadataItem format
 * Extracts values from nested structure like { value: "166,410", page_no: 1, ... }
 */
function transform_db_to_file_metadata(records: DbFileMetadataRecord[]): FileMetadataInput {
  return records.map((record): FileMetadataItem => {
    const file_data: Record<string, string | Array<Record<string, string>>> = {};

    // Get extraction data - prefer merged_data, fall back to latest raw_data
    const extraction = record.file_data?.merged_data ||
      (record.file_data?.raw_data?.[0]?.data);

    if (extraction && typeof extraction === 'object') {
      for (const [key, value] of Object.entries(extraction)) {
        if (value === null || value === undefined) {
          continue;
        }
        // Handle nested object with 'value' field (extraction result format)
        if (typeof value === 'object' && !Array.isArray(value) && 'value' in value) {
          const extracted_value = (value as { value: unknown }).value;
          if (extracted_value !== null && extracted_value !== undefined) {
            file_data[key] = String(extracted_value);
          }
        }
        // Handle arrays (tables)
        else if (Array.isArray(value)) {
          const rows = value.map((row) => {
            const transformed_row: Record<string, string> = {};
            if (typeof row === 'object' && row !== null) {
              for (const [row_key, row_value] of Object.entries(row)) {
                if (row_value !== null && row_value !== undefined) {
                  // Handle nested value objects in arrays too
                  if (typeof row_value === 'object' && 'value' in row_value) {
                    transformed_row[row_key] = String((row_value as { value: unknown }).value);
                  } else {
                    transformed_row[row_key] = String(row_value);
                  }
                }
              }
            }
            return transformed_row;
          }).filter((row) => Object.keys(row).length > 0);
          if (rows.length > 0) {
            file_data[key] = rows;
          }
        }
        // Handle simple string/number values
        else if (typeof value === 'string' || typeof value === 'number') {
          file_data[key] = String(value);
        }
      }
    }

    return {
      filename: record.filename,
      file_data,
    };
  });
}

/**
 * Create a logger instance for the test app
 * Uses hazo_logs if available, falls back to console
 * Note: In browser environments, hazo_logs will fail to initialize
 * (since it requires Node.js fs/winston) and we fall back to console
 */
async function create_test_logger(): Promise<Logger | undefined> {
  try {
    // Try to dynamically import hazo_logs
    const { createLogger } = await import('hazo_logs');
    const logger = createLogger('hazo_pdf_test');
    console.log('[TestApp] hazo_logs initialized successfully');
    return logger;
  } catch (error) {
    // hazo_logs not available or failed to initialize (expected in browser)
    console.log('[TestApp] hazo_logs not available, using console fallback:',
      error instanceof Error ? error.message : 'unknown error');
    return undefined;
  }
}

/**
 * Sample file metadata for testing the file metadata sidepanel
 * Demonstrates flexible JSON structure with field values and tables
 */
const sample_file_metadata: FileMetadataInput = [
  {
    filename: 'sample.pdf',
    file_data: {
      name: 'Australian Tax Office - Income Statement',
      vendor: 'Australian Government',
      document_type: 'Tax Document',
      tax_year: '2023-24',
      income_summary: [
        { source: 'Salary/Wages', gross_amount: '$85,000.00', tax_withheld: '$22,500.00' },
        { source: 'Interest Income', gross_amount: '$1,250.00', tax_withheld: '$0.00' },
        { source: 'Dividends', gross_amount: '$2,500.00', tax_withheld: '$750.00' }
      ],
      deductions: [
        { category: 'Work-related expenses', amount: '$1,200.00' },
        { category: 'Self-education', amount: '$500.00' }
      ]
    }
  },
  {
    filename: 'report.pdf',
    file_data: {
      name: 'Quarterly Financial Report',
      vendor: 'Finance Department',
      document_type: 'Report',
      period: 'Q4 2024',
      metrics: [
        { metric: 'Revenue', value: '$1,250,000', change: '+15%' },
        { metric: 'Expenses', value: '$850,000', change: '+8%' }
      ]
    }
  }
];

/**
 * Multi-file demo page component
 */
export default function MultiFileDemoPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [logger, setLogger] = useState<Logger | undefined>(undefined);
  // State for extracted data from LLM
  const [extracted_data, setExtractedData] = useState<Record<string, unknown> | null>(null);
  // State for file metadata from database
  const [db_file_metadata, setDbFileMetadata] = useState<FileMetadataInput>([]);

  // Initialize logger on mount
  useEffect(() => {
    create_test_logger().then(setLogger);
  }, []);

  // Fetch file metadata from database on mount
  useEffect(() => {
    async function fetchDbMetadata() {
      try {
        const response = await fetch('/api/files');
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const transformed = transform_db_to_file_metadata(data.data as DbFileMetadataRecord[]);
          setDbFileMetadata(transformed);
          console.log('[MultiFileDemo] Loaded file metadata from database:', transformed.length, 'records');
        }
      } catch (error) {
        console.warn('[MultiFileDemo] Failed to load file metadata from database:', error);
      }
    }
    fetchDbMetadata();
  }, []);

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

  // Upload handler - saves files to test_app_directory for persistence
  const handle_upload = async (file: File, converted_pdf?: Uint8Array): Promise<UploadResult> => {
    console.log('Upload requested:', file.name, converted_pdf ? '(converted to PDF)' : '');

    try {
      // Create the file/blob to upload
      const filename = converted_pdf ? file.name.replace(/\.[^.]+$/, '.pdf') : file.name;
      const blob = converted_pdf
        ? new Blob([new Uint8Array(converted_pdf)], { type: 'application/pdf' })
        : file;

      // Upload to server for persistence
      const form_data = new FormData();
      form_data.append('file', blob, filename);
      form_data.append('filename', filename);

      const response = await fetch('/api/test-app/files', {
        method: 'POST',
        body: form_data,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Upload failed:', result.error);
        return {
          success: false,
          error: result.error || 'Upload failed',
        };
      }

      const new_file: FileItem = {
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: result.file.name,
        url: result.file.url,
        type: 'pdf',
        mime_type: 'application/pdf',
        size: result.file.size,
        is_converted: !!converted_pdf,
      };

      console.log('File uploaded successfully:', new_file.name);

      return {
        success: true,
        file: new_file,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  };

  const handle_annotation_create = (annotation: PdfAnnotation) => {
    console.log('Annotation created:', annotation);
  };

  // Handle extraction complete callback
  const handle_extract_complete = async (data: Record<string, unknown>) => {
    console.log('[MultiFileDemo] Extraction complete:', data);
    setExtractedData(data);

    // Refresh file metadata from database to show newly extracted data
    try {
      const response = await fetch('/api/files');
      const db_data = await response.json();

      if (db_data.success && Array.isArray(db_data.data)) {
        const transformed = transform_db_to_file_metadata(db_data.data as DbFileMetadataRecord[]);
        setDbFileMetadata(transformed);
        console.log('[MultiFileDemo] Refreshed file metadata after extraction');
      }
    } catch (error) {
      console.warn('[MultiFileDemo] Failed to refresh file metadata:', error);
    }
  };

  // Handle extraction error callback
  const handle_extract_error = (error: Error) => {
    console.error('[MultiFileDemo] Extraction error:', error.message);
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
                file_metadata={[...db_file_metadata, ...sample_file_metadata]}
                logger={logger}
                // Data extraction props
                extract_api_endpoint="/api/extract"
                extract_prompt_area="document"
                extract_prompt_key="initial_classification"
                on_extract_complete={handle_extract_complete}
                on_extract_error={handle_extract_error}
                className="h-full w-full"
              />
            </Suspense>
          )}
        </div>

        {/* Extracted Data Display */}
        {extracted_data && (
          <div className="cls_demo_extracted_data mt-4 p-4 border rounded-lg bg-slate-50">
            <h3 className="text-lg font-semibold mb-2">Extracted Data (from LLM)</h3>
            <pre className="text-sm overflow-auto max-h-60 p-2 bg-white border rounded">
              {JSON.stringify(extracted_data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </TestAppLayout>
  );
}
