# Hazo PDF Setup Checklist

This guide walks you through setting up and using the Hazo PDF library in your React application.

## Prerequisites

Before you begin, ensure you have:

- [ ] **Node.js 18+** installed on your system
- [ ] **npm** or **yarn** package manager
- [ ] A **React 18+** application (Next.js, Vite, Create React App, etc.)
- [ ] **TypeScript** support (recommended but optional)

## Installation Steps

### 1. Install the Package

```bash
npm install hazo_pdf
```

Or with yarn:

```bash
yarn add hazo_pdf
```

#### Optional: Install hazo_logs for Logging

For structured logging and debugging, optionally install hazo_logs:

```bash
npm install hazo_logs
```

Or with yarn:

```bash
yarn add hazo_logs
```

Note: hazo_logs is an optional peer dependency. If not installed, hazo_pdf will use console-based logging.

### 2. Import Styles

Choose the appropriate CSS file based on your application setup:

**Option A: For apps with existing styles (Recommended)**

Import `styles.css` - this does NOT include Tailwind preflight/base resets:

```tsx
import 'hazo_pdf/styles.css';
```

**Option B: For standalone apps**

Import `styles-full.css` - includes Tailwind preflight/base styles:

```tsx
import 'hazo_pdf/styles-full.css';
```

### 3. Import the Component

```tsx
import { PdfViewer } from 'hazo_pdf';
```

For TypeScript projects, also import types:

```tsx
import type { PdfViewerProps, PdfAnnotation, PdfViewerRef } from 'hazo_pdf';
```

### 4. Create a Container with Explicit Dimensions

The PDF viewer requires its parent container to have explicit width and height:

```tsx
<div style={{ width: '100%', height: '600px' }}>
  <PdfViewer url="/document.pdf" />
</div>
```

### 5. Verify the Setup

Create a simple test component to verify everything works:

```tsx
import { PdfViewer } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

export default function TestViewer() {
  return (
    <div style={{ width: '100%', height: '800px' }}>
      <PdfViewer
        url="/path/to/test.pdf"
        on_load={(pdf) => console.log('PDF loaded:', pdf.numPages, 'pages')}
        on_error={(error) => console.error('PDF error:', error)}
      />
    </div>
  );
}
```

## Configuration (Optional)

### 6. Create a Configuration File

For advanced styling customization, create a configuration INI file:

```bash
mkdir -p config
touch config/hazo_pdf_config.ini
```

Example configuration:

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
toolbar_button_save_background_color = rgb(34, 197, 94)
```

### 7. Use Configuration File

Pass the config file path to the component:

```tsx
<PdfViewer
  url="/document.pdf"
  config_file="config/hazo_pdf_config.ini"
/>
```

## Using the Ref API (Optional)

If you need programmatic control over highlights, set up a ref:

### 8. Create a Ref

```tsx
import { useRef } from 'react';
import { PdfViewer, PdfViewerRef } from 'hazo_pdf';

function MyComponent() {
  const viewer_ref = useRef<PdfViewerRef>(null);

  return <PdfViewer ref={viewer_ref} url="/document.pdf" />;
}
```

### 9. Use Ref Methods

The ref exposes three methods for highlight management:

```tsx
// Create a highlight
const highlight_id = viewer_ref.current?.highlight_region(
  0,                      // page_index (zero-based)
  [100, 500, 300, 550],   // rect in PDF coordinates [x1, y1, x2, y2]
  {
    border_color: '#FF0000',
    background_color: '#FFFF00',
    background_opacity: 0.4
  }
);

// Remove a specific highlight
const removed = viewer_ref.current?.remove_highlight(highlight_id);

