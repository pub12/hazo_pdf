# Hazo PDF

A React component library for viewing and annotating PDF documents with support for Square annotations, FreeText annotations, custom stamps, timestamps, and comprehensive styling customization.

## Features

- 📄 **PDF Viewing** - Render PDF documents with customizable zoom levels
- ✏️ **Annotations** - Square and FreeText annotation tools
- 🔍 **Programmatic Highlights** - Ref-based API for creating and managing highlights programmatically
- 🎨 **Customizable Styling** - Extensive configuration options via INI file
- ⏰ **Timestamp Support** - Automatic timestamp appending to annotations
- 🏷️ **Custom Stamps** - Add quick-insert stamps via right-click menu
- 💾 **Annotation Persistence** - Save annotations directly into PDF files
- 🎯 **Pan Tool** - Default pan/scroll mode for document navigation
- ↪️ **Undo/Redo** - Full annotation history management

## Installation

```bash
npm install hazo_pdf
```

## CSS Import Options

The library provides two CSS files to choose from:

### For apps with existing styles (Recommended)

Use `styles.css` - this does NOT include Tailwind preflight/base resets, so it won't interfere with your existing styles:

```tsx
import 'hazo_pdf/styles.css';
```

### For standalone apps

Use `styles-full.css` - includes Tailwind preflight/base styles for apps without existing CSS resets:

```tsx
import 'hazo_pdf/styles-full.css';
```

## Container Requirements

The PDF viewer requires its parent container to have explicit dimensions:

```tsx
// Good - explicit dimensions
<div style={{ width: '100%', height: '600px' }}>
  <PdfViewer url="/document.pdf" />
</div>

// Bad - no explicit height
<div>
  <PdfViewer url="/document.pdf" />
</div>
```

**Requirements:**
- Parent must have explicit `width` and `height` (CSS or inline style)
- Recommended minimum size: 400x400px
- Parent should NOT have `overflow: hidden` (the viewer handles its own scrolling)

## Quick Start

```tsx
import { PdfViewer } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function App() {
  return (
    <PdfViewer 
      url="/path/to/document.pdf"
    />
  );
}
```

That's it! The PDF viewer will load and display your document with default styling and pan mode enabled.

---

## Examples

### Simple Example - Basic PDF Viewer

The simplest usage - just display a PDF:

```tsx
import { PdfViewer } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function SimpleViewer() {
  return (
    <div style={{ width: '100%', height: '800px' }}>
      <PdfViewer 
        url="/api/documents/sample.pdf"
        className="h-full w-full"
      />
    </div>
  );
}
```

**Features demonstrated:**
- Basic PDF rendering
- Default pan tool (drag to scroll)
- Default styling

---

### Medium Complexity Example - With Annotations and Callbacks

A more feature-rich implementation with annotation handling:

```tsx
import { useState } from 'react';
import { PdfViewer } from 'hazo_pdf';
import type { PdfAnnotation, PDFDocumentProxy } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function AnnotatedViewer() {
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);

  const handleLoad = (pdf: PDFDocumentProxy) => {
    console.log('PDF loaded:', pdf.numPages, 'pages');
    setPdfDoc(pdf);
  };

  const handleAnnotationCreate = (annotation: PdfAnnotation) => {
    console.log('Annotation created:', annotation);
    setAnnotations(prev => [...prev, annotation]);
  };

  const handleAnnotationUpdate = (annotation: PdfAnnotation) => {
    console.log('Annotation updated:', annotation);
    setAnnotations(prev => 
      prev.map(a => a.id === annotation.id ? annotation : a)
    );
  };

  const handleAnnotationDelete = (annotationId: string) => {
    console.log('Annotation deleted:', annotationId);
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
  };

  const handleSave = (pdfBytes: Uint8Array, filename: string) => {
    // Create a blob and download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'annotated-document.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleError = (error: Error) => {
    console.error('PDF error:', error);
    alert(`Failed to load PDF: ${error.message}`);
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PdfViewer 
        url="/api/documents/report.pdf"
        className="h-full w-full"
        scale={1.2}
        annotations={annotations}
        on_load={handleLoad}
        on_error={handleError}
        on_annotation_create={handleAnnotationCreate}
        on_annotation_update={handleAnnotationUpdate}
        on_annotation_delete={handleAnnotationDelete}
        on_save={handleSave}
        background_color="#f5f5f5"
      />
    </div>
  );
}
```

**Features demonstrated:**
- Annotation state management
- Callback handlers for all events
- Custom zoom level (1.2x)
- Custom background color
- PDF download with annotations

---

### Complex Example - Full Configuration with Custom Stamps and Timestamps

A production-ready implementation with configuration file, custom stamps, timestamps, and advanced features:

