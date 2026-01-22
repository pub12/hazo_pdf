/**
 * API route for LLM-based data extraction from PDF documents
 * Uses hazo_llm_api for server-side LLM calls
 *
 * When file_path and storage_type are provided, the extracted data is
 * automatically saved to the hazo_files database table using the official
 * hazo_files extraction API with hazo_connect CrudService.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { StorageProvider, ExtractionData, FileMetadataRecord } from 'hazo_files';
import { createFileMetadataService, HAZO_FILES_TABLE_SCHEMA } from 'hazo_files';
import { SqliteAdapter, createCrudService } from 'hazo_connect/server';
import { createLogger } from 'hazo_logs';

// Create shared loggers that write to hazo_logs (same log file as other packages)
const llm_logger = createLogger('hazo_llm_api');
const files_logger = createLogger('hazo_files');

// Track initialization state
let is_initialized = false;
let hazo_files_adapter: SqliteAdapter | null = null;

/**
 * Initialize the LLM API and hazo_files table (once per server lifetime)
 */
async function ensure_initialized(): Promise<void> {
  if (is_initialized) {
    return;
  }

  try {
    const { initialize_llm_api, get_current_config } = await import('hazo_llm_api/server');

    // Initialize hazo_llm_api with the shared hazo_logs logger
    // This ensures all LLM logs go to the same log file as other packages
    await initialize_llm_api({ logger: llm_logger });
    llm_logger.info('hazo_llm_api initialized with shared hazo_logs logger');

    // Get the SQLite path from hazo_llm_api config
    const config = get_current_config();
    const sqlite_path = config?.sqlite_path || 'prompt_library.sqlite';

    // Create hazo_connect SqliteAdapter for the same database
    hazo_files_adapter = new SqliteAdapter({
      type: 'sqlite',
      database_path: sqlite_path,
    });

    // Ensure hazo_files table exists using official schema
    await hazo_files_adapter.rawQuery(HAZO_FILES_TABLE_SCHEMA.sqlite.ddl);
    for (const idx of HAZO_FILES_TABLE_SCHEMA.sqlite.indexes) {
      await hazo_files_adapter.rawQuery(idx);
    }
    console.log('[ExtractAPI] hazo_files table initialized');

    is_initialized = true;
  } catch (error) {
    console.error('[ExtractAPI] Failed to initialize:', error);
    throw error;
  }
}

