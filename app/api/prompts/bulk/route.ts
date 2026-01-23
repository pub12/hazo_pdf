/**
 * API route for bulk prompt operations
 * Handles POST (bulk create/import) operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { create_direct_db_connect, get_database, initialize_llm_api } from 'hazo_llm_api/server';
import { createLogger } from 'hazo_logs';

// Create shared logger that writes to hazo_logs
const logger = createLogger('hazo_llm_api');

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
 * POST handler - Bulk create prompts
 */
export async function POST(request: NextRequest) {
  try {
    await ensure_initialized();

    const body = await request.json();
    const prompts = Array.isArray(body) ? body : body.prompts;

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Request body must contain an array of prompts' },
        { status: 400 }
      );
    }

    const connect = create_direct_db_connect(() => get_database(), logger);
    const results: { success: boolean; data?: unknown; error?: string }[] = [];
    const created: unknown[] = [];
    const errors: string[] = [];

    for (const prompt of prompts) {
      const result = await connect.create(prompt);
      if (result.success) {
        created.push(result.data);
      } else {
        errors.push(result.error || `Failed to create prompt: ${prompt.name || 'unknown'}`);
      }
      results.push(result);
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        created,
        created_count: created.length,
        error_count: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    }, { status: errors.length === 0 ? 201 : 207 });
  } catch (error) {
    console.error('[API/prompts/bulk] Error bulk creating prompts:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
