# Test PDFs Directory

This directory contains sample PDF files for testing the PDF viewer component in Storybook.

## Usage in Storybook

### Method 1: Using Storybook Controls (Recommended)
1. Start Storybook: `npm run storybook`
2. Select a story (e.g., "Default" or "WithAnnotations")
3. In the **Controls** panel, find the "url" field
4. Change it to your PDF filename: `/sample.pdf` or `/your-file.pdf`
5. The PDF will load automatically

### Method 2: Modifying Story Files
1. Open `src/stories/PdfViewer.stories.tsx`
2. Find the story you want to modify
3. Change the `url` in the `args` to your PDF filename
4. Example: `url: '/sample.pdf'`

## File Naming

- Place your PDF files directly in this directory (`test/pdfs/`)
- Reference them in Storybook as `/filename.pdf` (absolute path from root)
- Examples:
  - `/sample.pdf` - for a file named `sample.pdf`
  - `/test-document.pdf` - for a file named `test-document.pdf`
  - `/my-pdf-file.pdf` - for a file named `my-pdf-file.pdf`

## Examples

### Testing with sample.pdf
1. Place `sample.pdf` in this directory
2. The default stories are already configured to use `/sample.pdf`
3. Or change the url in Controls to `/sample.pdf`
4. Or use the "WithFileInput" story which has an input field for easy testing

## Notes

- Files in this directory are served as static files by Storybook
- The `staticDirs` configuration in `.storybook/main.ts` serves files from this directory
- Do not commit large PDF files to git - add them to `.gitignore` if needed
- Use the `.gitkeep` file to ensure this directory is tracked in git
