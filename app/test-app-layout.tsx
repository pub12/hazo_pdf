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
    <div className="cls_code_preview mb-6 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!is_open)}
        className="cls_code_preview_header w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center">
          <Code size={16} className="text-gray-500" />
        </div>
        <span>{title}</span>
        <div className={`ml-auto w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center transition-transform ${is_open ? 'rotate-180' : ''}`}>
          <ChevronDown size={14} className="text-gray-500" />
        </div>
      </button>
      {is_open && (
        <div className="cls_code_preview_content border-t border-gray-100">
          <pre className="p-5 text-sm overflow-auto max-h-[400px] bg-gray-900 text-gray-100 font-mono leading-relaxed">
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
        <header className="cls_test_app_header flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-6 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <SidebarTrigger className="-ml-1 hover:bg-gray-100 rounded-lg transition-colors" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
              <FileText size={16} className="text-white" />
            </div>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Hazo PDF</h1>
          </div>
        </header>
        <div className="cls_test_app_content flex flex-1 flex-col gap-4 p-6 overflow-hidden bg-gradient-to-br from-gray-50/50 to-white">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

