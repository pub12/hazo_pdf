/**
 * File Browser Demo Page
 * Demonstrates hazo_files integration with hazo_pdf
 * Shows FileBrowser component from hazo_files/ui if available
 */

"use client";

import { Suspense, useState, useEffect, ComponentType, useMemo } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";

// Types for FileBrowser API (matching hazo_files interfaces)
interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: false;
}

interface FolderItem {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: true;
}

type FileSystemItem = FileItem | FolderItem;

interface TreeNode {
  id: string;
  name: string;
  path: string;
  children: TreeNode[];
  isExpanded?: boolean;
}

interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FileBrowserAPI {
  listDirectory: (path: string) => Promise<OperationResult<FileSystemItem[]>>;
  getFolderTree: (path?: string, depth?: number) => Promise<OperationResult<TreeNode[]>>;
  createDirectory: (path: string) => Promise<OperationResult<{ name: string; path: string; type: 'folder' }>>;
  removeDirectory: (path: string, recursive?: boolean) => Promise<OperationResult<void>>;
  uploadFile: (file: File, remotePath: string) => Promise<OperationResult<FileSystemItem>>;
  downloadFile: (path: string) => Promise<OperationResult<Blob>>;
  deleteFile: (path: string) => Promise<OperationResult<void>>;
  renameFile: (path: string, newName: string) => Promise<OperationResult<FileSystemItem>>;
  renameFolder: (path: string, newName: string) => Promise<OperationResult<{ name: string; path: string; type: 'folder' }>>;
  moveItem: (sourcePath: string, destinationPath: string) => Promise<OperationResult<FileSystemItem>>;
  getPreviewUrl?: (path: string) => Promise<string>;
}

// Helper to create mock dates
const mockDate = new Date('2024-01-15');

// Mock file system data for demonstration
const MOCK_FILES: Record<string, FileSystemItem[]> = {
  '/': [
    { id: 'folder-1', name: 'Documents', path: '/Documents', isDirectory: true, createdAt: mockDate, modifiedAt: mockDate },
    { id: 'folder-2', name: 'Images', path: '/Images', isDirectory: true, createdAt: mockDate, modifiedAt: mockDate },
    { id: 'file-1', name: 'readme.txt', path: '/readme.txt', isDirectory: false, size: 1024, mimeType: 'text/plain', createdAt: mockDate, modifiedAt: mockDate },
  ],
  '/Documents': [
    { id: 'folder-3', name: 'Reports', path: '/Documents/Reports', isDirectory: true, createdAt: mockDate, modifiedAt: mockDate },
    { id: 'file-2', name: 'contract.pdf', path: '/Documents/contract.pdf', isDirectory: false, size: 245000, mimeType: 'application/pdf', createdAt: mockDate, modifiedAt: mockDate },
    { id: 'file-3', name: 'invoice.pdf', path: '/Documents/invoice.pdf', isDirectory: false, size: 128000, mimeType: 'application/pdf', createdAt: mockDate, modifiedAt: mockDate },
    { id: 'file-4', name: 'notes.txt', path: '/Documents/notes.txt', isDirectory: false, size: 512, mimeType: 'text/plain', createdAt: mockDate, modifiedAt: mockDate },
  ],
  '/Documents/Reports': [
    { id: 'file-5', name: 'Q1-2024.pdf', path: '/Documents/Reports/Q1-2024.pdf', isDirectory: false, size: 512000, mimeType: 'application/pdf', createdAt: mockDate, modifiedAt: mockDate },
    { id: 'file-6', name: 'Q2-2024.pdf', path: '/Documents/Reports/Q2-2024.pdf', isDirectory: false, size: 480000, mimeType: 'application/pdf', createdAt: mockDate, modifiedAt: mockDate },
  ],
  '/Images': [
    { id: 'file-7', name: 'logo.png', path: '/Images/logo.png', isDirectory: false, size: 32000, mimeType: 'image/png', createdAt: mockDate, modifiedAt: mockDate },
    { id: 'file-8', name: 'banner.jpg', path: '/Images/banner.jpg', isDirectory: false, size: 156000, mimeType: 'image/jpeg', createdAt: mockDate, modifiedAt: mockDate },
  ],
};

