/**
 * API route to serve individual PDF files
 * Reads config using hazo_config package and serves files from test_app_directory
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
    console.error('[TestAppFile] Error loading config:', error);
    return null;
  }
}

/**
 * GET handler - Serve a PDF file
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Resolve params (Next.js 15+ uses Promise for params)
    const resolved_params = await params;
    
    const dir = get_test_app_directory();
    
    if (!dir) {
      return NextResponse.json(
        { error: 'Test app is disabled or directory not configured' },
        { status: 404 }
      );
    }
    
    // Decode filename from URL
    const filename = decodeURIComponent(resolved_params.filename);
    
    // Security: prevent directory traversal
    const safe_filename = path.basename(filename);
    if (safe_filename !== filename || filename.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }
    
    // Construct full file path
    const file_path = path.join(dir, safe_filename);
    
    // Check if file exists
    if (!fs.existsSync(file_path)) {
      return NextResponse.json(
        { error: 'File not found', filename: safe_filename },
        { status: 404 }
      );
    }
    
    // Check if it's actually a file (not a directory)
    const stats = fs.statSync(file_path);
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: 'Not a file' },
        { status: 400 }
      );
    }
    
    // Read file
    const file_buffer = fs.readFileSync(file_path);
    
    // Determine content type based on file extension
    const ext = path.extname(safe_filename).toLowerCase();
    const content_type = ext === '.pdf' 
      ? 'application/pdf' 
      : 'application/octet-stream';
    
    // Return file with appropriate headers
    return new NextResponse(file_buffer, {
      status: 200,
      headers: {
        'Content-Type': content_type,
        'Content-Length': file_buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="${safe_filename}"`,
      },
    });
  } catch (error) {
    console.error('[TestAppFile] Error serving file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to serve file', 
        message: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