```tsx
import { useState, useEffect } from 'react';
import { PdfViewer } from 'hazo_pdf';
import type { PdfAnnotation, PDFDocumentProxy } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function ProductionViewer() {
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [initialScale, setInitialScale] = useState(1.0);

  // Load saved annotations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pdf-annotations');
    if (saved) {
      try {
        setAnnotations(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved annotations:', e);
      }
    }

    // Save window size to adjust scale
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setInitialScale(0.75); // Mobile
      } else if (width < 1024) {
        setInitialScale(1.0); // Tablet
      } else {
        setInitialScale(1.25); // Desktop
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Persist annotations to localStorage
  useEffect(() => {
    if (annotations.length > 0) {
      localStorage.setItem('pdf-annotations', JSON.stringify(annotations));
    }
  }, [annotations]);

  const handleAnnotationCreate = (annotation: PdfAnnotation) => {
    setAnnotations(prev => {
      const updated = [...prev, annotation];
      // Save to server
      fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation),
      }).catch(err => console.error('Failed to save annotation:', err));
      return updated;
    });
  };

  const handleAnnotationUpdate = (annotation: PdfAnnotation) => {
    setAnnotations(prev => {
      const updated = prev.map(a => a.id === annotation.id ? annotation : a);
      // Update on server
      fetch(`/api/annotations/${annotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation),
      }).catch(err => console.error('Failed to update annotation:', err));
      return updated;
    });
  };

  const handleAnnotationDelete = (annotationId: string) => {
    setAnnotations(prev => {
      const updated = prev.filter(a => a.id !== annotationId);
      // Delete on server
      fetch(`/api/annotations/${annotationId}`, {
        method: 'DELETE',
      }).catch(err => console.error('Failed to delete annotation:', err));
      return updated;
    });
  };

  const handleSave = async (pdfBytes: Uint8Array, filename: string) => {
    try {
      // Upload to server
      const formData = new FormData();
      formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), filename);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`PDF saved successfully: ${result.url}`);
      } else {
        throw new Error('Failed to upload PDF');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save PDF');
    }
  };

  // Custom stamps configuration
  const customStamps = JSON.stringify([
    {
      name: "Verified",
      text: "✅",
      order: 1,
      time_stamp_suffix_enabled: true,
      fixed_text_suffix_enabled: true,
      background_color: "rgb(255, 255, 255)",
      border_size: 0,
      font_color: "#000000",
      font_weight: "bold",
      font_size: 16
    },
    {
      name: "Rejected",
      text: "❌",
      order: 2,
      time_stamp_suffix_enabled: true,
      fixed_text_suffix_enabled: false,
      background_color: "rgb(255, 200, 200)",
      border_size: 1,
      font_color: "#000000",
      font_size: 14
    },
    {
      name: "Needs Review",
      text: "⚠️",
      order: 3,
      time_stamp_suffix_enabled: false,
      fixed_text_suffix_enabled: false,
      background_color: "rgb(255, 255, 200)",
      border_size: 2,
      font_color: "#000000",
      font_size: 12
    }
  ]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <h1>Document Viewer</h1>
        <p>Annotations: {annotations.length} | 
          <button onClick={() => setAnnotations([])}>Clear All</button>
        </p>
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PdfViewer 
          url="/api/documents/contract.pdf"
          config_file="config/hazo_pdf_config.ini"
          className="h-full w-full"
          scale={initialScale}
          annotations={annotations}
          on_annotation_create={handleAnnotationCreate}
          on_annotation_update={handleAnnotationUpdate}
          on_annotation_delete={handleAnnotationDelete}
          on_save={handleSave}
          append_timestamp_to_text_edits={true}
          annotation_text_suffix_fixed_text="Reviewer"
          right_click_custom_stamps={customStamps}
          background_color="#ffffff"
        />
      </div>
    </div>
  );
}
```

**Features demonstrated:**
- Configuration file integration (`config/hazo_pdf_config.ini`)
- Custom stamps with styling
- Timestamp and fixed text suffixes
- Responsive scaling based on screen size
- LocalStorage persistence
- Server synchronization
- Complex state management
- Custom UI wrapper

---

## Configuration File

The PDF viewer can be configured via an INI file (default: `config/hazo_pdf_config.ini`). This allows you to customize styling, colors, fonts, and behavior without modifying code.

**Basic setup:**

```ini
[viewer]
viewer_background_color = #f5f5f5
append_timestamp_to_text_edits = true
annotation_text_suffix_fixed_text = user_x

[freetext_annotation]
freetext_text_color = #0066cc
freetext_background_color = rgb(230, 243, 255)
freetext_background_opacity = 0.1
freetext_border_color = #003366
freetext_border_width = 1

[toolbar]
toolbar_background_color = rgb(240, 248, 255)
toolbar_font_color = rgb(30, 58, 138)
toolbar_button_background_color = rgb(219, 234, 254)
toolbar_button_text_color = rgb(30, 64, 175)
toolbar_button_save_background_color = rgb(34, 197, 94)

[context_menu]
right_click_custom_stamps = [{"name":"Verified","text":"✅","order":1,"time_stamp_suffix_enabled":true,"fixed_text_suffix_enabled":true}]
```

See `config/hazo_pdf_config.ini` in the project root for all available configuration options.

---

## Programmatic Highlight API

The PDF viewer exposes a ref-based API for programmatically creating, removing, and managing highlights. This allows external code to control highlights without user interaction.

### Basic Usage

```tsx
import { PdfViewer, PdfViewerRef } from 'hazo_pdf';
import { useRef } from 'react';
import 'hazo_pdf/styles.css';

