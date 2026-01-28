/**
 * Server-side entry point for hazo_pdf
 * Provides document extraction utilities for server-side usage
 *
 * IMPORTANT: This module is server-only and will throw if imported in the browser
 *
 * @example
 * import { extract_document_data } from 'hazo_pdf/server';
 *
 * const result = await extract_document_data(
 *   { file_path: '/path/to/document.pdf' },
 *   { prompt_area: 'document', prompt_key: 'initial_classification' }
 * );
 */

// Runtime guard - prevent browser usage
if (typeof window !== 'undefined') {
  throw new Error(
    'hazo_pdf/server cannot be imported in the browser. ' +
    'This module is server-only and requires Node.js runtime.'
  );
}

// Export extraction utilities
export { extract_document_data, reset_extraction_state } from './extract';

// Export types
export type {
  ExtractDocumentSource,
  ExtractDocumentOptions,
  ExtractDocumentResult,
  ExtractStepResult,
} from './types';
