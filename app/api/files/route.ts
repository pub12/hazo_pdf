/**
 * API route for hazo_files table - lists file metadata records
 * Uses hazo_connect to query the hazo_files SQLite table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCrudService, SqliteAdapter } from 'hazo_connect/server';
import { FileMetadataRecord } from 'hazo_files';

/**
 * Serialize metadata record for JSON response
 */
function serialize_record(record: FileMetadataRecord): Record<string, unknown> {
  // Parse file_data if it's a string
  let parsed_file_data: Record<string, unknown> | string = record.file_data;
  if (typeof record.file_data === 'string') {
    try {
      parsed_file_data = JSON.parse(record.file_data);
    } catch {
      parsed_file_data = {};
    }
  }

  return {
    id: record.id,
    filename: record.filename,
    file_type: record.file_type,
    file_data: parsed_file_data,
    file_path: record.file_path,
    storage_type: record.storage_type,
    created_at: record.created_at,
    changed_at: record.changed_at,
  };
}

/**
 * Create SQLite adapter for the database
 */
function create_adapter(): SqliteAdapter {
  return new SqliteAdapter({
    database_path: 'prompt_library.sqlite',
  });
}

/**
 * GET handler - List file metadata records from hazo_files table
 */
export async function GET(request: NextRequest) {
  try {
    const adapter = create_adapter();

    // Create CRUD service for hazo_files table
    const crud_service = createCrudService<FileMetadataRecord>(adapter, 'hazo_files');

    // Get optional filter params
    const search_params = request.nextUrl.searchParams;
    const storage_type = search_params.get('storage_type');
    const file_path = search_params.get('file_path');

    // Query the table
    let records: FileMetadataRecord[];

    if (storage_type || file_path) {
      const criteria: Record<string, unknown> = {};
      if (storage_type) criteria.storage_type = storage_type;
      if (file_path) criteria.file_path = file_path;
      records = await crud_service.findBy(criteria);
    } else {
      records = await crud_service.list();
    }

    // Serialize records
    const items = records.map(serialize_record);

    // Sort by changed_at descending (most recent first)
    items.sort((a, b) => {
      const date_a = new Date(a.changed_at as string).getTime();
      const date_b = new Date(b.changed_at as string).getTime();
      return date_b - date_a;
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('[FilesAPI] Error querying hazo_files table:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to query hazo_files' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler - Delete a file metadata record by ID
 * Expects ?id=<record_id> query parameter
 */
export async function DELETE(request: NextRequest) {
  try {
    const search_params = request.nextUrl.searchParams;
    const id = search_params.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const adapter = create_adapter();
    const crud_service = createCrudService<FileMetadataRecord>(adapter, 'hazo_files');

    // Try to find the record first to verify it exists
    const records = await crud_service.findBy({ id });
    const existing = records[0];
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Record not found: ${id}` },
        { status: 404 }
      );
    }

    // Delete the record using raw SQL (CrudService doesn't have delete method)
    await adapter.rawQuery('DELETE FROM hazo_files WHERE id = ?', { params: [id] });

    console.log('[FilesAPI] Deleted record:', id);

    return NextResponse.json({
      success: true,
      deleted_id: id,
      filename: existing.filename,
    });
  } catch (error) {
    console.error('[FilesAPI] Error deleting record:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete record' },
      { status: 500 }
    );
  }
}
