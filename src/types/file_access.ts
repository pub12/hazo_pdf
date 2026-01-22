/**
 * File Access Types for hazo_files integration
 * Defines minimal interface that hazo_files' FileManager/StorageModule implements
 */

/**
 * Result of a file download operation
 */
export interface FileDownloadResult {
  /** Whether the operation was successful */
  success: boolean;
  /** File data as Buffer (Node.js) or ArrayBuffer-like (browser) */
  data?: Buffer | ArrayBuffer | Uint8Array;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Result of a file upload operation
 */
export interface FileUploadResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
}

/**
 * File access provider interface
 * This is the minimal interface that hazo_files' FileManager/StorageModule implements
 * Allows hazo_pdf to load and save files through hazo_files' storage abstraction
 */
export interface FileAccessProvider {
  /**
   * Download a file from remote storage
   * @param remotePath - Path to the file in remote storage
   * @param localPath - Optional local path (not used by hazo_pdf, but part of hazo_files API)
   * @returns Promise with download result containing file data
   */
  downloadFile(
    remotePath: string,
    localPath?: string
  ): Promise<FileDownloadResult>;

  /**
   * Upload a file to remote storage
   * @param source - File data as Buffer or Uint8Array
   * @param remotePath - Destination path in remote storage
   * @param options - Upload options
   * @returns Promise with upload result
   */
  uploadFile(
    source: Buffer | Uint8Array,
    remotePath: string,
    options?: { overwrite?: boolean }
  ): Promise<FileUploadResult>;

  /**
   * Check if the provider is initialized and ready to use
   * @returns true if provider is ready, false otherwise
   */
  isInitialized(): boolean;
}
