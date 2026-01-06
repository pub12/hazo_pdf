/**
 * API route to list files in the test_app_directory
 * Reads config using hazo_config package
 */

import { NextResponse } from 'next/server';
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

