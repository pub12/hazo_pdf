# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hazo PDF is an NPM package providing a React component library for viewing and annotating PDF documents. It supports Square annotations, FreeText annotations, custom stamps, timestamps, and comprehensive styling via INI configuration files.

## Commands

```bash
# Development - runs tsup watch + Next.js test app concurrently
npm run test-app:dev

# Build library to dist/
npm run build

# Watch mode (tsup only)
npm run dev

# Lint
npm run lint
```

## Architecture

### Build System
- **tsup** bundles TypeScript to ESM format with type definitions
- Package exports always resolve to `dist/` (even during dev) to prevent Node-only modules from leaking into browser builds
- `tsup --watch` keeps `dist/` updated during development
- CSS processed through PostCSS with Tailwind

### Core Components (src/components/pdf_viewer/)
- **pdf_viewer.tsx**: Main component, handles state, config loading, toolbar, annotation management
- **pdf_viewer_layout.tsx**: Layout container coordinating pages and annotation overlays
- **pdf_page_renderer.tsx**: Renders single PDF page to canvas with high DPI support
- **annotation_overlay.tsx**: SVG layer for annotation interactions and rendering
- **metadata_sidepanel.tsx**: Retractable sidepanel for JSON metadata display
- **context_menu.tsx**: Right-click menu for annotations and stamps
- **text_annotation_dialog.tsx**: Dialog for FreeText annotation editing

### Configuration System
- **config/default_config.ts**: Default configuration values
- **types/config.ts**: TypeScript interfaces for configuration
- **utils/config_loader.ts**: Loads INI config files via hazo_config package
- Props can override config file values; config file path passed via `config_file` prop

### Logging System
- **utils/logger.ts**: Logger interface and utilities for hazo_logs integration
- **Logger interface**: Compatible with hazo_logs package (info, debug, warn, error methods)
- **Fallback logging**: Uses console with `[hazo_pdf]` prefix when no logger provided
- **Global logger**: Can be set via `set_logger()` utility or `logger` prop on PdfViewer
- **Comprehensive logging**: PDF conversion operations in `pdf_converter.ts` emit structured logs

### Coordinate System
- PDF coordinates (origin bottom-left) vs screen coordinates (origin top-left)
- **utils/coordinate_mapper.ts**: Converts between coordinate systems using pdfjs viewport
- Annotations stored in PDF coordinates, rendered in screen coordinates

### Key Utilities
- **utils/pdf_saver.ts**: Embeds annotations into PDF using pdf-lib
- **utils/xfdf_generator.ts**: Exports annotations to XFDF format
- **utils/annotation_utils.ts**: Rectangle calculations and validations

## Conventions

- **Naming**: snake_case throughout (files, functions, variables, props)
- **CSS Classes**: Prefix with `cls_` for identification/searchability
- **Tech Stack**: React, TypeScript, TailwindCSS, pdfjs-dist, pdf-lib
- **Module System**: ESM only
- **Peer Dependencies**: React 18+ required (not bundled)

## CSS Architecture

### Style Files
- **src/styles/index.css**: Component styles (`.cls_*` classes) - used by consuming apps
- **src/styles/full.css**: Includes Tailwind base + imports index.css - used by test app only

### Tailwind Integration Gotchas
- `full.css` must import `index.css` BEFORE `@tailwind` directives (PostCSS requirement)
- Tailwind's preflight resets borders to 0 - use `!important` on border properties in component styles
- When styles don't apply, check: (1) CSS file is imported, (2) specificity vs Tailwind reset
- Test app imports `full.css` in `app/layout.tsx`; consuming apps import `hazo_pdf/styles.css`

## Testing

- Place test PDFs in `test/pdfs/`
- Test app at `app/` directory (Next.js) accessed via `npm run test-app:dev`
- Use Chrome browser automation tools to verify rendered styles match expectations

## File Info Sidepanel

The File Info Sidepanel displays extracted data, document metadata, and highlighted fields. It supports three data input types:

### 1. Document Data (`doc_data` prop)
General structured data from document extraction. Displayed in "Document Data" section.

### 2. Highlighted Fields (`highlight_fields_info` prop)
Specific extracted fields with visual highlighting. Uses `HighlightFieldInfo[]` type.

```typescript
// Type definition
export interface HighlightFieldInfo {
  field_name: string;  // Field identifier (auto-formatted to Title Case)
  value: string;       // Extracted value (displayed with highlight styling)
}

// Usage example
const highlights: HighlightFieldInfo[] = [
  { field_name: 'document_date', value: '30 June 2024' },
  { field_name: 'total_amount', value: '$29,696.60' },
];

<PdfViewer
  url="/document.pdf"
  highlight_fields_info={highlights}
  show_file_info_button={true}
/>
```

### 3. File Metadata (`file_metadata` prop)
Legacy filename-matched metadata. Supports string fields and table arrays.

### Key Components
- **file_info_sidepanel.tsx**: Main sidepanel component
- **HighlightFieldInfo**: Exported type for highlight fields (must be exported from index.ts)
- **doc_data**: Flexible Record<string, unknown> for general data
- **highlight_fields_info**: Array<HighlightFieldInfo> for highlighted extractions

### Display Sections (in order)
1. Extracted Data (from file_metadata)
2. Document Data (from doc_data)
3. Highlighted Fields (from highlight_fields_info) - with count and special styling
4. File System Info (filename, path)

### Integration with Extraction
When extraction completes, populate both `doc_data` and `highlight_fields_info` to show results in sidepanel.

## Key Files

- `src/index.ts` - Main entry point, exports public API (includes HighlightFieldInfo)
- `src/types/index.ts` - TypeScript type definitions (PdfAnnotation, PdfViewerProps, etc.)
- `src/components/pdf_viewer/file_info_sidepanel.tsx` - File info sidepanel component
- `src/utils/logger.ts` - Logger interface and utilities (set_logger, get_logger)
- `tsup.config.ts` - Build configuration
- `config/hazo_pdf_config.ini` - Example configuration file with all available options
- `config/hazo_logs_config.ini` - Logger configuration for test app
