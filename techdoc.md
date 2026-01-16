# Hazo PDF - Technical Documentation

## Overall Architecture

### Project Type
NPM package for React component library providing PDF viewing and annotation capabilities

### Technology Stack
- **React**: UI component framework
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **pdfjs-dist**: PDF rendering library (Mozilla)
- **tsup**: Fast TypeScript bundler
- **Storybook**: Component development and testing
- **Lucide React**: Icon library

### File Structure
```
hazo_pdf/
├── src/
│   ├── components/
│   │   └── pdf_viewer/
│   │       ├── pdf_viewer.tsx              # Main PDF viewer component
│   │       ├── pdf_viewer_layout.tsx       # Layout container component
│   │       ├── pdf_page_renderer.tsx       # Page renderer with canvas
│   │       ├── annotation_overlay.tsx      # Annotation interaction layer
│   │       └── pdf_worker_setup.ts         # Web Worker configuration
│   ├── utils/
│   │   ├── annotation_utils.ts             # Annotation calculations
│   │   ├── coordinate_mapper.ts            # PDF ↔ Screen coordinate conversion
│   │   ├── xfdf_generator.ts               # FDF/XFDF export functionality
│   │   ├── pdf_converter.ts                # PDF conversion utilities (with logging)
│   │   ├── logger.ts                       # Logger interface and utilities
│   │   ├── cn.ts                           # Class name utility
│   │   └── index.ts                        # Utility exports
│   ├── types/
│   │   └── index.ts                        # TypeScript type definitions
│   ├── styles/
│   │   └── index.css                       # Tailwind CSS styles
│   ├── stories/
│   │   └── PdfViewer.stories.tsx           # Storybook stories
│   └── index.ts                            # Main entry point
├── .storybook/
│   ├── main.ts                             # Storybook configuration
│   └── preview.ts                          # Storybook preview config
├── config/
│   ├── hazo_pdf_config.ini                 # PDF viewer configuration
│   └── hazo_logs_config.ini                # Logger configuration (test app)
├── test/
│   └── pdfs/                               # Sample PDF files for testing
├── dist/                                   # Build output (generated)
├── tsconfig.json                           # TypeScript configuration
├── tsup.config.ts                          # Build configuration
├── tailwind.config.cjs                     # Tailwind CSS configuration
├── postcss.config.cjs                      # PostCSS configuration
├── package.json                            # NPM package configuration
├── README.md                               # User documentation
└── CHANGE_LOG.md                           # Version history and changes
```

### Build System
- **tsup**: Handles TypeScript compilation and bundling
- **Output Format**: ESM (ES Modules)
- **Type Definitions**: Automatically generated (.d.ts files)
- **CSS**: Processed through PostCSS with Tailwind
- **Web Workers**: PDF processing happens off main thread

### Export Strategy
- Package exports always resolve to the compiled artifacts in `dist/` (even during development). This prevents bundlers from pulling Node-only modules (e.g., `fs` via `hazo_config`) into the browser.
- During development, `tsup --watch` keeps `dist/` up-to-date so consumers—like the embedded Next.js app—still see the latest source changes without manually rebuilding.
- Main component: `PdfViewer`
- Sub-components: `PdfViewerLayout`, `PdfPageRenderer`, `AnnotationOverlay`
- Utilities: `load_pdf_document`, `generate_xfdf`, `export_annotations_to_xfdf`
- Styles: `styles.css` (separate export)
- Types: Exported for TypeScript consumers via `dist/index.d.ts`

## Components

### PdfViewer
**File**: `src/components/pdf_viewer/pdf_viewer.tsx`

**Purpose**: Main component for displaying and interacting with PDF documents

**Props**:
- `url` (string, required): URL or path to PDF file
- `className` (string, optional): Additional CSS classes
- `scale` (number, optional): Initial zoom level (default: 1.0)
- `logger` (Logger, optional): Logger instance from hazo_logs or custom logger
- `on_load` (function, optional): Callback when PDF loads
- `on_error` (function, optional): Error handler
- `annotations` (array, optional): Existing annotations to display
- `on_annotation_create` (function, optional): Callback when annotation is created
- `on_annotation_update` (function, optional): Callback when annotation is updated
- `on_annotation_delete` (function, optional): Callback when annotation is deleted

