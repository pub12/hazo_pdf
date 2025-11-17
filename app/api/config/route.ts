/**
 * API route to serve the PDF viewer configuration file
 * Uses hazo_config to read from the root directory config file
 * This ensures hazo_config is used server-side to access the config file in the root directory
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { HazoConfig } from 'hazo_config';

/**
 * GET handler - Serve the config file content
 * Reads hazo_pdf_config.ini from root directory using hazo_config
 * Uses hazo_config to validate and access the config file (same as other API routes)
 */
export async function GET(_request: NextRequest) {
  try {
    const config_file = 'hazo_pdf_config.ini';
    
    // Use hazo_config to read the config file (same approach as other API routes)
    // This ensures consistency with how other parts of the code read the config
    const hazo_config = new HazoConfig({ filePath: config_file });
    
    // Verify the config can be read by checking a known section
    // This validates that hazo_config can access the file correctly
    hazo_config.get('viewer', 'viewer_background_color');
    
    // Get the file path that hazo_config is using
    // Resolve path relative to project root (same as hazo_config does internally)
    const config_path = path.resolve(process.cwd(), config_file);
    
    // Read and return the raw INI file content
    // This allows the browser to parse it using the same logic
    const ini_content = fs.readFileSync(config_path, 'utf-8');
    
    return new NextResponse(ini_content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[ConfigAPI] Error reading config file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to read config file', 
        message: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

