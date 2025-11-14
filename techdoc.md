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
├── test/
│   └── pdfs/                               # Sample PDF files for testing
├── dist/                                   # Build output (generated)
├── tsconfig.json                           # TypeScript configuration
├── tsup.config.ts                          # Build configuration
├── tailwind.config.cjs                     # Tailwind CSS configuration
├── postcss.config.cjs                      # PostCSS configuration
├── package.json                            # NPM package configuration
└── README.md                               # User documentation
```

### Build System
- **tsup**: Handles TypeScript compilation and bundling
- **Output Format**: ESM (ES Modules)
- **Type Definitions**: Automatically generated (.d.ts files)
- **CSS**: Processed through PostCSS with Tailwind
- **Web Workers**: PDF processing happens off main thread

### Export Strategy
- Main component: `PdfViewer`
- Sub-components: `PdfViewerLayout`, `PdfPageRenderer`, `AnnotationOverlay`
- Utilities: `load_pdf_document`, `generate_xfdf`, `export_annotations_to_xfdf`
- Styles: `styles.css` (separate export)
- Types: Exported for TypeScript consumers

## Components

### PdfViewer
**File**: `src/components/pdf_viewer/pdf_viewer.tsx`

**Purpose**: Main component for displaying and interacting with PDF documents

**Props**:
- `url` (string, required): URL or path to PDF file
- `className` (string, optional): Additional CSS classes
- `scale` (number, optional): Initial zoom level (default: 1.0)
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
npm run dev  # Watch mode for development
npm run storybook  # Start Storybook
```

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

