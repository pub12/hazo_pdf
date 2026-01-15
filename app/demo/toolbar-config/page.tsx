/**
 * Toolbar Configuration Demo Page
 * Interactive demo for configuring toolbar button visibility
 */

"use client";

import { Suspense, lazy, useState } from "react";
import { TestAppLayout, CodePreview } from "@/app/test-app-layout";

// Lazy load PdfViewer to avoid SSR issues with pdfjs-dist
const PdfViewer = lazy(() =>
  import("@/app/lib/hazo_pdf").then((mod) => ({ default: mod.PdfViewer }))
);

/**
 * Toggle switch component
 */
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4"
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * Toolbar configuration demo page component
 */
export default function ToolbarConfigDemoPage() {
  // Toolbar configuration state
  const [toolbar_enabled, setToolbarEnabled] = useState(true);
  const [show_zoom_controls, setShowZoomControls] = useState(true);
  const [show_square_button, setShowSquareButton] = useState(true);
  const [show_undo_button, setShowUndoButton] = useState(true);
  const [show_redo_button, setShowRedoButton] = useState(true);
  const [show_save_button, setShowSaveButton] = useState(true);
  const [show_metadata_button, setShowMetadataButton] = useState(true);
  const [show_close_button, setShowCloseButton] = useState(false);

  // Generate code snippet based on current configuration
  const generate_code_snippet = () => {
    const props: string[] = ['url="/document.pdf"'];

    if (!toolbar_enabled) {
      props.push("toolbar_enabled={false}");
    } else {
      if (!show_zoom_controls) props.push("show_zoom_controls={false}");
      if (!show_square_button) props.push("show_square_button={false}");
      if (!show_undo_button) props.push("show_undo_button={false}");
      if (!show_redo_button) props.push("show_redo_button={false}");
      if (!show_save_button) props.push("show_save_button={false}");
      if (!show_metadata_button) props.push("show_metadata_button={false}");
      if (show_close_button) props.push("on_close={() => handleClose()}");
    }

    return `<PdfViewer
  ${props.join("\n  ")}
/>`;
  };

  return (
    <TestAppLayout>
      <div className="cls_demo_page flex flex-col h-full">
        <div className="cls_demo_header mb-4">
          <h2 className="text-2xl font-bold">Toolbar Configuration Demo</h2>
          <p className="text-muted-foreground">
            Toggle toolbar buttons on/off to customize the viewer. Props override config file values.
          </p>
        </div>

        {/* Controls */}
        <div className="cls_demo_controls mb-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-3">Toolbar Controls</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Toggle
              label="Toolbar Enabled"
              checked={toolbar_enabled}
              onChange={setToolbarEnabled}
            />
            <Toggle
              label="Zoom Controls"
              checked={show_zoom_controls}
              onChange={setShowZoomControls}
            />
            <Toggle
              label="Square Button"
              checked={show_square_button}
              onChange={setShowSquareButton}
            />
            <Toggle
              label="Undo Button"
              checked={show_undo_button}
              onChange={setShowUndoButton}
            />
            <Toggle
              label="Redo Button"
              checked={show_redo_button}
              onChange={setShowRedoButton}
            />
            <Toggle
              label="Save Button"
              checked={show_save_button}
              onChange={setShowSaveButton}
            />
            <Toggle
              label="Metadata Button"
              checked={show_metadata_button}
              onChange={setShowMetadataButton}
            />
            <Toggle
              label="Close Button"
              checked={show_close_button}
              onChange={setShowCloseButton}
            />
          </div>
        </div>

        {/* Generated Code */}
        <CodePreview
          title="Generated Code"
          code={generate_code_snippet()}
        />

        {/* PDF Viewer with current configuration */}
        <div className="cls_demo_viewer flex-1 min-h-[400px] border rounded-lg overflow-hidden">
          <Suspense fallback={<div className="p-8 text-center">Loading PDF viewer...</div>}>
            <PdfViewer
              url="/api/test-app/files/sample.pdf"
              className="h-full w-full"
              toolbar_enabled={toolbar_enabled}
              show_zoom_controls={show_zoom_controls}
              show_square_button={show_square_button}
              show_undo_button={show_undo_button}
              show_redo_button={show_redo_button}
              show_save_button={show_save_button}
              show_metadata_button={show_metadata_button}
              on_close={show_close_button ? () => alert("Close button clicked!") : undefined}
              sidepanel_metadata_enabled={true}
              metadata_input={{
                header: [{ style: "h3", label: "Document Metadata" }],
                data: [
                  { label: "Title", style: "body", value: "Sample Document", editable: false },
                  { label: "Author", style: "body", value: "Test Author", editable: true },
                ],
                footer: [{ style: "body", label: "Demo metadata" }],
              }}
            />
          </Suspense>
        </div>
      </div>
    </TestAppLayout>
  );
}
