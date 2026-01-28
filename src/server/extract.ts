/**
 * Server-side document extraction utility
 * Uses hazo_llm_api for LLM-based extraction and hazo_files for storage
 */

import type { Logger } from '../utils/logger';
import type { FileAccessProvider } from '../types/file_access';
import type {
  ExtractDocumentSource,
  ExtractDocumentOptions,
  ExtractDocumentResult,
} from './types';

// Lazy-loaded modules (server-only)
let is_initialized = false;
let hazo_files_adapter: unknown = null;
let llm_initialized = false;

// Fallback console logger
const console_logger: Logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(`[hazo_pdf:extract] ${message}`, data ?? '');
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    console.debug(`[hazo_pdf:extract] ${message}`, data ?? '');
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`[hazo_pdf:extract] ${message}`, data ?? '');
  },
  error: (message: string, data?: Record<string, unknown>) => {
    console.error(`[hazo_pdf:extract] ${message}`, data ?? '');
  },
};

/**
 * Reset extraction state (for testing)
 */
export function reset_extraction_state(): void {
  is_initialized = false;
  hazo_files_adapter = null;
  llm_initialized = false;
}

/**
 * Initialize hazo_llm_api and SQLite adapter (lazy, once per process)
 */
async function ensure_initialized(
  sqlite_path?: string,
  logger: Logger = console_logger
): Promise<void> {
  if (is_initialized) {
    return;
  }

  try {
    // Dynamic import of server-only modules
    const { initialize_llm_api, get_current_config } = await import('hazo_llm_api/server');
    const { SqliteAdapter } = await import('hazo_connect/server');

    // Initialize hazo_llm_api if not already done
    if (!llm_initialized) {
      await initialize_llm_api({ logger });
      llm_initialized = true;
      logger.info('hazo_llm_api initialized');
    }

    // Determine SQLite path
    const config = get_current_config();
    const db_path = sqlite_path || config?.sqlite_path || 'prompt_library.sqlite';

    // Create hazo_connect SqliteAdapter
    hazo_files_adapter = new SqliteAdapter({
      type: 'sqlite',
      database_path: db_path,
    });

    // Ensure hazo_files table exists
    const { HAZO_FILES_TABLE_SCHEMA } = await import('hazo_files');
    const adapter = hazo_files_adapter as { rawQuery: (sql: string) => Promise<unknown> };
    await adapter.rawQuery(HAZO_FILES_TABLE_SCHEMA.sqlite.ddl);
    for (const idx of HAZO_FILES_TABLE_SCHEMA.sqlite.indexes) {
      await adapter.rawQuery(idx);
    }

    logger.debug('hazo_files table initialized', { sqlite_path: db_path });
    is_initialized = true;
  } catch (error) {
    logger.error('Failed to initialize extraction', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Load document from file path or URL as base64
 */
async function load_document_as_base64(
  file_path: string,
  logger: Logger = console_logger
): Promise<{ base64: string; mime_type: string }> {
  // HTTP(S) URL
  if (file_path.startsWith('http://') || file_path.startsWith('https://')) {
    logger.debug('Loading document from URL', { url: file_path });
    const response = await fetch(file_path);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const content_type = response.headers.get('content-type') || 'application/pdf';
    return { base64, mime_type: content_type };
  }

  // Local file path
  logger.debug('Loading document from filesystem', { path: file_path });
  const fs = await import('fs');
  const path = await import('path');

  if (!fs.existsSync(file_path)) {
    throw new Error(`File not found: ${file_path}`);
  }

  const buffer = fs.readFileSync(file_path);
  const base64 = buffer.toString('base64');

  // Determine MIME type from extension
  const ext = path.extname(file_path).toLowerCase();
  const mime_types: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  const mime_type = mime_types[ext] || 'application/pdf';

  return { base64, mime_type };
}

/**
 * Load document by hazo_files record ID
 */
async function load_document_by_file_id(
  file_id: string,
  _storage_type: 'local' | 'google_drive', // Used as fallback, actual storage_type comes from record
  file_manager: FileAccessProvider | undefined,
  logger: Logger = console_logger
): Promise<{ base64: string; mime_type: string; file_path: string }> {
  // Get file record from hazo_files
  const { HAZO_FILES_TABLE_SCHEMA } = await import('hazo_files');
  const { createCrudService } = await import('hazo_connect/server');

  if (!hazo_files_adapter) {
    throw new Error('hazo_files adapter not initialized');
  }

  type FileRecord = { id: string; file_path: string; file_type: string; storage_type: string };
  type CrudServiceType = { findMany: (opts: { where: { id: string } }) => Promise<FileRecord[]> };

  const crudService = createCrudService(
    hazo_files_adapter as Parameters<typeof createCrudService>[0],
    HAZO_FILES_TABLE_SCHEMA.tableName
  );

  // Get file metadata by ID
  const files = await (crudService as unknown as CrudServiceType).findMany({
    where: { id: file_id },
  });

  if (!files || files.length === 0) {
    throw new Error(`File record not found: ${file_id}`);
  }

  const file_record = files[0];
  const file_path = file_record.file_path;
  const mime_type = file_record.file_type || 'application/pdf';

  logger.debug('Found file record', { file_id, file_path, storage_type: file_record.storage_type });

  // If Google Drive storage, use file_manager to download
  if (file_record.storage_type === 'google_drive') {
    if (!file_manager) {
      throw new Error('file_manager is required for Google Drive files');
    }
    if (!file_manager.isInitialized()) {
      throw new Error('file_manager is not initialized');
    }

    logger.debug('Downloading from Google Drive', { file_path });
    const result = await file_manager.downloadFile(file_path);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to download file from Google Drive');
    }

    const buffer = Buffer.from(result.data as ArrayBuffer);
    const base64 = buffer.toString('base64');
    return { base64, mime_type, file_path };
  }

  // Local storage - read from filesystem
  return {
    ...(await load_document_as_base64(file_path, logger)),
    file_path,
  };
}

/**
 * Extract structured data from a PDF document using LLM
 *
 * @param source - Document source (file_path OR file_id)
 * @param options - Extraction options (prompt_area, prompt_key, etc.)
 * @returns Extraction result with data and metadata
 *
 * @example
 * // From file path
 * const result = await extract_document_data(
 *   { file_path: '/path/to/doc.pdf' },
 *   { prompt_area: 'document', prompt_key: 'initial_classification' }
 * );
 *
 * @example
 * // From hazo_files record ID
 * const result = await extract_document_data(
 *   { file_id: 'abc-123' },
 *   { prompt_area: 'invoice', prompt_key: 'extract_line_items', sqlite_path: './data/app.sqlite' }
 * );
 */
export async function extract_document_data(
  source: ExtractDocumentSource,
  options: ExtractDocumentOptions
): Promise<ExtractDocumentResult> {
  const logger = options.logger || console_logger;
  const storage_type = options.storage_type || 'local';
  const save_to_hazo_files = options.save_to_hazo_files !== false;

  // Validate source
  if (!source.file_path && !source.file_id) {
    return {
      success: false,
      error: 'Either file_path or file_id is required',
    };
  }

  if (source.file_path && source.file_id) {
    return {
      success: false,
      error: 'Provide either file_path or file_id, not both',
    };
  }

  try {
    // Initialize hazo_llm_api and hazo_files
    await ensure_initialized(options.sqlite_path, logger);

    // Load document
    let document_b64: string;
    let document_mime_type: string;
    let resolved_file_path: string;

    if (source.file_path) {
      const loaded = await load_document_as_base64(source.file_path, logger);
      document_b64 = loaded.base64;
      document_mime_type = options.mime_type || loaded.mime_type;
      resolved_file_path = source.file_path;
    } else {
      const loaded = await load_document_by_file_id(
        source.file_id!,
        storage_type,
        options.file_manager,
        logger
      );
      document_b64 = loaded.base64;
      document_mime_type = options.mime_type || loaded.mime_type;
      resolved_file_path = loaded.file_path;
    }

    const doc_size_kb = Math.round((document_b64.length * 0.75) / 1024);
    logger.info('Starting extraction', {
      file_path: resolved_file_path,
      size_kb: doc_size_kb,
      prompt: `${options.prompt_area}/${options.prompt_key}`,
    });

    // Import hazo_llm_api functions
    const {
      hazo_llm_dynamic_data_extract,
      get_database,
      get_prompt_by_area_and_key,
      default_logger,
    } = await import('hazo_llm_api/server');

    // Verify prompt exists
    const db = get_database();
    if (!db) {
      return {
        success: false,
        error: 'LLM database not initialized',
      };
    }

    const prompt_record = get_prompt_by_area_and_key(
      db,
      options.prompt_area,
      options.prompt_key,
      default_logger
    );

    if (!prompt_record) {
      return {
        success: false,
        error: `Prompt not found: area="${options.prompt_area}", key="${options.prompt_key}"`,
      };
    }

    logger.debug('Found prompt', {
      has_next_prompt: !!prompt_record.next_prompt,
    });

    // Run dynamic extraction
    const dynamic_response = await hazo_llm_dynamic_data_extract({
      initial_prompt_area: options.prompt_area,
      initial_prompt_key: options.prompt_key,
      file_b64: document_b64,
      file_mime_type: document_mime_type,
      max_depth: options.max_depth ?? 10,
      continue_on_error: options.continue_on_error ?? false,
    });

    logger.info('Extraction completed', {
      successful_steps: dynamic_response.successful_steps,
      total_steps: dynamic_response.total_steps,
      stop_reason: dynamic_response.final_stop_reason,
    });

    if (!dynamic_response.success && dynamic_response.errors.length > 0) {
      logger.error('Extraction failed', { errors: dynamic_response.errors });
      return {
        success: false,
        error: dynamic_response.errors[0]?.error || 'Dynamic extraction failed',
        successful_steps: dynamic_response.successful_steps,
        total_steps: dynamic_response.total_steps,
        stop_reason: dynamic_response.final_stop_reason,
      };
    }

    const extracted_data = dynamic_response.merged_result;

    // Save to hazo_files if enabled
    let extraction_id: string | undefined;
    let file_id: string | undefined = source.file_id;

    // Use original_file_path for hazo_files storage if provided (when extraction uses temp file)
    const storage_file_path = options.original_file_path || resolved_file_path;

    if (save_to_hazo_files && hazo_files_adapter) {
      try {
        const { createFileMetadataService, HAZO_FILES_TABLE_SCHEMA } = await import('hazo_files');
        const { createCrudService } = await import('hazo_connect/server');

        type FileIdRecord = { id: string };
        type CrudServiceWithFindMany = {
          findMany: (opts: { where: { file_path: string; storage_type: string } }) => Promise<FileIdRecord[]>;
        };

        const crudService = createCrudService(
          hazo_files_adapter as Parameters<typeof createCrudService>[0],
          HAZO_FILES_TABLE_SCHEMA.tableName
        );
        // Cast to unknown first to avoid type conflicts with hazo_files internal types
        const metadataService = createFileMetadataService(crudService as unknown as Parameters<typeof createFileMetadataService>[0], { logger });

        // Check if file record exists (use storage_file_path for hazo_files)
        const existing = await metadataService.getExtractions(
          storage_file_path,
          storage_type
        );

        if (existing === null) {
          // Create file record first
          const filename =
            options.filename ||
            storage_file_path.split('/').pop() ||
            'unknown';
          logger.debug('Creating file record', { file_path: storage_file_path, filename });

          await metadataService.recordUpload({
            filename,
            file_type: document_mime_type,
            file_path: storage_file_path,
            storage_type,
          });

          // Get the created file record ID
          const files = await (crudService as unknown as CrudServiceWithFindMany).findMany({
            where: { file_path: storage_file_path, storage_type },
          });
          if (files && files.length > 0) {
            file_id = files[0].id;
          }
        }

        // Add extraction
        const extraction_result = await metadataService.addExtraction(
          storage_file_path,
          storage_type,
          extracted_data,
          { source: 'hazo_llm_api' }
        );

        if (extraction_result) {
          extraction_id = extraction_result.id;
          logger.debug('Saved extraction to hazo_files', { extraction_id });
        }
      } catch (save_error) {
        // Don't fail extraction if saving fails
        const error_msg = save_error instanceof Error ? save_error.message : String(save_error);
        const error_stack = save_error instanceof Error ? save_error.stack : undefined;
        logger.error('Failed to save extraction to hazo_files', {
          error: error_msg,
          stack: error_stack,
          storage_file_path,
          storage_type,
        });
      }
    }

    return {
      success: true,
      data: extracted_data,
      extraction_id,
      file_id,
      file_path: storage_file_path,
      successful_steps: dynamic_response.successful_steps,
      total_steps: dynamic_response.total_steps,
      stop_reason: dynamic_response.final_stop_reason,
      step_results: dynamic_response.step_results?.map((s: { prompt_area: string; prompt_key: string; success: boolean; result?: Record<string, unknown>; error?: string }) => ({
        prompt_area: s.prompt_area,
        prompt_key: s.prompt_key,
        success: s.success,
        data: s.result,
        error: s.error,
      })),
    };
  } catch (error) {
    logger.error('Extraction error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
