/**
 * Prompt Editor Demo Page
 * Demonstrates the PromptEditor component from hazo_llm_api
 */

"use client";

import { Suspense, lazy, useState, useEffect, useMemo, useRef } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";
import type { HazoConnect } from "hazo_llm_api";

// Lazy load PromptEditor to avoid SSR issues
const PromptEditor = lazy(() =>
  import("hazo_llm_api").then((mod) => ({ default: mod.PromptEditor }))
);

/**
 * Prompt Editor content component
 */
function PromptEditorContent() {
  const [connect, setConnect] = useState<HazoConnect | null>(null);
  const [loading, setLoading] = useState(true);
  // Use ref to ensure connect is only created once (survives StrictMode remounts)
  const connect_ref = useRef<HazoConnect | null>(null);

  // Memoize customization to prevent infinite re-renders in PromptEditor
  const customization = useMemo(() => ({
    title: "Prompt Library",
    description: "Manage LLM prompts for PDF extraction",
  }), []);

  useEffect(() => {
    // If already initialized, reuse the same connect object
    if (connect_ref.current) {
      setConnect(connect_ref.current);
      setLoading(false);
      return;
    }

    async function initConnect() {
      try {
        const { create_rest_api_connect } = await import("hazo_llm_api");
        const new_connect = create_rest_api_connect("/api/prompts");
        connect_ref.current = new_connect;
        setConnect(new_connect);
      } catch (error) {
        console.error("[PromptEditor] Failed to initialize:", error);
      } finally {
        setLoading(false);
      }
    }
    initConnect();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Initializing...</div>;
  }

  if (!connect) {
    return <div className="p-8 text-center text-red-500">Failed to initialize PromptEditor</div>;
  }

  return (
    <PromptEditor
      connect={connect}
      customization={customization}
    />
  );
}

/**
 * Prompt Editor demo page component
 */
export default function PromptEditorDemoPage() {
  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">Prompt Editor</h2>
          <p className="text-muted-foreground">
            Create and manage LLM prompts using the hazo_llm_api PromptEditor component.
          </p>
        </div>

        {/* Code Example */}
        <CodePreview
          title="Code Example"
          code={`import { PromptEditor, create_rest_api_connect } from 'hazo_llm_api';

function PromptEditorPage() {
  const connect = create_rest_api_connect('/api/prompts');

  return (
    <PromptEditor
      connect={connect}
      customization={{
        title: 'Prompt Library',
        description: 'Manage LLM prompts for PDF extraction',
      }}
    />
  );
}`}
        />

        {/* Prompt Editor */}
        <div className="cls_demo_viewer flex-1 min-h-[500px] border rounded-lg overflow-hidden">
          <Suspense
            fallback={
              <div className="p-8 text-center">Loading Prompt Editor...</div>
            }
          >
            <PromptEditorContent />
          </Suspense>
        </div>
      </div>
    </TestAppLayout>
  );
}
