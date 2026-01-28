/**
 * Server Extract Demo Page
 * Demonstrates the extract_document_data function from hazo_pdf/server
 */

"use client";

import { Suspense, lazy, useState, useEffect, useRef, useCallback } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";
import type { PdfViewerRef } from "@/app/lib/hazo_pdf";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

interface FileInfo {
  name: string;
  path: string;
}

interface ExtractionResult {
  success: boolean;
  data?: Record<string, unknown>;
  extraction_id?: string;
  file_id?: string;
  file_path?: string;
  successful_steps?: number;
  total_steps?: number;
  stop_reason?: string;
  error?: string;
}

/**
 * Simple highlight region - just field name and value for text search
 */
interface HighlightField {
  field_name: string;
  value: string;
  page_index: number;
}

/**
 * Parse extraction data to find highlightable fields
 * Looks inside a nested key (default: "raw_data") for string values to highlight
 * Falls back to top-level search if the nested key doesn't exist
 */
function parse_highlightable_fields(
  data: Record<string, unknown>,
  raw_data_key: string = "raw_data"
): HighlightField[] {
  const fields: HighlightField[] = [];
  const seen_values = new Set<string>(); // Dedupe same values

  // Determine source object - look inside raw_data_key first, fall back to top level
  let source_data = data;
  if (raw_data_key && data[raw_data_key] && typeof data[raw_data_key] === 'object') {
    source_data = data[raw_data_key] as Record<string, unknown>;
    console.log(`[parse_highlightable_fields] Using nested key "${raw_data_key}" with ${Object.keys(source_data).length} fields`);
  } else {
    console.log(`[parse_highlightable_fields] Key "${raw_data_key}" not found, using top-level data`);
  }

  // Iterate all key-value pairs and create highlights for any non-empty string value
  for (const [key, value] of Object.entries(source_data)) {
    if (value === null || value === undefined) continue;

    // Handle both simple values and objects with 'value' property
    let actualValue: string;
    if (typeof value === 'object' && value !== null && 'value' in value) {
      actualValue = String((value as { value: unknown }).value);
    } else {
      actualValue = String(value);
    }

    // Skip empty values
    if (!actualValue || actualValue.trim() === '') continue;

    // Normalize value for deduplication (remove formatting)
    const normalized = actualValue.replace(/[,\s]/g, '');

    // Only add if we haven't seen this value (avoids duplicate highlights)
    if (!seen_values.has(normalized)) {
      seen_values.add(normalized);
      fields.push({
        field_name: key,
        value: actualValue,
        page_index: 0, // Default to first page
      });
    }
  }

  return fields;
}

/**
 * Server Extract demo page component
 */
