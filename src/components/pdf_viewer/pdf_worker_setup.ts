/**
 * PDF Worker Setup
 * Configures pdfjs-dist to use Web Workers for PDF processing
 * This ensures PDF parsing and rendering happens off the main thread
 * 
 * IMPORTANT: This module uses dynamic imports to prevent SSR evaluation
 * PDF.js can only run in the browser, so we must avoid importing it during SSR
 */

// Type imports are safe - they don't execute code
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Track if worker has been configured to avoid multiple configurations
let worker_configured = false;

/**
 * Configure the PDF.js worker dynamically (only in browser)
 * This function must be called before loading any PDF documents
 * @returns Promise that resolves when worker is configured
 */
async function configure_worker(): Promise<void> {
  // Only configure in browser environment - double check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  
  // Skip if already configured
  if (worker_configured) {
    return;
  }
  
  try {
    // Use a dynamic import that only executes in browser
    // Wrap in a function that checks browser environment again
    const pdfjs_module = await (async () => {
      if (typeof window === 'undefined') {
        throw new Error('Cannot configure PDF.js worker in non-browser environment');
      }
      // Dynamic import - only loads in browser
      return await import('pdfjs-dist');
    })();
    
    const { GlobalWorkerOptions, version } = pdfjs_module;
    const pdfjsVersion = version;
    
    // jsdelivr CDN - supports all npm package versions
    GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
    
    console.log(`[PDF Worker] Worker configured: ${GlobalWorkerOptions.workerSrc}`);
    worker_configured = true;
    
    // Alternative CDN options (uncomment to use):
    // - cdnjs (may not have all versions): `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`
    // - unpkg: `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`
    
    // For offline/local development, you can:
    // 1. Copy pdfjs-dist/build/pdf.worker.min.mjs to your public folder
    // 2. Set: GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (error) {
    // Only log error if in browser - don't throw during SSR
    if (typeof window !== 'undefined') {
      console.error('[PDF Worker] Error configuring worker:', error);
      throw error;
    }
  }
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
  // Ensure we're in browser environment - multiple checks
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('load_pdf_document can only be called in the browser');
  }
  
  // Additional check: ensure we're not in Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    throw new Error('load_pdf_document cannot be called in Node.js environment');
  }
  
  // Configure worker first (idempotent - won't reconfigure if already done)
  await configure_worker();
  
  // Dynamic import of getDocument - direct import() for bundler compatibility
  const pdfjs_module = await import('pdfjs-dist');
  const { getDocument } = pdfjs_module;
  
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
 * Export types for use in components
 * Note: getDocument and GlobalWorkerOptions are not exported directly
 * to prevent SSR evaluation - use load_pdf_document instead
 */
export type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

/**
 * Export configure_worker for components that need to ensure worker is configured
 * This is called automatically by load_pdf_document, so you typically don't need this
 */
export { configure_worker };