function HighlightExample() {
  const viewer_ref = useRef<PdfViewerRef>(null);

  const add_highlight = () => {
    // Highlight region on page 0 at PDF coordinates [100, 500, 300, 550]
    const id = viewer_ref.current?.highlight_region(0, [100, 500, 300, 550], {
      border_color: '#FF0000',
      background_color: '#FFFF00',
      background_opacity: 0.4
    });
    console.log('Created highlight:', id);
  };

  const remove_specific_highlight = (id: string) => {
    const removed = viewer_ref.current?.remove_highlight(id);
    console.log('Highlight removed:', removed);
  };

  const clear_all = () => {
    viewer_ref.current?.clear_all_highlights();
  };

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <button onClick={add_highlight}>Add Highlight</button>
      <button onClick={clear_all}>Clear All Highlights</button>

      <PdfViewer
        ref={viewer_ref}
        url="/document.pdf"
      />
    </div>
  );
}
```

### PdfViewerRef Interface

The ref exposes three methods for highlight management:

#### `highlight_region(page_index, rect, options?)`

Creates a new highlight annotation on the specified page.

**Parameters:**
- `page_index` (number): Zero-based page index where the highlight should appear
- `rect` ([number, number, number, number]): Rectangle coordinates in PDF space [x1, y1, x2, y2]
- `options` (HighlightOptions, optional): Styling options

**Returns:** `string` - The unique ID of the created highlight annotation

**HighlightOptions:**
```typescript
{
  border_color?: string;       // Hex color (e.g., "#FF0000")
  background_color?: string;   // Hex color (e.g., "#FFFF00")
  background_opacity?: number; // 0-1 (e.g., 0.4)
}
```

**Example:**
```tsx
const id = viewer_ref.current?.highlight_region(
  0,                      // Page 0
  [100, 500, 300, 550],   // PDF coordinates
  {
    border_color: '#FF0000',
    background_color: '#FFFF00',
    background_opacity: 0.4
  }
);
```

#### `remove_highlight(id)`

Removes a specific highlight by its ID.

**Parameters:**
- `id` (string): The highlight ID returned from `highlight_region()`

**Returns:** `boolean` - `true` if the highlight was found and removed, `false` otherwise

**Example:**
```tsx
const removed = viewer_ref.current?.remove_highlight('highlight-123');
if (removed) {
  console.log('Highlight removed successfully');
}
```

#### `clear_all_highlights()`

Removes all highlights created via the `highlight_region()` API. Does not affect user-created annotations.

**Example:**
```tsx
viewer_ref.current?.clear_all_highlights();
```

### Advanced Example: Search Results Highlighting

A common use case is highlighting search results in a PDF:

```tsx
import { useState, useRef } from 'react';
import { PdfViewer, PdfViewerRef } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

interface SearchResult {
  page: number;
  rect: [number, number, number, number];
  text: string;
}

function SearchableViewer() {
  const viewer_ref = useRef<PdfViewerRef>(null);
  const [highlight_ids, set_highlight_ids] = useState<string[]>([]);

  // Simulated search results
  const search_results: SearchResult[] = [
    { page: 0, rect: [100, 500, 300, 550], text: 'Result 1' },
    { page: 0, rect: [100, 400, 300, 450], text: 'Result 2' },
    { page: 1, rect: [150, 600, 350, 650], text: 'Result 3' }
  ];

  const highlight_search_results = () => {
    // Clear previous highlights
    viewer_ref.current?.clear_all_highlights();

    // Add new highlights
    const ids = search_results.map(result =>
      viewer_ref.current?.highlight_region(result.page, result.rect, {
        border_color: '#3B82F6',
        background_color: '#DBEAFE',
        background_opacity: 0.3
      })
    ).filter(Boolean) as string[];

    set_highlight_ids(ids);
  };

  const clear_search = () => {
    viewer_ref.current?.clear_all_highlights();
    set_highlight_ids([]);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', background: '#f0f0f0' }}>
        <button onClick={highlight_search_results}>
          Highlight Search Results ({search_results.length})
        </button>
        <button onClick={clear_search}>Clear Highlights</button>
        <span>Highlighted: {highlight_ids.length} results</span>
      </div>

      <div style={{ flex: 1 }}>
        <PdfViewer
          ref={viewer_ref}
          url="/document.pdf"
        />
      </div>
    </div>
  );
}
```

### Coordinate System Notes

- Highlights use PDF coordinate space (points), not screen pixels
- PDF coordinates start at the bottom-left corner (Y increases upward)
- The `rect` parameter format is `[x1, y1, x2, y2]` where:
  - `x1, y1`: Bottom-left corner
  - `x2, y2`: Top-right corner
- If you need to convert screen coordinates to PDF coordinates, you'll need to use the PDF page viewport (see the test app for examples)

### Styling Defaults

If no `options` are provided to `highlight_region()`, the highlight uses default colors from the configuration file:
- `border_color`: From `highlight_border_color` config setting
- `background_color`: From `highlight_fill_color` config setting
- `background_opacity`: From `highlight_fill_opacity` config setting

You can override any or all of these on a per-highlight basis.

---

## API Reference

### PdfViewer Props

#### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `url` | `string` | URL or path to the PDF file. Can be a relative path, absolute URL, or API endpoint. |

#### Optional Props

##### Basic Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `""` | Additional CSS classes to apply to the viewer container. |
| `scale` | `number` | `1.0` | Initial zoom level. Values > 1.0 zoom in, < 1.0 zoom out. |
| `background_color` | `string` | `"#2d2d2d"` | Background color for areas outside PDF pages (hex format: `#RRGGBB`). Overrides config file value. |
| `config_file` | `string` | `undefined` | Path to configuration INI file (e.g., `"config/hazo_pdf_config.ini"`). If not provided, uses default configuration. |