// Clear all API-created highlights
viewer_ref.current?.clear_all_highlights();
```

### 10. Understand PDF Coordinates

Important notes about the coordinate system:

- Coordinates are in PDF space (points), not screen pixels
- Origin is at the **bottom-left** corner (Y increases upward)
- Rectangle format: `[x1, y1, x2, y2]` where (x1, y1) is bottom-left, (x2, y2) is top-right

## Troubleshooting

### PDF Not Displaying

- [ ] Verify the parent container has explicit width and height
- [ ] Check the PDF URL is correct and accessible
- [ ] Check browser console for errors
- [ ] Ensure CSS file is imported
- [ ] Verify the PDF file is not corrupted

### Styles Not Applying

- [ ] Confirm you imported either `styles.css` or `styles-full.css`
- [ ] Check for CSS conflicts with existing styles
- [ ] Try using `styles-full.css` if using `styles.css` doesn't work
- [ ] Verify configuration file path is correct (if using config file)

### TypeScript Errors

- [ ] Ensure you're using TypeScript 4.5+
- [ ] Import types from `hazo_pdf`: `import type { PdfViewerRef } from 'hazo_pdf';`
- [ ] Check that React types are installed: `npm install --save-dev @types/react`

### Ref Not Working

- [ ] Verify you imported `PdfViewerRef` type: `import type { PdfViewerRef } from 'hazo_pdf';`
- [ ] Ensure you're using `useRef<PdfViewerRef>(null)`
- [ ] Check that the ref is attached: `<PdfViewer ref={viewer_ref} ... />`
- [ ] Verify you're accessing ref methods after component mounts: `viewer_ref.current?.highlight_region(...)`

### Highlights Not Appearing

- [ ] Verify coordinates are in PDF space, not screen space
- [ ] Check that page_index is zero-based (first page = 0)
- [ ] Ensure rectangle coordinates are valid (x1 < x2, y1 < y2)
- [ ] Verify the PDF has loaded before calling highlight methods
- [ ] Check colors are in valid hex format (e.g., "#FF0000")

## Post-Installation Configuration

### Enable Logging (Optional)

To enable structured logging with hazo_logs:

#### 1. Create Logger Configuration File

```bash
mkdir -p config
touch config/hazo_logs_config.ini
```

Example configuration:

```ini
[logging]
log_level = DEBUG
log_format = json
output_file = logs/hazo_pdf.log

[console]
enabled = true
log_level = INFO
```

#### 2. Initialize Logger in Your App

```tsx
import { PdfViewer } from 'hazo_pdf';
import { create_logger } from 'hazo_logs';
import 'hazo_pdf/styles.css';

// Create logger instance
const logger = create_logger('my_app', 'config/hazo_logs_config.ini');

function App() {
  return (
    <div style={{ width: '100%', height: '800px' }}>
      <PdfViewer
        url="/document.pdf"
        logger={logger}
        on_load={(pdf) => console.log('PDF loaded:', pdf.numPages, 'pages')}
      />
    </div>
  );
}
```

#### 3. Alternative: Custom Logger

You can also provide a custom logger that matches the Logger interface:

```tsx
import { PdfViewer } from 'hazo_pdf';

const custom_logger = {
  info: (message, data) => console.log('[INFO]', message, data),
  debug: (message, data) => console.debug('[DEBUG]', message, data),
  warn: (message, data) => console.warn('[WARN]', message, data),
  error: (message, data) => console.error('[ERROR]', message, data),
};

<PdfViewer
  url="/document.pdf"
  logger={custom_logger}
/>
```

**What Gets Logged:**
- PDF conversion operations (image, text, Excel to PDF)
- PDF loading and rendering events
- Annotation operations (create, update, delete)
- Error conditions and warnings

**Note:** If no logger is provided, hazo_pdf automatically falls back to console logging with `[hazo_pdf]` prefix.

### Enable Metadata Sidepanel (Optional)

To display metadata in a sidepanel:

```tsx
import type { MetadataInput } from 'hazo_pdf';

const metadata: MetadataInput = {
  header: [
    { style: 'h1', label: 'Document Information' }
  ],
  data: [
    {
      label: 'Title',
      style: 'h3',
      value: 'My Document',
      editable: true
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
    console.log('Metadata updated:', updatedRow);
    return { updatedRow, allData };
  }}
/>
```

### Add Custom Stamps (Optional)

Configure custom stamps for quick annotation:

```tsx
const custom_stamps = JSON.stringify([
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
  right_click_custom_stamps={custom_stamps}
/>
```

## Next Steps

- [ ] Read the [README.md](./README.md) for detailed API documentation
- [ ] Explore the [Programmatic Highlight API](./README.md#programmatic-highlight-api) section for advanced usage
- [ ] Review configuration options in `config/hazo_pdf_config.ini`
- [ ] Check out example implementations in the README
- [ ] Test annotation features (Square, FreeText, Stamps)
- [ ] Implement save functionality with `on_save` callback

## Support

If you encounter issues not covered in this checklist:

1. Check the [README.md](./README.md) for detailed documentation
2. Review the configuration file (`config/hazo_pdf_config.ini`) for all available options
3. Examine the test app code in the `app/` directory for working examples
4. Check browser console for error messages
5. Verify all prerequisites are met