**Features**:
- PDF document loading with Web Workers
- Zoom controls (zoom in, zoom out, reset)
- Annotation tools (Square, Highlight)
- Toolbar with controls
- Error handling and loading states

### PdfViewerLayout
**File**: `src/components/pdf_viewer/pdf_viewer_layout.tsx`

**Purpose**: Layout container component managing page rendering and annotation overlay

**Props**:
- `pdf_document` (PDFDocumentProxy, required): PDF document proxy
- `scale` (number, required): Zoom level
- `annotations` (array, optional): Annotations to display
- `current_tool` (string, optional): Current annotation tool
- `on_annotation_create` (function, optional): Callback when annotation is created

**Features**:
- Page loading and rendering coordination
- Coordinate mapper management
- Annotation overlay integration

### PdfPageRenderer
**File**: `src/components/pdf_viewer/pdf_page_renderer.tsx`

**Purpose**: Renders a single PDF page to a canvas element

**Props**:
- `page` (PDFPageProxy, required): PDF page proxy
- `page_index` (number, required): Zero-based page index
- `scale` (number, required): Zoom/scale factor
- `on_coordinate_mapper_ready` (function, optional): Callback with coordinate mapper

**Features**:
- Canvas-based PDF rendering
- High DPI display support
- Coordinate mapping utilities
- Loading state management

### AnnotationOverlay
**File**: `src/components/pdf_viewer/annotation_overlay.tsx`

**Purpose**: DOM/SVG layer for handling annotation interactions

**Props**:
- `width` (number, required): Page width in screen space
- `height` (number, required): Page height in screen space
- `page_index` (number, required): Zero-based page index
- `map_coords` (CoordinateMapper, required): Coordinate mapper
- `annotations` (array, optional): Existing annotations
- `current_tool` (string, optional): Current annotation tool
- `on_annotation_create` (function, optional): Callback when annotation is created

**Features**:
- SVG overlay for annotations
- Mouse event handling (draw, drag, resize)
- Temporary drawing box visualization
- Coordinate conversion (Screen ↔ PDF)
- Annotation rendering
- Left-click edit hooks that dispatch `on_annotation_click` directly from SVG hit tests and overlay rects
- Native event markers (`__annotation_clicked`, `__annotation_click_source`) to keep pan mode from hijacking annotation clicks and to aid console debugging

### PdfWorkerSetup
**File**: `src/components/pdf_viewer/pdf_worker_setup.ts`

**Purpose**: Configures pdfjs-dist to use Web Workers

**Features**:
- Global worker configuration
- PDF document loading
- Error handling

## Types

### PdfViewerProps
Interface defining props for PdfViewer component

### PdfAnnotation
Interface for annotation data structure matching PDF standard:
- `id` (string): Unique identifier
- `type` (string): Annotation type (Highlight, Square, FreeText, CustomBookmark)
- `page_index` (number): Zero-based page index
- `rect` (array): Rectangle coordinates in PDF space [x1, y1, x2, y2]
- `author` (string): Author of the annotation
- `date` (string): Creation date in ISO format
- `contents` (string): Text content or comment
- `color` (string, optional): Color in hex format
- `subject` (string, optional): Subject/title
- `flags` (string, optional): Annotation flags

### PdfBookmark
Interface for bookmark/outline data structure

### CoordinateMapper
Interface for coordinate mapping utilities:
- `to_pdf` (function): Convert screen coordinates to PDF coordinates
- `to_screen` (function): Convert PDF coordinates to screen coordinates

## Logging System

### Logger Interface
**File**: `src/utils/logger.ts`

**Purpose**: Provides a unified logging interface compatible with hazo_logs or custom loggers

**Interface**:
```typescript
interface Logger {
  info: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}
```

**Functions**:
- `set_logger(logger: Logger | undefined)`: Set global logger instance (undefined resets to console)
- `get_logger()`: Get current logger instance

**Fallback Behavior**:
- When no logger is provided, uses console-based logging with `[hazo_pdf]` prefix
- All log methods accept optional data object for structured logging

**Integration with PdfViewer**:
- `logger` prop accepts Logger instance
- Logger is set globally via `set_logger()` in a `useEffect` hook
- PDF conversion operations in `pdf_converter.ts` use the logger for operation tracking

