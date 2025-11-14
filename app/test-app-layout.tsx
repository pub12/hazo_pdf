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
import { Home, FileText, ChevronRight } from "lucide-react";

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

