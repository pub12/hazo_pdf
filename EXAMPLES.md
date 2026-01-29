# hazo_pdf Usage Examples

Quick reference examples for common use cases.

## File Info Sidepanel with Extraction Results

Display extracted document data and highlighted fields in the sidepanel.

### Basic Example

```tsx
import { PdfViewer } from 'hazo_pdf';
import type { HighlightFieldInfo } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function InvoiceViewer() {
  // Document-level data (general information)
  const doc_data = {
    invoice_number: 'INV-2024-001',
    invoice_date: '2024-01-15',
    total_amount: 1250.00,
    customer_name: 'Acme Corp',
    payment_status: 'paid'
  };

  // Highlighted fields (specific extracted values with visual emphasis)
  const highlight_fields_info: HighlightFieldInfo[] = [
    { field_name: 'invoice_number', value: 'INV-2024-001' },
    { field_name: 'total_amount', value: '$1,250.00' },
    { field_name: 'due_date', value: '2024-02-15' },
    { field_name: 'customer_name', value: 'Acme Corp' }
  ];

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <PdfViewer
        url="/invoices/invoice-001.pdf"
        doc_data={doc_data}
        highlight_fields_info={highlight_fields_info}
        show_file_info_button={true}
      />
    </div>
  );
}
```

### Tax Statement Example (from screenshot)

```tsx
import { PdfViewer } from 'hazo_pdf';
import type { HighlightFieldInfo } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function TaxStatementViewer() {
  const doc_data = {
    document_date: '2024-06-30',
    total_amount: 29696.60,
    document_type: ['bank_interest_doc', 'dividend_doc'],
    bank_name: 'Raiz Invest Australia',
    total_interest: 1006.59,
    tax_withheld: 0.00,
    stock_code: 'Aggregate Fund Stocks',
    unfranked_amount: 2280.70,
    franked_amount: 1051.10,
    franking_credit: 450.47
  };

  const highlight_fields_info: HighlightFieldInfo[] = [
    { field_name: 'document_date', value: '30 June 2024' },
    { field_name: 'total_amount', value: '$29,696.60' },
    { field_name: 'bank_name', value: 'Raiz Invest Australia' },
    { field_name: 'total_interest', value: '1006.59' },
    { field_name: 'tax_withheld', value: '0' },
    { field_name: 'stock_code', value: 'Aggregate Fund Stocks' },
    { field_name: 'unfranked_amount', value: '2280.70' },
    { field_name: 'franked_amount', value: '1051.10' },
    { field_name: 'franking_credit', value: '450.47' }
  ];

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PdfViewer
        url="/tax-statements/2024-statement.pdf"
        doc_data={doc_data}
        highlight_fields_info={highlight_fields_info}
        show_file_info_button={true}
      />
    </div>
  );
}
```

## Integration with Data Extraction

Use extraction results to populate the sidepanel dynamically.

```tsx
import { useState } from 'react';
import { PdfViewer } from 'hazo_pdf';
import type { HighlightFieldInfo } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

function ExtractableViewer() {
  const [docData, setDocData] = useState<Record<string, unknown> | undefined>();
  const [highlights, setHighlights] = useState<HighlightFieldInfo[]>([]);

  const handleExtractComplete = (data: Record<string, unknown>) => {
    console.log('Extraction completed:', data);

    // Set document data
    setDocData(data);

    // Create highlighted fields from extracted data
    // Filter for simple types (strings, numbers) to display
    const highlightFields: HighlightFieldInfo[] = Object.entries(data)
      .filter(([key, value]) => {
        // Only include primitive values
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
      })
      .map(([key, value]) => ({
        field_name: key,
        value: String(value)
      }));

    setHighlights(highlightFields);
  };

  const handleExtractError = (error: Error) => {
    console.error('Extraction failed:', error);
    alert(`Extraction failed: ${error.message}`);
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PdfViewer
        url="/documents/document.pdf"
        show_extract_button={true}
        extract_prompt_area="documents"
        extract_prompt_key="extract_fields"
        extract_api_endpoint="/api/extract"
        on_extract_complete={handleExtractComplete}
        on_extract_error={handleExtractError}
        doc_data={docData}
        highlight_fields_info={highlights}
        show_file_info_button={true}
      />
    </div>
  );
}
```

## TypeScript Types