##### Event Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `on_load` | `(pdf: PDFDocumentProxy) => void` | Called when PDF is successfully loaded. Receives the PDF document proxy with metadata (page count, etc.). |
| `on_error` | `(error: Error) => void` | Called when an error occurs (PDF load failure, rendering error, etc.). Receives the error object. |
| `on_save` | `(pdf_bytes: Uint8Array, filename: string) => void` | Called when user clicks the Save button. Receives the PDF bytes with annotations embedded and a suggested filename. You can create a Blob and trigger download, or upload to a server. |

##### Annotation Management

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `annotations` | `PdfAnnotation[]` | `[]` | Array of existing annotations to display. Used to restore saved annotations or sync from a server. |
| `on_annotation_create` | `(annotation: PdfAnnotation) => void` | `undefined` | Called when a new annotation is created (Square or FreeText). Use this to persist annotations to your backend. |
| `on_annotation_update` | `(annotation: PdfAnnotation) => void` | `undefined` | Called when an existing annotation is edited (text content changed). Use this to sync updates to your backend. |
| `on_annotation_delete` | `(annotation_id: string) => void` | `undefined` | Called when an annotation is deleted. Receives the annotation ID. Use this to remove annotations from your backend. |

##### Timestamp and Suffix Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `append_timestamp_to_text_edits` | `boolean` | `false` | If `true`, automatically appends a timestamp to all FreeText annotations when created or edited. Format: `[YYYY-MM-DD h:mmam/pm]`. Overrides config file value. |
| `annotation_text_suffix_fixed_text` | `string` | `""` | Fixed text string to append before the timestamp (if timestamps are enabled). This text will be enclosed in brackets. Overrides config file value. |

##### Sidepanel Metadata

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sidepanel_metadata_enabled` | `boolean` | `false` | If `true`, enables the metadata sidepanel on the right side of the viewer. The panel can be toggled from the toolbar or right edge button. |
| `metadata_input` | `MetadataInput` | `undefined` | Metadata structure with header, data (accordions), and footer sections. Each section supports different format types (h1-h5, body) and editable fields. See [Sidepanel Metadata](#sidepanel-metadata) section for details. |
| `on_metadata_change` | `(updatedRow: MetadataDataItem, allData: MetadataInput) => { updatedRow: MetadataDataItem; allData: MetadataInput }` | `undefined` | Callback when a metadata field is edited. Receives the updated row and complete metadata structure. Must return both parameters. Use this to persist metadata changes to your backend. |

##### Custom Stamps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `right_click_custom_stamps` | `string` | `undefined` | JSON array string defining custom stamp menu items for the right-click context menu. Each stamp appears as a menu item that, when clicked, adds predefined text to the PDF. Overrides config file value. |

**Custom Stamp JSON Format:**

```typescript
[
  {
    name: string;                          // Menu item label (required)
    text: string;                          // Text to add to PDF (required)
    order: number;                         // Menu position, lower = higher (required)
    time_stamp_suffix_enabled?: boolean;   // Append timestamp? (default: false)
    fixed_text_suffix_enabled?: boolean;   // Append fixed text? (default: false)
    background_color?: string;             // Hex or rgb() format (default: config)
    border_size?: number;                  // Pixels, 0 = no border (default: config)
    font_color?: string;                   // Hex or rgb() format (default: config)
    font_weight?: string;                  // CSS font-weight (default: config)
    font_style?: string;                   // CSS font-style (default: config)
    font_size?: number;                    // Pixels (default: config)
    font_name?: string;                    // CSS font-family (default: config)
  }
]
```

**Example:**

```tsx
const stamps = JSON.stringify([
  {
    name: "Approved",
    text: "✓",
    order: 1,
    time_stamp_suffix_enabled: true,
    background_color: "rgb(200, 255, 200)",
    border_size: 1,
    font_color: "#000000",
    font_weight: "bold",
    font_size: 16
  }
]);

<PdfViewer
  url="/document.pdf"
  right_click_custom_stamps={stamps}
