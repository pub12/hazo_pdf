/**
 * Server Extract Demo Page
 * Demonstrates the extract_document_data function from hazo_pdf/server
 */

"use client";

import { Suspense, lazy, useState, useEffect, useRef, useCallback } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";

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
        {/* Modern Header */}
        <div className="cls_demo_header mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Server Extract
              </h2>
              <p className="text-sm text-gray-500">
                Extract structured data from PDFs using LLM-powered analysis
              </p>
            </div>
          </div>
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

        {/* Modern Extraction Form */}
        <div className="cls_extract_form bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Test Extraction
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* File Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">PDF File</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Prompt Area</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                  value={promptArea}
                  onChange={(e) => setPromptArea(e.target.value)}
                  placeholder="e.g., document"
                  disabled={loading}
                />
              </div>

              {/* Prompt Key */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Prompt Key</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                  value={promptKey}
                  onChange={(e) => setPromptKey(e.target.value)}
                  placeholder="e.g., initial_classification"
                  disabled={loading}
                />
              </div>

              {/* Doc Data Key */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Doc Data Key</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                  value={docDataKey}
                  onChange={(e) => setDocDataKey(e.target.value)}
                  placeholder="e.g., doc_data"
                  disabled={loading}
                />
                <p className="text-xs text-gray-400">
                  Nested key containing processed values for display
                </p>
              </div>

              {/* Raw Data Key */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Raw Data Key</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                  value={rawDataKey}
                  onChange={(e) => setRawDataKey(e.target.value)}
                  placeholder="e.g., raw_data"
                  disabled={loading}
                />
                <p className="text-xs text-gray-400">
                  Nested key containing string values for highlighting
                </p>
              </div>

              {/* Save to hazo_files */}
              <div className="flex items-center pt-7">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToHazoFiles}
                    onChange={(e) => setSaveToHazoFiles(e.target.checked)}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">Save to hazo_files</span>
                </label>
              </div>
            </div>

            {/* Extract Button */}
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
              onClick={handleExtract}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extracting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Extract Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="cls_extract_error rounded-xl p-6 mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-1">Extraction Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
                {error.includes('hazo_llm_api') && (
                  <div className="mt-3 p-3 bg-white/60 rounded-lg border border-red-100">
                    <p className="text-xs text-gray-600 mb-2">To enable server extraction, install the required dependency:</p>
                    <code className="text-xs bg-gray-900 text-green-400 px-3 py-1.5 rounded block font-mono">
                      npm install hazo_llm_api
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="cls_extract_result bg-white border border-gray-200 rounded-2xl shadow-sm flex-1 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Extraction Result
              </h3>
            </div>

            <div className="p-6">
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${result.success ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className={`font-semibold ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {result.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>
                {result.extraction_id && (
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Extraction ID</span>
                    <div className="mt-1 font-mono text-xs text-gray-700 truncate" title={result.extraction_id}>
                      {result.extraction_id.slice(0, 12)}...
                    </div>
                  </div>
                )}
                {result.successful_steps !== undefined && (
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Steps</span>
                    <div className="mt-1 font-semibold text-gray-700">
                      {result.successful_steps} / {result.total_steps}
                    </div>
                  </div>
                )}
                {result.stop_reason && (
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Stop Reason</span>
                    <div className="mt-1 text-sm text-gray-700 truncate" title={result.stop_reason}>
                      {result.stop_reason}
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Data */}
              {result.data && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Extracted Data</h4>
                    <div className="flex gap-2">
                      {/* Preview PDF Button */}
                      <button
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        onClick={() => {
                          set_highlight_fields([]);
                          set_show_viewer(true);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview PDF
                      </button>
                      {/* View with Highlights Button */}
                      {(() => {
                        const fields = parse_highlightable_fields(result.data as Record<string, unknown>, rawDataKey);
                        if (fields.length > 0) {
                          return (
                            <button
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-medium shadow-sm shadow-orange-500/20 transition-all"
                              onClick={() => {
                                console.log('[ServerExtract] Fields to highlight:', fields);
                                set_highlight_fields(fields);
                                set_show_viewer(true);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              View with Highlights ({fields.length})
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-auto text-sm max-h-[400px] font-mono leading-relaxed">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDF Viewer Modal */}
        {show_viewer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="cls_extract_viewer w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden shadow-xl flex flex-col">
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
                  <PdfViewer
                    url={get_pdf_url()}
                    className="h-full w-full"
                    on_close={() => {
                      set_show_viewer(false);
                    }}
                    doc_data={result?.data?.[docDataKey] as Record<string, unknown> | undefined}
                    highlight_fields_info={highlight_fields}
                    show_file_info_button={true}
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
