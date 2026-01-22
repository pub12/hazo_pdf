/**
 * File Table Demo Page
 * Displays metadata records from the hazo_files database table
 * Shows file tracking data with extraction information
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  Database,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Types matching hazo_files FileMetadataRecord
interface FileMetadataRecord {
  id: string;
  filename: string;
  file_type: string;
  file_data: Record<string, unknown>;
  file_path: string;
  storage_type: string;
  created_at: string;
  changed_at: string;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

/**
 * Format date in readable format
 */
function format_date(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get icon for file type
 */
function get_file_icon(file_type: string) {
  if (file_type === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  if (file_type?.startsWith("image/")) {
    return <FileText className="h-4 w-4 text-purple-500" />;
  }
  return <FileText className="h-4 w-4 text-gray-500" />;
}

/**
 * Get sortable value from record
 */
function get_sort_value(
  record: FileMetadataRecord,
  key: string
): string | number | Date {
  switch (key) {
    case "filename":
      return record.filename;
    case "file_type":
      return record.file_type;
    case "file_path":
      return record.file_path;
    case "storage_type":
      return record.storage_type;
    case "created_at":
      return new Date(record.created_at);
    case "changed_at":
      return new Date(record.changed_at);
    default:
      return "";
  }
}

/**
 * Summarize file_data for display
 */
function summarize_file_data(file_data: Record<string, unknown>): string {
  if (!file_data || typeof file_data !== "object") return "—";

  const merged = file_data.merged_data as Record<string, unknown> | undefined;
  if (!merged) return "No extractions";

  const keys = Object.keys(merged);
  if (keys.length === 0) return "No extractions";

  return `${keys.length} field${keys.length === 1 ? "" : "s"}: ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""}`;
}

/**
 * File Table demo page component
 */
export default function FileTableDemoPage() {
  const [records, setRecords] = useState<FileMetadataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected_record, setSelectedRecord] = useState<FileMetadataRecord | null>(null);
  const [sort_state, setSortState] = useState<SortState>({ key: null, direction: null });
  const [filter_text, setFilterText] = useState("");
  const [selected_rows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expanded_rows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleting_ids, setDeletingIds] = useState<Set<string>>(new Set());
  const [delete_dialog_open, setDeleteDialogOpen] = useState(false);
  const [record_to_delete, setRecordToDelete] = useState<FileMetadataRecord | null>(null);
  const [delete_error, setDeleteError] = useState<string | null>(null);
  const [pdf_viewer_open, setPdfViewerOpen] = useState(false);
  const [pdf_viewer_record, setPdfViewerRecord] = useState<FileMetadataRecord | null>(null);
  const [pdf_error, setPdfError] = useState<string | null>(null);
  const [pdf_error_dialog_open, setPdfErrorDialogOpen] = useState(false);

  // Load records from API
  const load_records = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/files");
      const result = await response.json();

      if (result.success && result.data) {
        setRecords(result.data);
      } else {
        setError(result.error || "Failed to load records");
        setRecords([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load records on mount
  useEffect(() => {
    load_records();
  }, [load_records]);

  // Filter data based on search text
  const filtered_data = useMemo(() => {
    if (!filter_text) return records;
    const lower_filter = filter_text.toLowerCase();
    return records.filter(
      (record) =>
        record.filename.toLowerCase().includes(lower_filter) ||
        record.file_path.toLowerCase().includes(lower_filter) ||
        record.file_type.toLowerCase().includes(lower_filter) ||
        record.storage_type.toLowerCase().includes(lower_filter)
    );
  }, [records, filter_text]);

  // Sort data
  const sorted_data = useMemo(() => {
    if (!sort_state.key || !sort_state.direction) return filtered_data;

    return [...filtered_data].sort((a, b) => {
      const a_val = get_sort_value(a, sort_state.key!);
      const b_val = get_sort_value(b, sort_state.key!);

      if (a_val instanceof Date && b_val instanceof Date) {
        const a_time = a_val.getTime();
        const b_time = b_val.getTime();
        return sort_state.direction === "asc" ? a_time - b_time : b_time - a_time;
      }

      if (typeof a_val === "string" && typeof b_val === "string") {
        const comparison = a_val.localeCompare(b_val);
        return sort_state.direction === "asc" ? comparison : -comparison;
      }

      return 0;
    });
  }, [filtered_data, sort_state]);

  // Handle column sort click
  const handle_sort_click = (key: string) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  };

  // Get sort icon for column
  const get_sort_icon = (key: string) => {
    if (sort_state.key !== key) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    if (sort_state.direction === "asc") return <ArrowUp className="h-4 w-4 ml-1" />;
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Toggle row selection
  const toggle_row_selection = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle all row selection
  const toggle_all_selection = () => {
    if (selected_rows.size === sorted_data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sorted_data.map((record) => record.id)));
    }
  };

  // Toggle row expansion
  const toggle_row_expansion = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Handle row click
  const handle_row_click = (record: FileMetadataRecord) => {
    setSelectedRecord(record);
  };

  // Handle view details - open PDF viewer for PDF files
  const handle_view_details = (record: FileMetadataRecord) => {
    if (record.file_type === "application/pdf") {
      setPdfViewerRecord(record);
      setPdfViewerOpen(true);
      console.log("[FileTable] Opening PDF viewer for:", record.filename);
    } else {
      // For non-PDF files, just show selection
      setSelectedRecord(record);
      console.log("[FileTable] View details:", record);
    }
  };

  // Close PDF viewer
  const handle_close_pdf_viewer = () => {
    setPdfViewerOpen(false);
    setPdfViewerRecord(null);
  };

  // Handle PDF load error
  const handle_pdf_error = (error: Error) => {
    console.error("[FileTable] PDF load error:", error);
    setPdfViewerOpen(false);
    setPdfError(error.message || "Failed to load PDF");
    setPdfErrorDialogOpen(true);
  };

  // Close PDF error dialog
  const handle_close_pdf_error = () => {
    setPdfErrorDialogOpen(false);
    setPdfError(null);
    setPdfViewerRecord(null);
  };

  // Open delete confirmation dialog
  const open_delete_dialog = (record: FileMetadataRecord) => {
    setRecordToDelete(record);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  // Handle confirmed delete
  const handle_confirm_delete = async () => {
    if (!record_to_delete) return;

    const record = record_to_delete;

    // Mark as deleting
    setDeletingIds((prev) => new Set(prev).add(record.id));
    setDeleteError(null);

    try {
      const response = await fetch(`/api/files?id=${encodeURIComponent(record.id)}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Close dialog
        setDeleteDialogOpen(false);
        setRecordToDelete(null);

        // Remove from local state
        setRecords((prev) => prev.filter((r) => r.id !== record.id));
        setSelectedRows((prev) => {
          const next = new Set(prev);
          next.delete(record.id);
          return next;
        });
        setExpandedRows((prev) => {
          const next = new Set(prev);
          next.delete(record.id);
          return next;
        });
        // Clear selected record if it was the deleted one
        if (selected_record?.id === record.id) {
          setSelectedRecord(null);
        }
        console.log("[FileTable] Deleted record:", result.deleted_id, result.filename);
      } else {
        console.error("[FileTable] Failed to delete:", result.error);
        setDeleteError(result.error || "Failed to delete record");
      }
    } catch (err) {
      console.error("[FileTable] Delete error:", err);
      setDeleteError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      // Remove from deleting state
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
    }
  };

  // Handle dialog close
  const handle_dialog_close = (open: boolean) => {
    if (!open && !deleting_ids.has(record_to_delete?.id || "")) {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      setDeleteError(null);
    }
  };

  // Column definitions
  const columns = [
    { key: "filename", label: "Filename", sortable: true },
    { key: "file_type", label: "Type", sortable: true },
    { key: "file_path", label: "Path", sortable: true },
    { key: "storage_type", label: "Storage", sortable: true },
    { key: "file_data", label: "Extractions", sortable: false },
    { key: "created_at", label: "Created", sortable: true },
    { key: "changed_at", label: "Changed", sortable: true },
  ];

  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            File Metadata Table (hazo_files)
          </h2>
          <p className="text-muted-foreground">
            View file metadata records from the hazo_files database table. Tracks files with extraction data.
          </p>
        </div>

        {/* Code Example */}
        <CodePreview
          title="Database Schema"
          code={`-- hazo_files table in prompt_library.sqlite
CREATE TABLE hazo_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_data TEXT DEFAULT '{}',  -- JSON with extraction data
  created_at TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_type TEXT NOT NULL
);`}
        />

        {/* Error message */}
        {error && (
          <div className="cls_file_table_error mb-4 p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error loading records</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="cls_file_table_toolbar flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={filter_text}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => load_records()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <div className="text-sm text-muted-foreground">
            {selected_rows.size > 0
              ? `${selected_rows.size} selected`
              : `${sorted_data.length} record${sorted_data.length === 1 ? "" : "s"}`}
          </div>
        </div>

        {/* Selected record info */}
        {selected_record && (
          <div className="cls_demo_selection mb-4 p-4 border rounded-lg bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-2">Selected Record</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>ID:</strong> {selected_record.id}</p>
              <p><strong>Filename:</strong> {selected_record.filename}</p>
              <p><strong>Path:</strong> {selected_record.file_path}</p>
              <p><strong>Type:</strong> {selected_record.file_type}</p>
              <p><strong>Storage:</strong> {selected_record.storage_type}</p>
            </div>
            {selected_record.file_data && (
              <div className="mt-2">
                <p className="font-medium text-blue-900 mb-1">Extraction Data:</p>
                <pre className="text-xs bg-blue-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(selected_record.file_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="cls_file_table_container rounded-md border flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={sorted_data.length > 0 && selected_rows.size === sorted_data.length}
                    onChange={toggle_all_selection}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableHead>
                <TableHead className="w-[30px]"></TableHead>
                {columns.map((column) => (
                  <TableHead key={column.key}>
                    {column.sortable ? (
                      <button
                        className="flex items-center font-medium hover:text-foreground"
                        onClick={() => handle_sort_click(column.key)}
                      >
                        {column.label}
                        {get_sort_icon(column.key)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 3} className="h-24 text-center">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : sorted_data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {filter_text ? "No matching records" : "No records in hazo_files table"}
                  </TableCell>
                </TableRow>
              ) : (
                sorted_data.map((record) => (
                  <React.Fragment key={record.id}>
                    <TableRow
                      className={`cursor-pointer ${selected_rows.has(record.id) ? "bg-muted/50" : ""}`}
                      onClick={() => handle_row_click(record)}
                      data-state={selected_rows.has(record.id) ? "selected" : undefined}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected_rows.has(record.id)}
                          onChange={() => toggle_row_selection(record.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggle_row_expansion(record.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expanded_rows.has(record.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {get_file_icon(record.file_type)}
                          <span className="font-medium">{record.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{record.file_type}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
                          {record.file_path}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
                          {record.storage_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {summarize_file_data(record.file_data)}
                        </span>
                      </TableCell>
                      <TableCell>{format_date(record.created_at)}</TableCell>
                      <TableCell>{format_date(record.changed_at)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handle_view_details(record)}
                            title={record.file_type === "application/pdf" ? "Open in PDF Viewer" : "View Details"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => open_delete_dialog(record)}
                            disabled={deleting_ids.has(record.id)}
                            title="Delete"
                          >
                            {deleting_ids.has(record.id) ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded_rows.has(record.id) && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={columns.length + 3}>
                          <div className="p-4">
                            <h4 className="font-semibold mb-2">Extraction Data (file_data)</h4>
                            <pre className="text-xs bg-white border p-3 rounded overflow-auto max-h-60">
                              {JSON.stringify(record.file_data, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={delete_dialog_open} onOpenChange={handle_dialog_close}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{record_to_delete?.filename}&quot;?
                <br />
                <br />
                This will permanently remove the metadata record from the database.
                The actual file will not be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Error message */}
            {delete_error && (
              <div className="flex items-start gap-2 p-3 border border-red-200 rounded-md bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{delete_error}</p>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting_ids.has(record_to_delete?.id || "")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handle_confirm_delete}
                disabled={deleting_ids.has(record_to_delete?.id || "")}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting_ids.has(record_to_delete?.id || "") ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* PDF Viewer Dialog */}
        {pdf_viewer_open && pdf_viewer_record && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden shadow-xl">
              <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
                <PdfViewer
                  url={pdf_viewer_record.file_path}
                  className="h-full w-full"
                  on_close={handle_close_pdf_viewer}
                  on_error={handle_pdf_error}
                />
              </Suspense>
            </div>
          </div>
        )}

        {/* PDF Error Dialog */}
        <AlertDialog open={pdf_error_dialog_open} onOpenChange={handle_close_pdf_error}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Failed to Load PDF
              </AlertDialogTitle>
              <AlertDialogDescription>
                Could not open &quot;{pdf_viewer_record?.filename}&quot;.
                <br />
                <br />
                <span className="font-medium text-destructive">{pdf_error}</span>
                <br />
                <br />
                The file may have been moved, deleted, or the URL may have expired (blob URLs are temporary).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handle_close_pdf_error}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TestAppLayout>
  );
}