/**
 * POST handler - Extract data from PDF using LLM
 *
 * Request body:
 * - document_b64: Base64-encoded PDF data
 * - document_mime_type: MIME type (should be "application/pdf")
 * - prompt_area: Area/category for prompt lookup (e.g., "document")
 * - prompt_key: Key for prompt lookup (e.g., "initial_classification")
 * - file_path: (optional) Path to the file in storage (for saving extracted data)
 * - filename: (optional) Filename for database record (defaults to extracting from file_path)
 * - storage_type: (optional) Storage provider type ('local' or 'google_drive')
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { document_b64, document_mime_type, prompt_area, prompt_key, file_path, filename: provided_filename, storage_type } = body;

    // Validate required fields
    if (!document_b64) {
      return NextResponse.json(
        { success: false, error: 'document_b64 is required' },
        { status: 400 }
      );
    }

    if (!document_mime_type) {
      return NextResponse.json(
        { success: false, error: 'document_mime_type is required' },
        { status: 400 }
      );
    }

    // Log extraction request details
    const doc_size = document_b64 ? Math.round(document_b64.length * 0.75 / 1024) : 0; // Approximate size in KB
    console.log('[ExtractAPI] Extraction request received:', {
      filename: provided_filename || '(not provided)',
      file_path: file_path || '(not provided)',
      storage_type: storage_type || '(not provided)',
      document_size_kb: doc_size,
      prompt: prompt_area && prompt_key ? `${prompt_area}/${prompt_key}` : '(default)',
    });

    // Ensure LLM API and hazo_files are initialized
    await ensure_initialized();

    // Import required functions from hazo_llm_api
    const {
      hazo_llm_dynamic_data_extract,
      hazo_llm_document_text,
      get_database,
      get_prompt_by_area_and_key,
      default_logger,
    } = await import('hazo_llm_api/server');

    // Get database for prompt lookup
    const db = get_database();

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    let extracted_data: Record<string, unknown>;

    // Use dynamic data extraction if prompt_area and prompt_key are provided
    // This automatically chains prompts based on the next_prompt field in the database
    if (prompt_area && prompt_key) {
      // Verify prompt exists before calling dynamic extract
      const prompt_record = get_prompt_by_area_and_key(db, prompt_area, prompt_key, default_logger);

      if (!prompt_record) {
        return NextResponse.json(
          {
            success: false,
            error: `Prompt not found: area="${prompt_area}", key="${prompt_key}". Please create this prompt in the prompt library.`
          },
          { status: 404 }
        );
      }

      console.log('[ExtractAPI] Using dynamic data extraction with prompt:', prompt_area, '/', prompt_key);
      console.log('[ExtractAPI] Prompt has next_prompt:', prompt_record.next_prompt ? 'yes' : 'no');

      // Call dynamic data extract which will follow the prompt chain
      const dynamic_response = await hazo_llm_dynamic_data_extract({
        initial_prompt_area: prompt_area,
        initial_prompt_key: prompt_key,
        file_b64: document_b64,
        file_mime_type: document_mime_type,
        max_depth: 10, // Allow up to 10 chained prompts
        continue_on_error: false,
      });

      console.log('[ExtractAPI] Dynamic extraction completed:',
        `${dynamic_response.successful_steps}/${dynamic_response.total_steps} steps,`,
        `stop_reason: ${dynamic_response.final_stop_reason}`
      );

      if (!dynamic_response.success && dynamic_response.errors.length > 0) {
        console.error('[ExtractAPI] Dynamic extraction errors:', dynamic_response.errors);
        return NextResponse.json(
          { success: false, error: dynamic_response.errors[0]?.error || 'Dynamic extraction failed' },
          { status: 500 }
        );
      }

      // Use the merged result from all steps
      extracted_data = dynamic_response.merged_result;

      // Log step results for debugging
      if (dynamic_response.step_results.length > 1) {
        console.log('[ExtractAPI] Prompt chain executed:',
          dynamic_response.step_results.map(s => `${s.prompt_area}/${s.prompt_key}`).join(' -> ')
        );
      }
    } else {
      // Fallback to simple single-prompt extraction if no area/key specified
      console.log('[ExtractAPI] Using simple extraction (no prompt area/key specified)');

      const prompt_text = 'Analyze this PDF document and extract all relevant structured data. Return the result as a valid JSON object.';

      const llm_response = await hazo_llm_document_text({
        document_b64,
        document_mime_type,
        prompt: prompt_text,
      });

      if (!llm_response.success) {
        console.error('[ExtractAPI] LLM call failed:', llm_response.error);
        return NextResponse.json(
          { success: false, error: llm_response.error || 'LLM extraction failed' },
          { status: 500 }
        );
      }

      // Try to parse the response as JSON
      try {
        let response_text = llm_response.text || '';
        response_text = response_text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        response_text = response_text.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        extracted_data = JSON.parse(response_text);
      } catch (parse_error) {
        console.warn('[ExtractAPI] Could not parse LLM response as JSON, returning raw text');
        extracted_data = {
          raw_text: llm_response.text,
          parse_error: 'LLM response was not valid JSON',
        };
      }
    }

    console.log('[ExtractAPI] Extraction completed successfully');

    // If file_path and storage_type are provided, save to hazo_files using extraction API
    let extraction_result: ExtractionData | null = null;
    if (file_path && storage_type && hazo_files_adapter) {
      try {
        // Create CrudService using hazo_connect
        const crudService = createCrudService<FileMetadataRecord>(
          hazo_files_adapter,
          HAZO_FILES_TABLE_SCHEMA.tableName
        );

        // Create FileMetadataService with the CrudService and shared logger
        const metadataService = createFileMetadataService(crudService, { logger: files_logger });

        // Ensure the file record exists (addExtraction requires it)
        // First check if the record exists
        const existing = await metadataService.getExtractions(file_path, storage_type as StorageProvider);

        if (existing === null) {
          // File record doesn't exist - create it first
          // Use provided filename if available, otherwise extract from file_path
          const filename = provided_filename || file_path.split('/').pop() || 'unknown';
          console.log('[ExtractAPI] Creating file record for:', file_path, 'filename:', filename);
          await metadataService.recordUpload({
            filename,
            file_type: document_mime_type,
            file_path,
            storage_type: storage_type as StorageProvider,
          });
        }

        // Use the official extraction API
        extraction_result = await metadataService.addExtraction(
          file_path,
          storage_type as StorageProvider,
          extracted_data,
          { source: 'hazo_llm_api' }
        );

        if (extraction_result) {
          console.log('[ExtractAPI] Saved extraction to hazo_files:', extraction_result.id);
        } else {
          console.warn('[ExtractAPI] Failed to save extraction to hazo_files');
        }
      } catch (save_error) {
        // Don't fail the extraction if saving fails
        console.error('[ExtractAPI] Error saving to hazo_files:', save_error);
      }
    }

    return NextResponse.json({
      success: true,
      data: extracted_data,
      extraction_id: extraction_result?.id,
    });

  } catch (error) {
    console.error('[ExtractAPI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
