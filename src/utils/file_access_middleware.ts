/**
 * File Access Middleware
 * Provides abstraction for loading and saving PDF files
 * Supports both direct fetch (default) and hazo_files integration
 */

import type { FileAccessProvider } from '../types/file_access';
import { get_logger } from './logger';

/**
 * Load PDF data from a source (URL or hazo_files path)
 * @param source - URL or path to the PDF file
 * @param file_manager - Optional hazo_files FileAccessProvider for remote storage
 * @returns Promise with ArrayBuffer containing PDF data
 */
export async function load_pdf_data(
  source: string,
  file_manager?: FileAccessProvider
): Promise<ArrayBuffer> {
  const logger = get_logger();

  // If file_manager is provided and initialized, use it
  if (file_manager && file_manager.isInitialized()) {
    logger.debug(`[file_access_middleware] Loading PDF via hazo_files: ${source}`);

    const result = await file_manager.downloadFile(source);

    if (!result.success || !result.data) {
      const error_msg = result.error || 'Unknown error loading file';
      logger.error(`[file_access_middleware] Failed to load PDF via hazo_files: ${error_msg}`);
      throw new Error(`Failed to load PDF from storage: ${error_msg}`);
    }

    // Convert data to ArrayBuffer
    // Handle Buffer (Node.js), ArrayBuffer, or Uint8Array
    const data = result.data;
    if (data instanceof ArrayBuffer) {
      logger.debug(`[file_access_middleware] PDF loaded via hazo_files, size: ${data.byteLength} bytes`);
      return data;
    } else if (data instanceof Uint8Array) {
      // Uint8Array - get the underlying ArrayBuffer
      logger.debug(`[file_access_middleware] PDF loaded via hazo_files (Uint8Array), size: ${data.byteLength} bytes`);
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      // Node.js Buffer - convert to ArrayBuffer
      logger.debug(`[file_access_middleware] PDF loaded via hazo_files (Buffer), size: ${data.length} bytes`);
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }

    throw new Error('Unexpected data type from file manager');
  }

  // Default: use fetch
  logger.debug(`[file_access_middleware] Loading PDF via fetch: ${source}`);

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const array_buffer = await response.arrayBuffer();
  logger.debug(`[file_access_middleware] PDF loaded via fetch, size: ${array_buffer.byteLength} bytes`);

  return array_buffer;
}

/**
 * Save PDF data to remote storage via hazo_files
 * @param pdf_bytes - PDF data as Uint8Array
 * @param remote_path - Destination path in remote storage
 * @param file_manager - hazo_files FileAccessProvider
 * @param overwrite - Whether to overwrite existing file (default: true)
 * @returns Promise with save result
 */
export async function save_pdf_data(
  pdf_bytes: Uint8Array,
  remote_path: string,
  file_manager: FileAccessProvider,
  overwrite: boolean = true
): Promise<{ success: boolean; error?: string }> {
  const logger = get_logger();

  if (!file_manager.isInitialized()) {
    logger.error('[file_access_middleware] File manager not initialized');
    return { success: false, error: 'File manager not initialized' };
  }

  logger.debug(`[file_access_middleware] Saving PDF via hazo_files: ${remote_path} (${pdf_bytes.byteLength} bytes)`);

  try {
    // Convert Uint8Array to Buffer if in Node.js environment
    // or pass as-is if Buffer is not available (browser)
    let source: Buffer | Uint8Array = pdf_bytes;
    if (typeof Buffer !== 'undefined') {
      source = Buffer.from(pdf_bytes);
    }

    const result = await file_manager.uploadFile(source, remote_path, { overwrite });

    if (!result.success) {
      logger.error(`[file_access_middleware] Failed to save PDF: ${result.error}`);
      return { success: false, error: result.error };
    }

    logger.info(`[file_access_middleware] PDF saved successfully: ${remote_path}`);
    return { success: true };
  } catch (error) {
    const error_msg = error instanceof Error ? error.message : String(error);
    logger.error(`[file_access_middleware] Error saving PDF: ${error_msg}`);
    return { success: false, error: error_msg };
  }
}