const MOCK_TREE: TreeNode[] = [
  {
    id: 'folder-1',
    name: 'Documents',
    path: '/Documents',
    children: [
      { id: 'folder-3', name: 'Reports', path: '/Documents/Reports', children: [] },
    ],
  },
  {
    id: 'folder-2',
    name: 'Images',
    path: '/Images',
    children: [],
  },
];

/**
 * Create a mock FileBrowserAPI for demonstration
 */
function create_mock_api(): FileBrowserAPI {
  return {
    listDirectory: async (path: string) => {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
      const files = MOCK_FILES[path] || [];
      return { success: true, data: files };
    },
    getFolderTree: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true, data: MOCK_TREE };
    },
    createDirectory: async (path: string) => {
      return {
        success: true as const,
        data: {
          name: path.split('/').pop() || '',
          path,
          type: 'folder' as const
        }
      };
    },
    removeDirectory: async () => {
      return { success: true, data: undefined };
    },
    uploadFile: async (_file: File, remotePath: string) => {
      const file: FileItem = {
        id: `file-${Date.now()}`,
        name: remotePath.split('/').pop() || '',
        path: remotePath,
        isDirectory: false,
        size: _file.size,
        mimeType: _file.type || 'application/octet-stream',
        createdAt: new Date(),
        modifiedAt: new Date()
      };
      return { success: true, data: file };
    },
    downloadFile: async () => {
      return { success: true, data: new Blob(['Mock file content']) };
    },
    deleteFile: async () => {
      return { success: true, data: undefined };
    },
    renameFile: async (path: string, newName: string) => {
      const parentPath = path.substring(0, path.lastIndexOf('/'));
      const file: FileItem = {
        id: `file-${Date.now()}`,
        name: newName,
        path: `${parentPath}/${newName}`,
        isDirectory: false,
        size: 0,
        mimeType: 'application/octet-stream',
        createdAt: new Date(),
        modifiedAt: new Date()
      };
      return { success: true, data: file };
    },
    renameFolder: async (path: string, newName: string) => {
      const parentPath = path.substring(0, path.lastIndexOf('/'));
      return {
        success: true as const,
        data: {
          name: newName,
          path: `${parentPath}/${newName}`,
          type: 'folder' as const
        }
      };
    },
    moveItem: async (_sourcePath: string, destinationPath: string) => {
      const file: FileItem = {
        id: `file-${Date.now()}`,
        name: destinationPath.split('/').pop() || '',
        path: destinationPath,
        isDirectory: false,
        size: 0,
        mimeType: 'application/octet-stream',
        createdAt: new Date(),
        modifiedAt: new Date()
      };
      return { success: true, data: file };
    },
  };
}

interface FileBrowserComponentProps {
  api: FileBrowserAPI;
  initialPath?: string;
  showPreview?: boolean;
  showTree?: boolean;
  viewMode?: 'grid' | 'list';
  className?: string;
  onSelect?: (item: FileSystemItem) => void;
}

/**
 * Check if hazo_files is available and load its FileBrowser component
 */
async function load_hazo_files_components(): Promise<{
  FileBrowser: ComponentType<FileBrowserComponentProps> | null;
  available: boolean;
}> {
  try {
    // Try to dynamically import hazo_files UI components
    const hazo_files_ui = await import('hazo_files/ui');
    return {
      // Type assertion needed due to slight API differences between local mock types and hazo_files types
      FileBrowser: hazo_files_ui.FileBrowser as unknown as ComponentType<FileBrowserComponentProps>,
      available: true,
    };
  } catch {
    // hazo_files not available
    return {
      FileBrowser: null,
      available: false,
    };
  }
}

/**
 * File Browser demo page component
 */
