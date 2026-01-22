/**
 * API route for single prompt operations
 * Handles GET (by id), PUT (update), and DELETE operations
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
 * GET handler - Get prompt by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensure_initialized();

    const { id } = await params;
    const connect = create_direct_db_connect(() => get_database(), logger);
    const result = await connect.get_by_id(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[API/prompts/[id]] Error fetching prompt:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler - Update prompt by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensure_initialized();

    const { id } = await params;
    const body = await request.json();
    const connect = create_direct_db_connect(() => get_database(), logger);
    const result = await connect.update(id, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update prompt' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[API/prompts/[id]] Error updating prompt:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler - Delete prompt by ID
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensure_initialized();

    const { id } = await params;
    const connect = create_direct_db_connect(() => get_database(), logger);
    const result = await connect.delete(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete prompt' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/prompts/[id]] Error deleting prompt:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
