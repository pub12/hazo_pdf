/**
 * Storybook stories for PdfViewer component
 * Provides examples and test cases for the PDF viewer
 * 
 * How to specify a PDF file for testing:
 * 1. Place your PDF file in the test/pdfs directory
 * 2. In Storybook, use the Controls panel to change the "url" field
 * 3. Enter the filename as: '/filename.pdf' (e.g., '/sample.pdf')
 * 4. The file will be served from the test/pdfs directory at the root path
 * 
 * OR use the "WithFileInput" story which has a built-in input field for easy testing
 */

import type { Meta, StoryObj } from '@storybook/react';
import { PdfViewer } from '../components/pdf_viewer/pdf_viewer';
import { export_annotations_to_xfdf } from '../utils/xfdf_generator';
import type { PdfAnnotation } from '../types';
import { useState } from 'react';

const meta: Meta<typeof PdfViewer> = {
  title: 'Components/PdfViewer',
  component: PdfViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A PDF viewer component with annotation support. Uses pdfjs-dist for rendering and provides annotation tools for creating highlights and square annotations. Place PDF files in the test/pdfs directory and reference them as "/filename.pdf" in the url control.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    url: {
      control: 'text',
      description: 'URL or path to the PDF file. Files in test/pdfs directory should be referenced as "/filename.pdf" (e.g., "/sample.pdf")',
    },
    scale: {
      control: { type: 'number', min: 0.5, max: 3.0, step: 0.25 },
      description: 'Initial zoom level',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class name',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PdfViewer>;

/**
 * Story with file input for easy testing
 * Use the input field at the top to specify any PDF filename
 * Place PDF files in test/pdfs directory and enter just the filename (e.g., "sample.pdf")
 */
export const WithFileInput: Story = {
  render: (args) => {
    const [pdfFileName, setPdfFileName] = useState('sample.pdf');
    const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);

    const handleAnnotationCreate = (annotation: PdfAnnotation) => {
      setAnnotations([...annotations, annotation]);
    };

    const handleExport = () => {
      export_annotations_to_xfdf(annotations, [], pdfFileName, 'annotations.xfdf');
    };

    // Construct the full URL path
    const pdfUrl = pdfFileName.startsWith('/') ? pdfFileName : `/${pdfFileName}`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* File input control panel */}
        <div
          style={{
            padding: '15px',
            borderBottom: '2px solid #e0e0e0',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label
              htmlFor="pdf-file-input"
              style={{
                fontWeight: '600',
                fontSize: '14px',
                color: '#333',
              }}
            >
              PDF Filename:
            </label>
            <input
              id="pdf-file-input"
              type="text"
              value={pdfFileName}
              onChange={(e) => setPdfFileName(e.target.value)}
              placeholder="sample.pdf"
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '200px',
                fontFamily: 'monospace',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                color: '#666',
                fontStyle: 'italic',
              }}
            >
              (File must be in test/pdfs directory)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            <button
              onClick={handleExport}
              disabled={annotations.length === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: annotations.length > 0 ? '#007bff' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: annotations.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Export Annotations ({annotations.length})
            </button>
            <span
              style={{
                fontSize: '12px',
                color: '#666',
                padding: '4px 8px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            >
              URL: {pdfUrl}
            </span>
          </div>
        </div>

        {/* PDF Viewer */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PdfViewer
            {...args}
            url={pdfUrl}
            annotations={annotations}
            on_annotation_create={handleAnnotationCreate}
            config_file="config/hazo_pdf_config.ini"
          />
        </div>
      </div>
    );
  },
  args: {
    scale: 1.0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive PDF viewer with file input. Enter any PDF filename in the input field to test different PDF files. Files must be placed in the test/pdfs directory. You can also create annotations and export them to XFDF format.',
      },
    },
  },
};

/**
 * Default story with a sample PDF
 * 
 * To test with a different PDF:
 * 1. Place your PDF file in test/pdfs directory
 * 2. Use the Controls panel in Storybook
 * 3. Change the "url" field to "/your-filename.pdf"
 * 
 * Example: "/sample.pdf" or "/test-document.pdf"
 * 
 * OR use the "WithFileInput" story for easier testing
 */
export const Default: Story = {
  args: {
    url: '/sample.pdf',
    scale: 1.0,
    config_file: 'config/hazo_pdf_config.ini',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default PDF viewer. Use the Controls panel to change the PDF file by updating the "url" field. Place PDF files in the test/pdfs directory and reference them as "/filename.pdf" (e.g., "/sample.pdf"). For easier testing, use the "WithFileInput" story.',
      },
    },
  },
};

/**
 * Story with custom zoom level
 */
export const ZoomedIn: Story = {
  args: {
    url: '/sample.pdf',
    scale: 1.5,
  },
  parameters: {
    docs: {
      description: {
        story: 'PDF viewer with zoom level set to 1.5x. Change the PDF file using the Controls panel.',
      },
    },
  },
};

/**
 * Story with annotations
 * Create annotations by selecting a tool (Square or Highlight) and drawing on the PDF
 */
export const WithAnnotations: Story = {
  render: (args) => {
    const [annotations, setAnnotations] = useState<PdfAnnotation[]>([
      {
        id: '1',
        type: 'Square',
        page_index: 0,
        rect: [100, 100, 200, 150],
        author: 'Test User',
        date: new Date().toISOString(),
        contents: 'This is a test annotation',
        color: '#FF0000',
      },
      {
        id: '2',
        type: 'Highlight',
        page_index: 0,
        rect: [100, 200, 300, 220],
        author: 'Test User',
        date: new Date().toISOString(),
        contents: 'This is a highlight annotation',
        color: '#FFFF00',
      },
    ]);

    const handleAnnotationCreate = (annotation: PdfAnnotation) => {
      setAnnotations([...annotations, annotation]);
    };

    const handleExport = () => {
      const pdfFileName = args.url?.split('/').pop() || 'sample.pdf';
      export_annotations_to_xfdf(annotations, [], pdfFileName, 'annotations.xfdf');
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            Export Annotations to XFDF
          </button>
          <span style={{ marginLeft: '10px', fontSize: '14px' }}>
            Annotations: {annotations.length} | PDF: {args.url}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <PdfViewer
            {...args}
            annotations={annotations}
            on_annotation_create={handleAnnotationCreate}
            config_file="config/hazo_pdf_config.ini"
          />
        </div>
      </div>
    );
  },
  args: {
    url: '/sample.pdf',
    scale: 1.0,
  },
  parameters: {
    docs: {
      description: {
        story: 'PDF viewer with annotations. Select a tool (Square or Highlight) from the toolbar, then draw on the PDF to create annotations. Export annotations to XFDF format using the export button. Change the PDF file using the Controls panel.',
      },
    },
  },
};

/**
 * Story with error handling
 */
export const ErrorState: Story = {
  args: {
    url: '/nonexistent.pdf',
    scale: 1.0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows error handling when PDF file cannot be loaded.',
      },
    },
  },
};

/**
 * Story with loading state
 */
export const LoadingState: Story = {
  args: {
    url: '/sample.pdf',
    scale: 1.0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading state while the PDF is being loaded.',
      },
    },
  },
};