/>
```

##### Toolbar Visibility

Props to control toolbar button visibility. These override config file values.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `toolbar_enabled` | `boolean` | `true` | Master toggle to show/hide the entire toolbar. |
| `show_zoom_controls` | `boolean` | `true` | Show zoom in/out/reset buttons. |
| `show_square_button` | `boolean` | `true` | Show square annotation button. |
| `show_undo_button` | `boolean` | `true` | Show undo button. |
| `show_redo_button` | `boolean` | `true` | Show redo button. |
| `show_save_button` | `boolean` | `true` | Show save button. |
| `show_metadata_button` | `boolean` | `true` | Show metadata panel button (only visible when `sidepanel_metadata_enabled` is true). |
| `on_close` | `() => void` | `undefined` | Callback when close button is clicked. When provided, shows a close button (X) in the toolbar. Useful for modal/dialog usage. |

**Example - Minimal toolbar:**

```tsx
<PdfViewer
  url="/document.pdf"
  toolbar_enabled={true}
  show_zoom_controls={true}
  show_square_button={false}
  show_undo_button={false}
  show_redo_button={false}
  show_save_button={false}
/>
```

**Example - Dialog with close button:**

```tsx
<PdfViewer
  url="/document.pdf"
  on_close={() => setDialogOpen(false)}
/>
```

### PdfAnnotation Interface

Represents a PDF annotation in the standard PDF coordinate space.

```typescript
interface PdfAnnotation {
  id: string;                              // Unique identifier (auto-generated)
  type: 'Square' | 'FreeText' | 'Highlight' | 'CustomBookmark';
  page_index: number;                      // Zero-based page number
  rect: [number, number, number, number];  // PDF coordinates [x1, y1, x2, y2]
  author: string;                          // Author name (default: "User")
  date: string;                            // ISO date string
  contents: string;                        // Annotation text/content
  color?: string;                          // Color in hex format (e.g., "#FF0000")
  subject?: string;                        // Optional subject/title
  flags?: string;                          // Optional PDF flags
}
```

**Note:** Highlights created via the programmatic API (`PdfViewerRef.highlight_region()`) will have `type: 'Highlight'` and `flags: 'api_highlight'` to distinguish them from user-created annotations.

### PdfViewerRef Interface

Interface for the ref exposed by `PdfViewer`. Use with `useRef<PdfViewerRef>()` to access programmatic highlight methods.

```typescript
interface PdfViewerRef {
  highlight_region: (
    page_index: number,
    rect: [number, number, number, number],
    options?: HighlightOptions
  ) => string;

  remove_highlight: (id: string) => boolean;

  clear_all_highlights: () => void;
}
```

See [Programmatic Highlight API](#programmatic-highlight-api) for detailed usage.

### HighlightOptions Interface

Options for customizing highlights created via the API.

```typescript
interface HighlightOptions {
  border_color?: string;       // Hex format (e.g., "#FF0000")
  background_color?: string;   // Hex format (e.g., "#FFFF00")
  background_opacity?: number; // 0-1 (e.g., 0.4)
}
```

### PDFDocumentProxy

Type from `pdfjs-dist`. Contains PDF metadata and page proxies.

**Common properties:**
- `numPages: number` - Total number of pages
- `getPage(pageNumber: number): Promise<PDFPageProxy>` - Get a specific page

---

## Toolbar Configuration

The toolbar can be fully customized via the `[toolbar]` section in the configuration file. You can configure:

- **Colors**: Background, border, font, and button colors (background, hover, active, save)
- **Fonts**: Font family and size for toolbar text
- **Visibility**: Show/hide individual button groups (zoom, square, undo, redo, save)
- **Labels**: Customize all button labels and text

**All toolbar settings with defaults:**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `toolbar_background_color` | Color | `#f9fafb` | Toolbar background color |
| `toolbar_border_color` | Color | `#e5e7eb` | Toolbar border color |
| `toolbar_font_family` | String | `system-ui, -apple-system, sans-serif` | Font family for toolbar |
| `toolbar_font_size` | Number | `14` | Font size in pixels |
| `toolbar_font_color` | Color | `#111827` | Text color for toolbar |
| `toolbar_button_background_color` | Color | `#ffffff` | Regular button background |
| `toolbar_button_background_color_hover` | Color | `#f3f4f6` | Button hover background |
| `toolbar_button_text_color` | Color | `#374151` | Button text color |
| `toolbar_button_active_background_color` | Color | `#3b82f6` | Active button background |
| `toolbar_button_active_text_color` | Color | `#ffffff` | Active button text color |
| `toolbar_button_save_background_color` | Color | `#10b981` | Save button background |
| `toolbar_button_save_background_color_hover` | Color | `#059669` | Save button hover background |
| `toolbar_button_save_text_color` | Color | `#ffffff` | Save button text color |
| `toolbar_button_disabled_opacity` | Number | `0.5` | Opacity for disabled buttons (0.0-1.0) |
| `toolbar_show_zoom_controls` | Boolean | `true` | Show zoom controls |
| `toolbar_show_square_button` | Boolean | `true` | Show square annotation button |
| `toolbar_show_undo_button` | Boolean | `true` | Show undo button |
| `toolbar_show_redo_button` | Boolean | `true` | Show redo button |
| `toolbar_show_save_button` | Boolean | `true` | Show save button |
| `toolbar_show_metadata_button` | Boolean | `true` | Show metadata panel button (only shown when sidepanel is enabled) |
| `toolbar_zoom_out_label` | String | `"−"` | Zoom out button label |
| `toolbar_zoom_in_label` | String | `"+"` | Zoom in button label |
| `toolbar_zoom_reset_label` | String | `"Reset"` | Reset zoom button label |
| `toolbar_square_label` | String | `"Square"` | Square button label |
| `toolbar_undo_label` | String | `"Undo"` | Undo button label |
| `toolbar_redo_label` | String | `"Redo"` | Redo button label |
| `toolbar_save_label` | String | `"Save"` | Save button label |
| `toolbar_saving_label` | String | `"Saving..."` | Saving button label |
| `toolbar_metadata_label` | String | `"Metadata"` | Metadata panel button label |