**Usage with hazo_logs**:
```typescript
import { create_logger } from 'hazo_logs';
import { PdfViewer } from 'hazo_pdf';

const logger = create_logger('my_app', 'config/hazo_logs_config.ini');

<PdfViewer url="/doc.pdf" logger={logger} />
```

**Logged Operations**:
- PDF conversion (image, text, Excel to PDF)
- PDF loading and rendering
- Annotation operations
- Error conditions

## Utilities

### cn
**File**: `src/utils/cn.ts`

**Purpose**: Combines class names using clsx and tailwind-merge for optimal Tailwind CSS class merging

### Annotation Utilities
**File**: `src/utils/annotation_utils.ts`

**Functions**:
- `calculate_rectangle_coords`: Calculate normalized rectangle from two points
- `rectangle_to_pdf_rect`: Convert rectangle to PDF rect format
- `pdf_rect_to_rectangle`: Convert PDF rect to rectangle
- `is_rectangle_too_small`: Check if rectangle is too small (click vs drag)

### Coordinate Mapper
**File**: `src/utils/coordinate_mapper.ts`

**Functions**:
- `create_coordinate_mapper`: Create coordinate mapper for a page and scale
- `get_viewport_dimensions`: Get viewport dimensions for a page

### XFDF Generator
**File**: `src/utils/xfdf_generator.ts`

**Functions**:
- `generate_xfdf`: Generate XFDF XML from annotations and bookmarks
- `download_xfdf`: Download XFDF file
- `export_annotations_to_xfdf`: Generate and download XFDF file

## Coordinate System Mapping

### PDF Space (P)
- Abstract PDF units
- Independent of DPI/zoom
- Origin (0,0) is usually bottom-left of the page

### Screen Space (S)
- CSS pixels
- Origin (0,0) is top-left of the viewport
- Dependent on zoom and scroll

### Conversion
- `to_pdf`: Converts screen coordinates to PDF coordinates using `viewport.convertToPdfPoint()`
- `to_screen`: Converts PDF coordinates to screen coordinates using `viewport.convertToViewportPoint()`

This ensures annotations remain correctly positioned regardless of zoom level.

## Web Worker Implementation

### Worker Role
The Web Worker is used for CPU-intensive PDF operations:
- PDF document loading (`getDocument`)
- Page parsing and data extraction
- Page rendering (generating image data)

### Configuration
- Worker source: CDN URL (matches pdfjs-dist version)
- Alternative: Bundle worker file locally
- Global configuration via `GlobalWorkerOptions.workerSrc`

## Annotation System

### Annotation Types
- **Square**: Rectangle annotations
- **Highlight**: Highlight annotations
- **FreeText**: Free text annotations
- **CustomBookmark**: Custom bookmarks

### Annotation Interaction Debugging
- FreeText and rectangle overlay rects set `__annotation_clicked` / `__annotation_click_source` on the native mouse event before stopping propagation.  
- `AnnotationOverlay` emits a single concise log (`🟢 [AnnotationClick] origin=...`) whenever it dispatches a click to React, so engineers can confirm the handoff without noise.  
- `PdfViewerLayout` inspects those markers to skip pan mode and logs the same annotation id when it suppresses dragging; `PdfViewer` logs (`🟠 [AnnotationClick] ...`) when it opens the editor dialog.  
- Removing capture-phase listeners keeps React's synthetic events intact; debugging now focuses on SVG hit tests and overlay rect handlers.

### Suffix Text Formatting
- **Location**: `src/components/pdf_viewer/pdf_viewer.tsx`
- `add_suffix_text()` consolidates suffix handling for both manual annotations and custom stamps.  
  - Inputs: base text, flags for fixed/timestamp suffixes, optional fixed-text override, optional bracket override.  
  - Honors viewer configuration for `suffix_enclosing_brackets`, `suffix_text_position`, and `add_enclosing_brackets_to_suffixes`.  
  - Placement modes:
    - `adjacent` → suffix appended inline (`Text [Fixed] [timestamp]`).  
    - `below_single_line` → suffix appended on a single line below (`Text\n[Fixed] [timestamp]`).  
    - `below_multi_line` → suffix appended on individual lines (`Text\n[Fixed]\n[timestamp]`).  
