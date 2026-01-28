/**
 * Type definitions for server-side document extraction
 * Used by extract_document_data() utility
 */

import type { Logger } from '../utils/logger';
import type { FileAccessProvider } from '../types/file_access';

/**
 * Document source - either a file path/URL or a hazo_files record ID
 * Mutually exclusive: provide either file_path or file_id
 */
export interface ExtractDocumentSource {
  /** Path to local file or HTTP(S) URL */
  file_path?: string;
  /** hazo_files record ID (requires sqlite_path or file_manager for Google Drive) */
  file_id?: string;
}

/**
 * Options for document extraction
 */
export interface ExtractDocumentOptions {
  /** Prompt area for hazo_llm_api lookup (e.g., "document", "invoice") */
  prompt_area: string;
  /** Prompt key for hazo_llm_api lookup (e.g., "initial_classification") */
  prompt_key: string;
  /** Path to SQLite database (defaults to hazo_llm_api config sqlite_path) */
  sqlite_path?: string;
  /** Logger instance for logging */
  logger?: Logger;
  /** File access provider for Google Drive (required when file_id uses remote storage) */
  file_manager?: FileAccessProvider;
  /** Storage type hint for hazo_files ('local' | 'google_drive', default: 'local') */
  storage_type?: 'local' | 'google_drive';
  /** Whether to save extraction result to hazo_files (default: true) */
  save_to_hazo_files?: boolean;
  /** Maximum prompt chain depth (default: 10) */
  max_depth?: number;
  /** Whether to continue extraction chain on error (default: false) */
  continue_on_error?: boolean;
  /** Optional filename for hazo_files record (auto-detected if not provided) */
  filename?: string;
  /** Optional MIME type (auto-detected for PDFs) */
  mime_type?: string;
  /** Original file path/URL for hazo_files storage (when actual extraction uses temp file) */
  original_file_path?: string;
}

/**
 * Result of document extraction
 */
export interface ExtractDocumentResult {
  /** Whether extraction was successful */
  success: boolean;
  /** Extracted data (merged from all prompt chain steps) */
  data?: Record<string, unknown>;
  /** hazo_files extraction record ID (if saved) */
  extraction_id?: string;
  /** hazo_files file record ID */
  file_id?: string;
  /** File path that was processed */
  file_path?: string;
  /** Number of successful extraction steps */
  successful_steps?: number;
  /** Total number of extraction steps attempted */
  total_steps?: number;
  /** Reason extraction chain stopped */
  stop_reason?: string;
  /** Error message if extraction failed */
  error?: string;
  /** Individual step results (for debugging) */
  step_results?: ExtractStepResult[];
}

/**
 * Result from a single extraction step (prompt chain)
 */
export interface ExtractStepResult {
  /** Prompt area used */
  prompt_area: string;
  /** Prompt key used */
  prompt_key: string;
  /** Whether this step succeeded */
  success: boolean;
  /** Extracted data from this step */
  data?: Record<string, unknown>;
  /** Error message if step failed */
  error?: string;
}