export default function ServerExtractDemoPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [promptArea, setPromptArea] = useState<string>("document");
  const [promptKey, setPromptKey] = useState<string>("initial_classification");
  const [saveToHazoFiles, setSaveToHazoFiles] = useState<boolean>(true);
  const [rawDataKey, setRawDataKey] = useState<string>("raw_data");
  const [docDataKey, setDocDataKey] = useState<string>("doc_data");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PDF Viewer state
  const [show_viewer, set_show_viewer] = useState(false);
  const [highlight_fields, set_highlight_fields] = useState<HighlightField[]>([]);
  const [_pdf_dims, set_pdf_dims] = useState<{ width: number; height: number }>({ width: 612, height: 792 });
  const viewer_ref = useRef<PdfViewerRef>(null);

  // Search PDF text layer for a value and return its position with padding
  const find_text_position = useCallback(async (
    pdf: import('pdfjs-dist').PDFDocumentProxy,
    searchValue: string,
    pageIndex: number
  ): Promise<{ x: number; y: number; width: number; height: number } | null> => {
    try {
      const page = await pdf.getPage(pageIndex + 1); // 1-based
      const textContent = await page.getTextContent();

      // Normalize search value (remove commas, spaces)
      const normalizedSearch = searchValue.toString().replace(/[,\s]/g, '').toLowerCase();
      console.log(`[TextSearch] Searching for "${searchValue}" (normalized: "${normalizedSearch}") on page ${pageIndex + 1}`);

      // Padding to add around the text for better visibility
      const PADDING_X = 2;
      const PADDING_Y = 1;
      // Offset to push highlight down (negative in PDF coords = down visually)
      const Y_OFFSET = -3;

      // First pass: look for exact match
      for (const item of textContent.items) {
        if ('str' in item) {
          const textItem = item as { str: string; transform: number[]; width?: number; height?: number };
          const normalizedText = textItem.str.replace(/[,\s]/g, '').toLowerCase();

          // Only match if this text item equals our search value
          if (normalizedText === normalizedSearch) {
            const x = textItem.transform[4];
            const y = textItem.transform[5];
            const fontSize = Math.abs(textItem.transform[0]) || 10;
            // Calculate width based on character count and font size
            const baseWidth = textItem.width || (textItem.str.length * fontSize * 0.55);
            const baseHeight = textItem.height || fontSize;

            // Add padding for better visibility
            const width = baseWidth + (PADDING_X * 2);
            const height = baseHeight + (PADDING_Y * 2);

            console.log(`[TextSearch] EXACT match "${textItem.str}" at PDF coords (${x.toFixed(1)}, ${y.toFixed(1)}), size: ${width.toFixed(1)}x${height.toFixed(1)}`);
            return {
              x: x - PADDING_X,
              y: y - PADDING_Y + Y_OFFSET,
              width,
              height
            };
          }
        }
      }

      // Second pass: look for partial match (text item contains search value)
      for (const item of textContent.items) {
        if ('str' in item) {
          const textItem = item as { str: string; transform: number[]; width?: number; height?: number };
          const normalizedText = textItem.str.replace(/[,\s]/g, '').toLowerCase();

          if (normalizedText.includes(normalizedSearch) && normalizedSearch.length >= 3) {
            const x = textItem.transform[4];
            const y = textItem.transform[5];
            const fontSize = Math.abs(textItem.transform[0]) || 10;
            const baseWidth = textItem.width || (textItem.str.length * fontSize * 0.55);
            const baseHeight = textItem.height || fontSize;
            const width = baseWidth + (PADDING_X * 2);
            const height = baseHeight + (PADDING_Y * 2);

            console.log(`[TextSearch] PARTIAL match "${textItem.str}" contains "${searchValue}" at PDF coords (${x.toFixed(1)}, ${y.toFixed(1)})`);
            return {
              x: x - PADDING_X,
              y: y - PADDING_Y + Y_OFFSET,
              width,
              height
            };
          }
        }
      }

      console.log(`[TextSearch] No match found for "${searchValue}"`);
      return null;
    } catch (err) {
      console.error('[TextSearch] Error:', err);
      return null;
    }
  }, []);

  // Handle PDF load - get page dimensions and find text positions
  const handle_pdf_load = useCallback(async (pdf: import('pdfjs-dist').PDFDocumentProxy) => {
    console.log('[ServerExtract] PDF loaded, getting page dimensions');

    try {
      // Get first page to determine dimensions
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      const dims = { width: viewport.width, height: viewport.height };
      console.log('[ServerExtract] PDF page dimensions:', dims);
      set_pdf_dims(dims);

      // Wait a bit for viewer to render
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!viewer_ref.current || highlight_fields.length === 0) {
        return;
      }

      console.log('[ServerExtract] Searching for text positions for', highlight_fields.length, 'fields');

      // For each field, search for the value in the PDF text layer
      for (const field of highlight_fields) {
        const value = field.value;
        if (!value) continue;

        // Search for the text in the PDF
        const textPos = await find_text_position(pdf, value, field.page_index);

        if (textPos) {
          // Use actual text position from PDF (already in PDF coordinates)
          const finalRect: [number, number, number, number] = [
            textPos.x,
            textPos.y,
            textPos.x + textPos.width,
            textPos.y + textPos.height
          ];
          console.log(`[ServerExtract] Highlighting ${field.field_name}="${value}" at (${finalRect[0].toFixed(1)}, ${finalRect[1].toFixed(1)}) to (${finalRect[2].toFixed(1)}, ${finalRect[3].toFixed(1)})`);

          // Create highlight
          const id = viewer_ref.current.highlight_region(
            field.page_index,
            finalRect,
            {
              border_color: '#FF6B00',
              background_color: '#FFF3E0',
              background_opacity: 0.3,
              border_width: 1,
            }
          );
          console.log('[ServerExtract] Highlight created with id:', id);
        } else {
          console.log(`[ServerExtract] Text "${value}" not found in PDF for ${field.field_name}`);
        }
      }
    } catch (err) {
      console.error('[ServerExtract] Failed to process PDF:', err);
    }
  }, [highlight_fields, find_text_position]);

  // Get PDF URL for viewer
  const get_pdf_url = useCallback(() => {
    if (!selectedFile) return '';
    const filename = selectedFile.split('/').pop() || '';
    return `/api/test-app/files/${encodeURIComponent(filename)}`;
  }, [selectedFile]);

  // Fetch available PDF files
  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch("/api/test-app/files");
        if (response.ok) {
          const data = await response.json();
          setFiles(data.files || []);
          if (data.files?.length > 0) {
            setSelectedFile(data.files[0].path);
          }
        }
      } catch (err) {
        console.error("Failed to fetch files:", err);
      }
    }
    fetchFiles();
  }, []);

  // Handle extraction
  async function handleExtract() {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Read the file and convert to base64
      const fileResponse = await fetch(`/api/test-app/files/${encodeURIComponent(selectedFile.split("/").pop() || "")}`);
      if (!fileResponse.ok) {
        throw new Error("Failed to load file");
      }

      const arrayBuffer = await fileResponse.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // Call the extract API
      const extractResponse = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_b64: base64,
          document_mime_type: "application/pdf",
          prompt_area: promptArea,
          prompt_key: promptKey,
          file_path: selectedFile,
          storage_type: "local",
          save_to_hazo_files: saveToHazoFiles,
        }),
      });

      const data = await extractResponse.json();

      if (!data.success) {
        setError(data.error || "Extraction failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full overflow-auto">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">Server Extract</h2>
          <p className="text-muted-foreground">
            Extract structured data from PDFs using hazo_pdf/server&apos;s extract_document_data function.
          </p>
        </div>

        {/* Code Example */}
        <CodePreview
          title="Server-Side Usage (API Route)"
          code={`// In your API route (e.g., app/api/extract/route.ts)
import { extract_document_data } from 'hazo_pdf/server';

// Extract from a file path
const result = await extract_document_data(
  { file_path: '/path/to/document.pdf' },
  {
    prompt_area: 'document',
    prompt_key: 'initial_classification',
    save_to_hazo_files: true,
  }
);

// Or extract from a hazo_files record ID
const result = await extract_document_data(
  { file_id: 'abc-123' },
  {
    prompt_area: 'invoice',
    prompt_key: 'extract_line_items',
    sqlite_path: './data/app.sqlite',
  }
);

// Result contains:
// - success: boolean
// - data: extracted JSON data
// - extraction_id: hazo_files extraction record ID
// - file_id: hazo_files file record ID
// - successful_steps / total_steps: prompt chain progress
// - stop_reason: why extraction stopped`}
        />

        {/* Extraction Form */}
        <div className="cls_extract_form bg-gray-50 border rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">Test Extraction</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">PDF File</label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-white"
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                disabled={loading}
              >
                {files.length === 0 && <option value="">No files available</option>}
                {files.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt Area */}
            <div>
              <label className="block text-sm font-medium mb-1">Prompt Area</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={promptArea}
                onChange={(e) => setPromptArea(e.target.value)}
                placeholder="e.g., document"
                disabled={loading}
              />
            </div>

            {/* Prompt Key */}
            <div>
              <label className="block text-sm font-medium mb-1">Prompt Key</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={promptKey}
                onChange={(e) => setPromptKey(e.target.value)}
                placeholder="e.g., initial_classification"
                disabled={loading}
              />
            </div>

            {/* Doc Data Key */}
            <div>
              <label className="block text-sm font-medium mb-1">Doc Data Key</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={docDataKey}
                onChange={(e) => setDocDataKey(e.target.value)}
                placeholder="e.g., doc_data"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nested key containing processed values for display
              </p>
            </div>

            {/* Raw Data Key */}
            <div>
              <label className="block text-sm font-medium mb-1">Raw Data Key</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={rawDataKey}
                onChange={(e) => setRawDataKey(e.target.value)}
                placeholder="e.g., raw_data"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nested key containing string values for highlighting
              </p>
            </div>

            {/* Save to hazo_files */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToHazoFiles}
                  onChange={(e) => setSaveToHazoFiles(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Save to hazo_files</span>
              </label>
            </div>
          </div>

          {/* Extract Button */}
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleExtract}
            disabled={loading || !selectedFile}
          >
            {loading ? "Extracting..." : "Extract Data"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="cls_extract_error bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="cls_extract_result bg-white border rounded-lg p-4 flex-1 overflow-auto">
            <h3 className="font-semibold mb-3">Extraction Result</h3>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500">Success:</span>{" "}
                <span className={result.success ? "text-green-600" : "text-red-600"}>
                  {result.success ? "Yes" : "No"}
                </span>
              </div>
              {result.extraction_id && (
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Extraction ID:</span>{" "}
                  <span className="font-mono text-xs">{result.extraction_id}</span>
                </div>
              )}
              {result.successful_steps !== undefined && (
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Steps:</span>{" "}
                  {result.successful_steps}/{result.total_steps}
                </div>
              )}
              {result.stop_reason && (
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Stop Reason:</span>{" "}
                  {result.stop_reason}
                </div>
              )}
            </div>

            {/* Extracted Data */}
            {result.data && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-600">Extracted Data:</h4>
                  <div className="flex gap-2">
                    {/* Preview PDF Button - always show */}
                    <button
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      onClick={() => {
                        set_highlight_fields([]);
                        set_show_viewer(true);
                      }}
                    >
                      Preview PDF
                    </button>
                    {/* View PDF with Highlights Button - show if there are highlightable fields */}
                    {(() => {
                      const fields = parse_highlightable_fields(result.data as Record<string, unknown>, rawDataKey);
                      if (fields.length > 0) {
                        return (
                          <button
                            className="px-3 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600"
                            onClick={() => {
                              console.log('[ServerExtract] Fields to highlight:', fields);
                              set_highlight_fields(fields);
                              set_show_viewer(true);
                            }}
                          >
                            View with Highlights ({fields.length})
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm max-h-[400px]">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* PDF Viewer Modal */}
        {show_viewer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="cls_extract_viewer w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden shadow-xl flex flex-col">
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
                  <PdfViewer
                    ref={viewer_ref}
                    url={get_pdf_url()}
                    className="h-full w-full"
                    on_close={() => {
                      viewer_ref.current?.clear_all_highlights();
                      set_show_viewer(false);
                    }}
                    on_load={handle_pdf_load}
                    doc_data={result?.data?.[docDataKey] as Record<string, unknown> | undefined}
                    highlight_fields_info={highlight_fields.map(f => ({ field_name: f.field_name, value: f.value }))}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </div>
    </TestAppLayout>
  );
}
