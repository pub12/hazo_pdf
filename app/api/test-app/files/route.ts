/**
 * API route to list and upload files in the test_app_directory
 * Reads config using hazo_config package
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { HazoConfig } from 'hazo_config';

/**
 * Get the test app directory from config
 * @returns Directory path or null if test app is disabled
 */
function get_test_app_directory(): string | null {
  try {
    const config = new HazoConfig({ filePath: 'config/hazo_pdf_config.ini' });
    
    // Check if test app is enabled
    const enabled = config.get('test_app', 'test_app_enabled');
    if (!enabled) return null;
    
    const lower = String(enabled).toLowerCase().trim();
    if (lower !== 'true' && lower !== 'yes' && lower !== '1') {
      return null;
    }
    
    // Get directory path
    const dir = config.get('test_app', 'test_app_directory');
    if (!dir) return null;
    
    // Resolve path (relative to project root or absolute)
    const resolved_path = path.isAbsolute(dir) 
      ? dir 
      : path.resolve(process.cwd(), dir);
    
    return resolved_path;
  } catch (error) {
    console.error('[TestAppFiles] Error loading config:', error);
    return null;
  }
}

/**
 * GET handler - List files in test_app_directory
 */
export async function GET() {
  try {
    const dir = get_test_app_directory();
    
    if (!dir) {
      return NextResponse.json(
        { error: 'Test app is disabled or directory not configured' },
        { status: 404 }
      );
    }
    
    // Check if directory exists
    if (!fs.existsSync(dir)) {
      return NextResponse.json(
        { error: 'Directory does not exist', directory: dir },
        { status: 404 }
      );
    }
    
    // Read directory and filter for files (not directories)
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries
      .filter(entry => entry.isFile())
      .map(entry => ({
        name: entry.name,
        path: path.join(dir, entry.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('[TestAppFiles] Error listing files:', error);
    return NextResponse.json(
      { error: 'Failed to list files', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Upload a file to test_app_directory
 * Accepts multipart form data with 'file' field
 */
export async function POST(request: NextRequest) {
  try {
    const dir = get_test_app_directory();

    if (!dir) {
      return NextResponse.json(
        { error: 'Test app is disabled or directory not configured' },
        { status: 404 }
      );
    }

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Parse multipart form data
    const form_data = await request.formData();
    const file = form_data.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get filename - use provided name or original
    const custom_name = form_data.get('filename') as string | null;
    const filename = custom_name || file.name;

    // Sanitize filename
    const safe_filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const file_path = path.join(dir, safe_filename);

    // Read file data and write to disk
    const array_buffer = await file.arrayBuffer();
    const buffer = Buffer.from(array_buffer);
    fs.writeFileSync(file_path, buffer);

    console.log('[TestAppFiles] File uploaded:', safe_filename);

    return NextResponse.json({
      success: true,
      file: {
        name: safe_filename,
        path: file_path,
        size: buffer.length,
        url: `/api/test-app/files/${encodeURIComponent(safe_filename)}`,
      },
    });
  } catch (error) {
    console.error('[TestAppFiles] Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

