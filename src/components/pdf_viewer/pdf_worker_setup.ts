/**
 * PDF Worker Setup
 * Configures pdfjs-dist to use Web Workers for PDF processing
 * This ensures PDF parsing and rendering happens off the main thread
 */

import { GlobalWorkerOptions, getDocument, version, type PDFDocumentProxy } from 'pdfjs-dist';

// Configure the worker globally
// Get the version dynamically from the installed pdfjs-dist package
if (typeof window !== 'undefined') {
  // Use CDN with the current version from the installed package
  // Using jsdelivr CDN which has all npm package versions
  const pdfjsVersion = version;
  
  // jsdelivr CDN - supports all npm package versions
  GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  
  console.log(`[PDF Worker] Worker configured: ${GlobalWorkerOptions.workerSrc}`);
  
  // Alternative CDN options (uncomment to use):
  // - cdnjs (may not have all versions): `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`
  // - unpkg: `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`
  
  // For offline/local development, you can:
  // 1. Copy pdfjs-dist/build/pdf.worker.min.mjs to your public folder
  // 2. Set: GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Load a PDF document from a URL or ArrayBuffer
 * For local files (like in Storybook), fetch as ArrayBuffer for better compatibility
 * @param source - URL string, ArrayBuffer, or Uint8Array
 * @returns Promise resolving to PDFDocumentProxy
 */
export async function load_pdf_document(
  source: string | ArrayBuffer | Uint8Array
): Promise<PDFDocumentProxy> {
  console.log('[PDF Loader] Loading PDF from:', typeof source === 'string' ? source : 'ArrayBuffer/Uint8Array');
  
  try {
    // If source is a URL string, try to fetch it as ArrayBuffer for better compatibility
    let pdfData: ArrayBuffer | Uint8Array | string = source;
    
    if (typeof source === 'string') {
      // Check if it's a relative URL (likely a local file)
      if (source.startsWith('/') || source.startsWith('./') || !source.includes('://')) {
        console.log('[PDF Loader] Fetching local PDF file as ArrayBuffer:', source);
        try {
          const response = await fetch(source);
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
          }
          pdfData = await response.arrayBuffer();
          console.log('[PDF Loader] PDF fetched successfully, size:', pdfData.byteLength, 'bytes');
        } catch (fetchError) {
          console.error('[PDF Loader] Error fetching PDF as ArrayBuffer, trying URL directly:', fetchError);
          // Fall back to URL if fetch fails
          pdfData = source;
        }
      }
    }
    
    const loading_task = getDocument({
      url: typeof pdfData === 'string' ? pdfData : undefined,
      data: typeof pdfData !== 'string' ? pdfData : undefined,
      verbosity: 0, // Suppress console warnings
      // Add CORS support
      httpHeaders: {},
      withCredentials: false,
      // Enable range requests for better performance
      rangeChunkSize: 65536,
    });
    
    const document = await loading_task.promise;
    console.log('[PDF Loader] PDF loaded successfully:', document.numPages, 'pages');
    return document;
  } catch (error) {
    console.error('[PDF Loader] Error loading PDF:', error);
    throw error;
  }
}

/**
 * Export the configured pdfjs-dist for use in components
 */
export { getDocument, GlobalWorkerOptions };
export type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