- `append_timestamp_if_enabled()` and `format_stamp_text()` both delegate to `add_suffix_text`, ensuring consistent formatting across entry points.
- `strip_auto_inserted_suffix()` mirrors the same configuration to detect and remove suffixes before editing, so dialogs show only user-entered content prior to reapplying suffixes.
- **Configuration** (`[viewer]` in `config/hazo_pdf_config.ini` / `PdfViewerConfig`):
  - `annotation_text_suffix_fixed_text`: optional fixed suffix text (applied when non-empty).  
  - `append_timestamp_to_text_edits`: toggles timestamp suffix for manual text entries.  
  - `add_enclosing_brackets_to_suffixes`: wraps suffixes in the configured brackets.  
  - `suffix_enclosing_brackets`: two-character opening/closing pair (default `[]`).  
  - `suffix_text_position`: `adjacent`, `below_single_line`, or `below_multi_line`.

### Annotation Creation Flow
1. User draws on overlay (mouse down, move, up)
2. Screen coordinates converted to PDF coordinates
3. Annotation object created with PDF coordinates
4. Annotation stored in state
5. Annotation rendered on overlay

### Annotation Export
- Annotations exported as XFDF (XML Forms Data Format)
- XFDF format adheres to PDF standard
- Can be merged back into PDF using server-side tools

## Storybook

### Configuration
**File**: `.storybook/main.ts`
- React + Vite setup
- TypeScript support
- TailwindCSS integration

### Stories
**File**: `src/stories/PdfViewer.stories.tsx`
- Default story
- Zoomed in story
- With annotations story
- Error state story
- Loading state story

### Usage
```bash
npm run storybook  # Start Storybook dev server
npm run build-storybook  # Build static Storybook
```

## Testing

### Test Directory
**Directory**: `test/pdfs/`
- Place sample PDF files here
- Used in Storybook stories
- Used for component testing

### Sample Files
- `sample.pdf`: Sample PDF document for testing
- Additional test documents can be added

## Constraints

1. **Peer Dependencies**: React 18+ required (not bundled)
2. **Module System**: ESM only
3. **Browser Support**: Modern browsers (ES2020+)
4. **Naming Convention**: snake_case throughout
5. **CSS Classes**: Prefixed with `cls_` for identification
6. **Bundle Size**: Keep minimal - external dependencies are peer dependencies
7. **Web Workers**: PDF processing happens off main thread
8. **Coordinate System**: PDF coordinates stored, screen coordinates for display

## Development Workflow

### Local Development
```bash
npm install
npm run test-app:dev  # tsup --watch + next dev (test app)
npm run storybook     # Start Storybook
```

`test-app:dev` launches two processes via `concurrently`:
- `npm run dev` → `tsup --watch` (rebuilds `dist/` whenever `src/` changes)
- `next dev` → serves the test application with live reload

### Building
```bash
npm run build  # Produces dist/ folder
npm run build-storybook  # Build Storybook
```

### Publishing
```bash
npm run prepublishOnly  # Runs automatically before publish
npm publish
```

## Installation for Consumers
```bash
npm install hazo_pdf
```

## Usage Example
```tsx
import { PdfViewer } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function App() {
  return (
    <PdfViewer
      url="/document.pdf"
      scale={1.0}
      on_load={(pdf) => console.log('PDF loaded:', pdf)}
      on_annotation_create={(annotation) => console.log('Annotation created:', annotation)}
    />
  );
}
```

## Export Annotations Example
```tsx
import { export_annotations_to_xfdf } from 'hazo_pdf';

// Export annotations to XFDF file
export_annotations_to_xfdf(annotations, [], 'document.pdf', 'annotations.xfdf');
```

## Performance Considerations

1. **Web Workers**: PDF processing happens off main thread
2. **Virtualization**: Pages can be virtualized for large documents
3. **Lazy Loading**: Pages can be loaded on demand
4. **Coordinate Caching**: Coordinate mappers are memoized
5. **Canvas Rendering**: Efficient canvas-based rendering

## Future Enhancements

1. Page virtualization for large documents
2. Additional annotation types (FreeText, drawing)
3. Annotation editing and deletion
4. Annotation persistence (localStorage, server)
5. Search functionality
6. Text selection and extraction
7. Print functionality
8. Full-screen mode
9. Page thumbnails
10. Bookmark navigation

