/**
 * API route for LLM-based data extraction from PDF documents
 * Uses hazo_pdf/server extract_document_data utility
 *
 * This route demonstrates how consuming apps can use the server-side
 * extraction utility from hazo_pdf.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extract_document_data } from '@/app/lib/hazo_pdf_server';
import { createLogger } from 'hazo_logs';

// Create logger for extraction API
const logger = createLogger('hazo_pdf:extract_api');

/**
 * POST handler - Extract data from PDF using LLM
 *
 * Request body:
 * - document_b64: Base64-encoded PDF data (required if no file_path)
 * - document_mime_type: MIME type (should be "application/pdf")
 * - prompt_area: Area/category for prompt lookup (e.g., "document")
 * - prompt_key: Key for prompt lookup (e.g., "initial_classification")
 * - file_path: (optional) Path to a local file (alternative to document_b64)
 * - file_id: (optional) hazo_files record ID (alternative to document_b64/file_path)
 * - filename: (optional) Filename for database record
 * - storage_type: (optional) Storage provider type ('local' or 'google_drive')
 * - save_to_hazo_files: (optional) Whether to save extraction to hazo_files (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      document_b64,
      document_mime_type,
      prompt_area,
      prompt_key,
      file_path,
      file_id,
      filename,
      storage_type = 'local',
      save_to_hazo_files = true,
    } = body;

    // Validate required fields
    if (!prompt_area || !prompt_key) {
      return NextResponse.json(
        { success: false, error: 'prompt_area and prompt_key are required' },
        { status: 400 }
      );
    }

    // Must have either document_b64, file_path, or file_id
    if (!document_b64 && !file_path && !file_id) {
      return NextResponse.json(
        { success: false, error: 'Either document_b64, file_path, or file_id is required' },
        { status: 400 }
      );
    }

    // Log extraction request
    const doc_size = document_b64 ? Math.round(document_b64.length * 0.75 / 1024) : 0;
    logger.info('Extraction request received', {
      has_b64: !!document_b64,
      file_path: file_path || '(not provided)',
      file_id: file_id || '(not provided)',
      document_size_kb: doc_size,
      prompt: `${prompt_area}/${prompt_key}`,
    });

    // If we have base64 data, we need to write it to a temp file first
    // since extract_document_data works with file paths
    let source_file_path = file_path;
    let temp_file_created = false;

    // When document_b64 is provided, always create a temp file (unless we have file_id)
    // The file_path parameter may be a URL path (e.g., /api/files/...), not a filesystem path
    if (document_b64 && !file_id) {
      // Write base64 data to a temp file
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const temp_dir = os.tmpdir();
      const temp_filename = `hazo_extract_${Date.now()}.pdf`;
      source_file_path = path.join(temp_dir, temp_filename);

      const buffer = Buffer.from(document_b64, 'base64');
      fs.writeFileSync(source_file_path, buffer);
      temp_file_created = true;

      logger.debug('Created temp file for extraction', { temp_path: source_file_path });
    }

    try {
      // Call extract_document_data from hazo_pdf/server
      const result = await extract_document_data(
        file_id ? { file_id } : { file_path: source_file_path! },
        {
          prompt_area,
          prompt_key,
          logger,
          storage_type,
          save_to_hazo_files,
          filename,
          mime_type: document_mime_type,
          // When using temp file, preserve original file_path for hazo_files storage
          original_file_path: temp_file_created ? file_path : undefined,
        }
      );

      if (!result.success) {
        logger.error('Extraction failed', { error: result.error });
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      logger.info('Extraction completed', {
        successful_steps: result.successful_steps,
        total_steps: result.total_steps,
        extraction_id: result.extraction_id,
      });

      return NextResponse.json({
        success: true,
        data: result.data,
        extraction_id: result.extraction_id,
        file_id: result.file_id,
        file_path: result.file_path,
        successful_steps: result.successful_steps,
        total_steps: result.total_steps,
        stop_reason: result.stop_reason,
      });
    } finally {
      // Clean up temp file if created
      if (temp_file_created && source_file_path) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(source_file_path)) {
            fs.unlinkSync(source_file_path);
            logger.debug('Cleaned up temp file', { temp_path: source_file_path });
          }
        } catch (cleanup_error) {
          logger.warn('Failed to clean up temp file', {
            temp_path: source_file_path,
            error: cleanup_error instanceof Error ? cleanup_error.message : String(cleanup_error),
          });
        }
      }
    }
  } catch (error) {
    logger.error('Extract API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
