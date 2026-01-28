"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Home, FileText, ChevronRight, ChevronDown, Layout, MessageSquare, PanelRight, Settings, Highlighter, Files, Code, FolderOpen, Sparkles, Table2, FileSearch } from "lucide-react";

/**
 * File info from API
 */
interface FileInfo {
  name: string;
  path: string;
}

/**
 * Props for TestAppLayout component
 */
interface TestAppLayoutProps {
  children?: React.ReactNode;
}

/**
 * Props for CodePreview component
 */
interface CodePreviewProps {
  code: string;
  title?: string;
}

/**
 * Collapsible code preview component - closed by default
 */
export function CodePreview({ code, title = "Code Example" }: CodePreviewProps) {
  const [is_open, setIsOpen] = useState(false);

  return (
    <div className="cls_code_preview mb-4 border rounded-lg overflow-hidden bg-gray-50">
      <button
        onClick={() => setIsOpen(!is_open)}
        className="cls_code_preview_header w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Code size={16} className="text-gray-500" />
        <span>{title}</span>
        {is_open ? (
          <ChevronDown size={16} className="ml-auto text-gray-400" />
        ) : (
          <ChevronRight size={16} className="ml-auto text-gray-400" />
        )}
      </button>
      {is_open && (
        <div className="cls_code_preview_content border-t bg-white">
          <pre className="p-4 text-sm overflow-auto max-h-[400px]">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Test app layout component with shadcn sidebar
 */
export function TestAppLayout({ children }: TestAppLayoutProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);

  // Fetch files from API
  useEffect(() => {
    async function fetch_files() {
      try {
        setFilesLoading(true);
        setFilesError(null);
        const response = await fetch('/api/test-app/files');
        
        if (!response.ok) {
          const data = await response.json();
          setFilesError(data.error || 'Failed to load files');
          setFiles([]);
          return;
        }
        
        const data = await response.json();
        setFiles(data.files || []);
      } catch (error) {
        console.error('[TestAppLayout] Error fetching files:', error);
        setFilesError(error instanceof Error ? error.message : 'Failed to load files');
        setFiles([]);
      } finally {
        setFilesLoading(false);
      }
    }
    
    fetch_files();
  }, []);

  return (
    <SidebarProvider>
      <Sidebar className="cls_test_app_sidebar">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="cls_test_app_sidebar_label">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/" className="cls_test_app_sidebar_menu_item">
                      <Home className="cls_test_app_sidebar_menu_icon" />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Docs">
                    <div className="cls_test_app_sidebar_menu_item flex items-center gap-2">
                      <FileText className="cls_test_app_sidebar_menu_icon" />
                      <span>Docs</span>
                      {files.length > 0 && (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </div>
                  </SidebarMenuButton>
                  {files.length > 0 && (
                    <SidebarMenuSub className="cls_test_app_sidebar_files_list">
                      {files.map((file) => (
                        <SidebarMenuSubItem key={file.name}>
                          <SidebarMenuSubButton asChild>
                            <Link 
                              href={`/viewer/${encodeURIComponent(file.name)}`}
                              className="cls_test_app_sidebar_file_item"
                            >
                              <FileText className="h-4 w-4" />
                              <span>{file.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                  {filesLoading && (
                    <div className="cls_test_app_sidebar_files_loading px-4 py-2 text-sm text-muted-foreground">
                      Loading files...
                    </div>
                  )}
                  {filesError && !filesLoading && (
                    <div className="cls_test_app_sidebar_files_error px-4 py-2 text-sm text-muted-foreground">
                      {filesError}
                    </div>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Layout Demos Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="cls_test_app_sidebar_label">
              Layout Demos
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/embedded" className="cls_test_app_sidebar_menu_item">
                      <Layout className="cls_test_app_sidebar_menu_icon" />
                      <span>Embedded</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/dialog" className="cls_test_app_sidebar_menu_item">
                      <MessageSquare className="cls_test_app_sidebar_menu_icon" />
                      <span>Dialog</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/sidepanel" className="cls_test_app_sidebar_menu_item">
                      <PanelRight className="cls_test_app_sidebar_menu_icon" />
                      <span>Side Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Configuration Demos Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="cls_test_app_sidebar_label">
              Configuration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/toolbar-config" className="cls_test_app_sidebar_menu_item">
                      <Settings className="cls_test_app_sidebar_menu_icon" />
                      <span>Toolbar Config</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/highlight" className="cls_test_app_sidebar_menu_item">
                      <Highlighter className="cls_test_app_sidebar_menu_icon" />
                      <span>Highlight API</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* File Management Demos Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="cls_test_app_sidebar_label">
              File Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/multi-file" className="cls_test_app_sidebar_menu_item">
                      <Files className="cls_test_app_sidebar_menu_icon" />
                      <span>Multi-File</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/file-browser" className="cls_test_app_sidebar_menu_item">
                      <FolderOpen className="cls_test_app_sidebar_menu_icon" />
                      <span>File Browser</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/file-table" className="cls_test_app_sidebar_menu_item">
                      <Table2 className="cls_test_app_sidebar_menu_icon" />
                      <span>File Table</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* LLM Tools Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="cls_test_app_sidebar_label">
              LLM Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/prompt-editor" className="cls_test_app_sidebar_menu_item">
                      <Sparkles className="cls_test_app_sidebar_menu_icon" />
                      <span>Prompt Editor</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/demo/server-extract" className="cls_test_app_sidebar_menu_item">
                      <FileSearch className="cls_test_app_sidebar_menu_icon" />
                      <span>Server Extract</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="cls_test_app_header flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold">Test App</h1>
        </header>
        <div className="cls_test_app_content flex flex-1 flex-col gap-4 p-4 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