**Example configuration:**

```ini
[toolbar]
# Customize colors
toolbar_background_color = rgb(240, 248, 255)
toolbar_border_color = rgb(59, 130, 246)
toolbar_font_color = rgb(30, 58, 138)
toolbar_button_background_color = rgb(219, 234, 254)
toolbar_button_text_color = rgb(30, 64, 175)
toolbar_button_active_background_color = rgb(37, 99, 235)
toolbar_button_save_background_color = rgb(34, 197, 94)

# Hide some controls
toolbar_show_redo_button = false
toolbar_show_square_button = false
toolbar_show_metadata_button = false

# Customize labels
toolbar_save_label = Save PDF
toolbar_undo_label = ← Undo
```

## Toolbar Controls

The PDF viewer includes a toolbar at the top with the following controls:

### Zoom Controls

- **Zoom In (+ button)**: Increases zoom level by 0.25x increments (max 3.0x)
- **Zoom Out (- button)**: Decreases zoom level by 0.25x increments (min 0.5x)
- **Reset Zoom button**: Resets zoom to 1.0x (100%)
- **Zoom level display**: Shows current zoom percentage (e.g., "125%")

**Usage:**
- Click the `+` or `-` buttons to adjust zoom
- Click "Reset" to return to default zoom
- Zoom affects the PDF page size but maintains aspect ratio

### Annotation Tools

- **Square button**: Activates square/rectangle annotation tool
  - Click and drag on the PDF to create a rectangle
  - Right-click the rectangle to add a comment
  - Button highlights when active

### History Controls

- **Undo button**: Reverses the last annotation action
  - Keyboard shortcut: `Ctrl+Z` (Windows/Linux) or `Cmd+Z` (Mac)
  - Disabled when there are no actions to undo
  - Shows history icon

- **Redo button**: Reapplies the last undone action
  - Keyboard shortcut: `Ctrl+Y` (Windows/Linux) or `Cmd+Y` (Mac)
  - Disabled when there are no actions to redo
  - Shows redo icon

### Save Control

- **Save button**: Saves all annotations directly into the PDF file
  - Disabled when there are no annotations
  - Shows save icon and "Saving..." text during save operation
  - Triggers `on_save` callback with PDF bytes and filename

### Metadata Panel Toggle

- **Metadata button**: Toggles the metadata sidepanel (only visible when `sidepanel_metadata_enabled={true}`)
  - Shows panel icon
  - Button highlights when panel is open
  - Opens/closes the right-side metadata panel

---

## Sidepanel Metadata

The PDF viewer can display a retractable sidepanel on the right side showing JSON metadata with header, data (accordions), and footer sections.

### Enabling the Sidepanel

To enable the metadata sidepanel, set `sidepanel_metadata_enabled={true}` and provide `metadata_input`:

```tsx
import { PdfViewer } from 'hazo_pdf';
import type { MetadataInput } from 'hazo_pdf';

const metadata: MetadataInput = {
  header: [
    { style: 'h1', label: 'Document Information' },
    { style: 'body', label: 'Last updated: 2025-01-15' }
  ],
  data: [
    {
      label: 'Document Title',
      style: 'h3',
      value: 'Annual Report 2024',
      editable: true
    },
    {
      label: 'Author',
      style: 'h4',
      value: 'John Doe',
      editable: true
    },
    {
      label: 'Status',
      style: 'body',
      value: 'Draft',
      editable: false
    }
  ],
  footer: [
    { style: 'body', label: 'Version 1.0' }
  ]
};

<PdfViewer
  url="/document.pdf"
  sidepanel_metadata_enabled={true}
  metadata_input={metadata}
  on_metadata_change={(updatedRow, allData) => {
    console.log('Updated row:', updatedRow);
    console.log('All data:', allData);
    // Save to server, update state, etc.
    return { updatedRow, allData };
  }}
/>
```

### Metadata Structure

The `MetadataInput` interface has three sections:

#### Header Section
- Array of `MetadataHeaderItem` objects
- Each item has `style` (format type) and `label` (text)
- Rendered at the top of the panel