export default function FileBrowserDemoPage() {
  const [hazo_files_available, setHazoFilesAvailable] = useState<boolean | null>(null);
  const [FileBrowser, setFileBrowser] = useState<ComponentType<FileBrowserComponentProps> | null>(null);
  const [selected_item, setSelectedItem] = useState<FileSystemItem | null>(null);

  // Create mock API (memoized to prevent recreation on each render)
  const mock_api = useMemo(() => create_mock_api(), []);

  // Check for hazo_files availability on mount
  useEffect(() => {
    load_hazo_files_components().then(({ FileBrowser: FB, available }) => {
      setHazoFilesAvailable(available);
      setFileBrowser(() => FB);
    });
  }, []);

  const handle_file_select = (item: FileSystemItem) => {
    console.log('[FileBrowserDemo] File selected:', item);
    setSelectedItem(item);
  };

  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">File Browser Demo (hazo_files Integration)</h2>
          <p className="text-muted-foreground">
            Demonstrates integration between hazo_pdf and hazo_files for loading
            and saving PDFs from cloud storage (Google Drive, local filesystem).
          </p>
        </div>

        {/* Code Example */}
        <CodePreview
          title="Integration Example"
          code={`import { PdfViewer } from 'hazo_pdf';
import { FileManager } from 'hazo_files';
import 'hazo_pdf/styles.css';

// Initialize hazo_files FileManager (see hazo_files docs for setup)
const file_manager = new FileManager({
  storage_type: 'google_drive',
  // ... your configuration
});
await file_manager.initialize();

function App() {
  return (
    <PdfViewer
      // Load PDF from Google Drive via hazo_files
      url="documents/report.pdf"
      file_manager={file_manager}

      // Save annotated PDF back to Google Drive
      save_path="documents/report_annotated.pdf"

      // Optional: still receive the PDF bytes in callback
      on_save={(bytes, filename) => {
        console.log('PDF saved to cloud:', filename);
      }}

      className="h-full w-full"
    />
  );
}`}
        />

        {/* Status Section */}
        <div className="cls_demo_status mb-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">hazo_files Status</h3>
          {hazo_files_available === null && (
            <p className="text-gray-500">Checking hazo_files availability...</p>
          )}
          {hazo_files_available === true && (
            <div>
              <p className="text-green-600 font-medium">hazo_files is available</p>
              <p className="text-sm text-gray-500 mt-1">
                Using mock data for demonstration. In production, connect to Google Drive or local filesystem.
              </p>
              {selected_item && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: <code className="bg-gray-100 px-1 rounded">{selected_item.path}</code>
                  {!selected_item.isDirectory && (selected_item as FileItem).mimeType === 'application/pdf' && (
                    <span className="ml-2 text-blue-600">(PDF - can be opened in PdfViewer)</span>
                  )}
                </p>
              )}
            </div>
          )}
          {hazo_files_available === false && (
            <div>
              <p className="text-amber-600 font-medium mb-2">hazo_files is not installed</p>
              <p className="text-sm text-gray-600 mb-2">
                To use the file browser and cloud storage features, install hazo_files:
              </p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                npm install hazo_files
              </pre>
              <p className="text-sm text-gray-500 mt-2">
                hazo_files provides storage abstraction for local filesystem, Google Drive,
                and other cloud providers.
              </p>
            </div>
          )}
        </div>

        {/* File Browser Component */}
        <div className="cls_demo_browser flex-1 min-h-[400px] border rounded-lg overflow-hidden">
          {hazo_files_available === null && (
            <div className="p-8 text-center text-gray-500">
              Loading...
            </div>
          )}
          {hazo_files_available === true && FileBrowser && (
            <Suspense fallback={<div className="p-8 text-center">Loading FileBrowser...</div>}>
              <FileBrowser
                api={mock_api}
                initialPath="/"
                showTree={true}
                showPreview={false}
                viewMode="list"
                onSelect={handle_file_select}
              />
            </Suspense>
          )}
          {hazo_files_available === false && (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">
                Install hazo_files to enable the file browser component
              </p>
            </div>
          )}
        </div>

        {/* Feature List */}
        <div className="cls_demo_features mt-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">hazo_files Integration Features</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Load PDFs directly from Google Drive or other cloud storage</li>
            <li>Save annotated PDFs back to cloud storage</li>
            <li>Unified API for local and cloud file operations</li>
            <li>Optional - PdfViewer works normally without hazo_files installed</li>
            <li>FileBrowser UI component for visual file selection</li>
          </ul>
        </div>
      </div>
    </TestAppLayout>
  );
}