```typescript
import type { HighlightFieldInfo } from 'hazo_pdf';

// HighlightFieldInfo type
interface HighlightFieldInfo {
  field_name: string;  // Field name (auto-formatted to Title Case in display)
  value: string;       // Field value as string
}

// Example usage
const highlights: HighlightFieldInfo[] = [
  { field_name: 'invoice_number', value: 'INV-001' },
  { field_name: 'total_amount', value: '$1,250.00' }
];

// Document data type (flexible)
const docData: Record<string, unknown> = {
  field1: 'value1',
  field2: 123,
  field3: ['array', 'values'],
  field4: { nested: 'object' }
};
```

## Formatting Tips

### Field Names
Field names are automatically formatted from snake_case to Title Case:
- `document_date` → "Document Date"
- `total_amount` → "Total Amount"
- `bank_name` → "Bank Name"

### Values
Format values before passing to the component:

```tsx
// ❌ Bad - raw values
{ field_name: 'amount', value: '1250' }
{ field_name: 'date', value: '2024-01-15' }

// ✅ Good - formatted values
{ field_name: 'amount', value: '$1,250.00' }
{ field_name: 'date', value: '15 January 2024' }
```

### Currency Formatting

```tsx
// Helper function
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

const highlights: HighlightFieldInfo[] = [
  { field_name: 'total', value: formatCurrency(1250.00) }
];
```

### Date Formatting

```tsx
// Helper function
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const highlights: HighlightFieldInfo[] = [
  { field_name: 'document_date', value: formatDate('2024-06-30') }
];
```

## Complete Working Example

Full example with extraction, formatting, and error handling:

```tsx
import { useState } from 'react';
import { PdfViewer } from 'hazo_pdf';
import type { HighlightFieldInfo } from 'hazo_pdf';
import 'hazo_pdf/styles.css';

// Utility functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

function DocumentViewer({ pdfUrl }: { pdfUrl: string }) {
  const [docData, setDocData] = useState<Record<string, unknown>>();
  const [highlights, setHighlights] = useState<HighlightFieldInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtractComplete = (data: Record<string, unknown>) => {
    console.log('Extracted data:', data);
    setDocData(data);

    // Format and create highlights
    const formattedHighlights: HighlightFieldInfo[] = [];

    for (const [key, value] of Object.entries(data)) {
      // Skip complex types
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        continue;
      }

      let formattedValue = String(value);

      // Apply formatting based on field name patterns
      if (key.includes('date') && typeof value === 'string') {
        try {
          formattedValue = formatDate(value);
        } catch (e) {
          // Keep original if parsing fails
        }
      } else if (key.includes('amount') && typeof value === 'number') {
        formattedValue = formatCurrency(value);
      }

      formattedHighlights.push({
        field_name: key,
        value: formattedValue
      });
    }

    setHighlights(formattedHighlights);
    setLoading(false);
    setError(null);
  };

  const handleExtractError = (err: Error) => {
    console.error('Extraction error:', err);
    setError(err.message);
    setLoading(false);
  };

  const handleExtractStart = () => {
    setLoading(true);
    setError(null);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderBottom: '1px solid #fcc' }}>
          Error: {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: '1rem', background: '#fef9e7', borderBottom: '1px solid #fce5cd' }}>
          Extracting data...
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PdfViewer
          url={pdfUrl}
          show_extract_button={true}
          extract_prompt_area="documents"
          extract_prompt_key="extract_data"
          extract_api_endpoint="/api/extract"
          on_extract_complete={handleExtractComplete}
          on_extract_error={handleExtractError}
          doc_data={docData}
          highlight_fields_info={highlights}
          show_file_info_button={true}
        />
      </div>
    </div>
  );
}

export default DocumentViewer;
```

## Common Issues

### Sidepanel Not Showing

Make sure you:
1. Provide at least one of: `doc_data`, `highlight_fields_info`, or `file_metadata`
2. Set `show_file_info_button={true}` (default is true)
3. Import CSS: `import 'hazo_pdf/styles.css'`

### Highlights Not Visible

Check that:
1. You're using the correct type: `HighlightFieldInfo[]`
2. Each item has both `field_name` and `value` as strings
3. Values are formatted as strings, not numbers

### Field Names Not Formatting

Field names are auto-formatted:
- `invoice_number` → "Invoice Number" ✅
- `invoiceNumber` → "InvoiceNumber" ❌ (camelCase not supported)
- Use snake_case for proper formatting

### Empty Sidepanel

If sidepanel shows "No file information available":
- Verify data is actually passed to props
- Check console for errors
- Ensure data matches expected types