#### Data Section
- Array of `MetadataDataItem` objects
- Each item is rendered as a collapsible accordion (starts collapsed)
- Properties:
  - `label`: Title shown as accordion header (required)
  - `style`: Format type for the label (h1-h5, body) (required)
  - `value`: Value to display (required)
  - `editable`: Whether field can be edited (boolean, required)

#### Footer Section
- Array of `MetadataFooterItem` objects (same structure as header)
- Rendered at the bottom of the panel

### Format Types

The `style` property accepts the following format types:
- `h1`: Large heading (3xl, bold)
- `h2`: Heading (2xl, bold)
- `h3`: Subheading (xl, semibold)
- `h4`: Smaller subheading (lg, semibold)
- `h5`: Small heading (base, semibold)
- `body`: Regular text (base)

### Editable Fields

When `editable: true`:
- A pencil icon appears next to the value
- Clicking the pencil enters edit mode
- Edit mode shows:
  - Text input field (single-line)
  - Green circle-check button (save)
  - Red circle-x button (cancel)
- Pressing `Enter` saves, `Escape` cancels
- On save, `on_metadata_change` callback is called with:
  - `updatedRow`: The updated `MetadataDataItem`
  - `allData`: The complete `MetadataInput` with all updates
- Callback must return `{ updatedRow, allData }`

### Panel Controls

- **Toggle from toolbar**: Click the "Metadata" button in the toolbar
- **Toggle from right edge**: Click the chevron button on the right edge (when closed)
- **Resize**: Drag the left edge of the panel to resize (200px - 800px on desktop)
- **Close**: Click the chevron button in the panel header or toggle button in toolbar

### Responsive Behavior

- **Desktop (> 1024px)**: Panel appears side-by-side with PDF viewer, max width 800px
- **Tablet (768px - 1024px)**: Panel max width is 50% of screen, can overlay
- **Mobile (< 768px)**: Panel uses overlay mode, max width 90vw, full height

### Example: Complex Metadata (Test App Example)

The test app includes comprehensive test data demonstrating all metadata variations. This example shows all format types (h1-h5, body), editable and non-editable fields:

```tsx
import type { MetadataInput, MetadataDataItem } from 'hazo_pdf';

const test_metadata: MetadataInput = {
  header: [
    { style: 'h1', label: 'Document Information' },
    { style: 'h3', label: 'Test Document Metadata' },
    { style: 'body', label: 'Last updated: 2025-01-15' }
  ],
  data: [
    {
      label: 'Document Title',
      style: 'h2',
      value: 'Annual Report 2024',
      editable: true
    },
    {
      label: 'Author Information',
      style: 'h3',
      value: 'John Doe\nSenior Analyst\nDepartment of Finance',
      editable: true
    },
    {
      label: 'Document Status',
      style: 'h4',
      value: 'Approved',
      editable: false
    },
    {
      label: 'Version',
      style: 'h5',
      value: '1.0.0',
      editable: true
    },
    {
      label: 'Category',
      style: 'body',
      value: 'Financial Report',
      editable: false
    },
    {
      label: 'Keywords',
      style: 'body',
      value: 'financial, annual, report, 2024',
      editable: true
    },
    {
      label: 'Document ID',
      style: 'h5',
      value: 'DOC-2024-001',
      editable: false
    },
    {
      label: 'Notes',
      style: 'body',
      value: 'This document contains comprehensive financial data for the fiscal year 2024. Please review all sections carefully before finalizing.',
      editable: true
    },
    {
      label: 'Confidentiality Level',
      style: 'h4',
      value: 'Internal Use Only',
      editable: false
    },
    {
      label: 'Approval Date',
      style: 'body',
      value: '2025-01-10',
      editable: false
    }
  ],
  footer: [
    { style: 'body', label: 'This is a test metadata example' },
    { style: 'h5', label: 'Version 1.0 - Test App' }
  ]
};

<PdfViewer
  url="/document.pdf"
  sidepanel_metadata_enabled={true}
  metadata_input={test_metadata}
  on_metadata_change={(updatedRow, allData) => {
    console.log('Updated:', updatedRow);
    console.log('All data:', allData);
    // Update state, save to backend, etc.
    return { updatedRow, allData };
  }}
/>
```

**This example demonstrates:**
- **Header section**: Multiple format types (h1, h3, body)
- **Data section**: All format types (h2, h3, h4, h5, body) with both editable and non-editable fields
- **Footer section**: Multiple format types (body, h5)
- **Multi-line values**: Author Information includes newlines
- **Long text values**: Notes field contains a longer description
- **Mixed editability**: Some fields editable, others read-only

**Note:** This test data is used in the test app (`app/viewer/[filename]/page.tsx`) to demonstrate all sidepanel metadata features.

---

## Usage Tips

### Styling

- The viewer uses TailwindCSS classes. Ensure TailwindCSS is configured in your project or import the bundled styles.
- Use the `className` prop to add custom wrapper styles.
- Use the configuration file for comprehensive styling customization.

### Annotation Coordinate System

- Annotations use PDF coordinate space (points), not screen pixels.
- PDF coordinates start at the bottom-left (Y increases upward).
- The component handles coordinate conversion automatically.

