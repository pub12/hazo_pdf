/**
 * API route for prompt CRUD operations
 * Handles GET (list all) and POST (create) operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { create_direct_db_connect, get_database, initialize_llm_api } from 'hazo_llm_api/server';

// Simple console logger for the test app
const logger = {
  error: console.error,
  info: console.log,
  warn: console.warn,
  debug: console.debug,
};

// Track initialization state
let initialized = false;

/**
 * Initialize the LLM API if not already done
 */
async function ensure_initialized() {
  if (!initialized) {
    await initialize_llm_api({ logger });
    initialized = true;
  }
}

/**
 * GET handler - List all prompts
 */
export async function GET() {
  try {
    await ensure_initialized();

    const connect = create_direct_db_connect(() => get_database(), logger);
    const result = await connect.get_all();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch prompts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[API/prompts] Error fetching prompts:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Create a new prompt
 */
export async function POST(request: NextRequest) {
  try {
    await ensure_initialized();

    const body = await request.json();
    const connect = create_direct_db_connect(() => get_database(), logger);
    const result = await connect.create(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create prompt' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error('[API/prompts] Error creating prompt:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