### Pan Tool

- Pan is the default tool (`current_tool = null`).
- Users can drag to scroll/pan the document.
- The cursor changes to a hand icon when panning.

### Square Annotations

1. Click the "Square" button in the toolbar.
2. Click and drag on the PDF to create a rectangle.
3. Right-click the rectangle to add a comment.

### FreeText Annotations

1. Right-click anywhere on the PDF.
2. Select "Annotate" from the context menu.
3. Enter text in the dialog.
4. Click the checkmark to save.
5. Left-click an existing FreeText annotation to edit or delete it.

### Custom Stamps

1. Configure stamps via `right_click_custom_stamps` prop or config file.
2. Right-click on the PDF.
3. Select a stamp from the bottom of the menu.
4. The stamp text is added at the click position with optional timestamp/fixed text.

### Saving Annotations

- Click the "Save" button in the toolbar.
- The `on_save` callback receives PDF bytes with annotations embedded using `pdf-lib`.
- You can download directly or upload to a server.

**Example download:**

```tsx
const handleSave = (pdfBytes: Uint8Array, filename: string) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'document.pdf';
  a.click();
  URL.revokeObjectURL(url);
};
```

### Timestamp Formatting

When `append_timestamp_to_text_edits` is enabled, timestamps are formatted as:
- Format: `YYYY-MM-DD h:mmam/pm`
- Example: `2025-11-17 2:24pm`

The position and bracket style can be configured via the config file:
- `suffix_text_position`: `"adjacent"`, `"below_single_line"`, or `"below_multi_line"` (default)
- `suffix_enclosing_brackets`: Two-character string like `"[]"`, `"()"`, `"{}"` (default: `"[]"`)
- `add_enclosing_brackets_to_suffixes`: `true` or `false` (default: `true`)

### Responsive Design

The PDF viewer is fully responsive and adapts to different screen sizes:

**Desktop (> 1024px):**
- Full feature set available
- Sidepanel appears side-by-side with PDF (when enabled)
- All toolbar buttons visible
- Optimal viewing experience

**Tablet (768px - 1024px):**
- Sidepanel max width is 50% of screen (when enabled)
- Toolbar buttons may wrap to multiple rows
- Touch-friendly button sizes
- Horizontal scrolling available for zoomed PDFs

**Mobile (< 768px):**
- Sidepanel uses overlay mode (when enabled), max 90vw width
- Toolbar buttons wrap and use touch-friendly sizes (min 44px height)
- PDF viewer maintains full functionality
- Pan tool works with touch gestures
- All annotation tools remain accessible

**Breakpoints:**
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

The viewer uses CSS media queries to adjust layout and component sizes automatically. All interactive elements are touch-friendly on mobile devices.

---

### Annotation Coordinate System

- Annotations use PDF coordinate space (points), not screen pixels.
- PDF coordinates start at the bottom-left (Y increases upward).
- The component handles coordinate conversion automatically.

### Pan Tool

- Pan is the default tool (`current_tool = null`).
- Users can drag to scroll/pan the document.
- The cursor changes to a hand icon when panning.

### Square Annotations

1. Click the "Square" button in the toolbar.
2. Click and drag on the PDF to create a rectangle.
3. Right-click the rectangle to add a comment.

### FreeText Annotations

1. Right-click anywhere on the PDF.
2. Select "Annotate" from the context menu.
3. Enter text in the dialog.
4. Click the checkmark to save.
5. Left-click an existing FreeText annotation to edit or delete it.

### Custom Stamps

1. Configure stamps via `right_click_custom_stamps` prop or config file.
2. Right-click on the PDF.
3. Select a stamp from the bottom of the menu.
4. The stamp text is added at the click position with optional timestamp/fixed text.

### Saving Annotations

- Click the "Save" button in the toolbar.
- The `on_save` callback receives PDF bytes with annotations embedded using `pdf-lib`.
- You can download directly or upload to a server.

**Example download:**

```tsx
const handleSave = (pdfBytes: Uint8Array, filename: string) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'document.pdf';
  a.click();
  URL.revokeObjectURL(url);
};
```

### Timestamp Formatting

When `append_timestamp_to_text_edits` is enabled, timestamps are formatted as:
- Format: `YYYY-MM-DD h:mmam/pm`
- Example: `2025-11-17 2:24pm`

The position and bracket style can be configured via the config file:
- `suffix_text_position`: `"adjacent"`, `"below_single_line"`, or `"below_multi_line"` (default)
- `suffix_enclosing_brackets`: Two-character string like `"[]"`, `"()"`, `"{}"` (default: `"[]"`)
- `add_enclosing_brackets_to_suffixes`: `true` or `false` (default: `true`)

---

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

This builds the library to `dist/` using `tsup`.

### Watch Mode

```bash
npm run dev
```

This runs `tsup` in watch mode, rebuilding on file changes.

### Test App

```bash
npm run test-app:dev
```

Starts the Next.js test application (if `test_app_enabled = true` in config).

---

## License

MIT © Pubs Abayasiri
