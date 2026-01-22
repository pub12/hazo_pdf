# Change Log

All notable changes to the hazo_pdf project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-01-22

### Added

#### Multi-File Support
- **Multi-File Management**: Added `files` prop (array of `FileItem` objects) for managing multiple PDF documents
  - Mutually exclusive with `url` prop - use either single-file or multi-file mode
  - New `on_file_select`, `on_file_delete`, `on_upload`, `on_files_change` callbacks for file operations
  - Integrated file manager UI component for file list display and management
  - Support for file upload with automatic conversion (images, Excel, text files to PDF)
  - New `FileItem` and `UploadResult` type exports

#### PDF Rotation
- **Rotation Controls**: Added rotate left and rotate right buttons to toolbar
  - Rotates current page 90 degrees clockwise or counter-clockwise
  - Per-page rotation (each page can have different rotation)
  - Rotation persists during session and is applied when saving PDF
  - Keyboard shortcuts: `Ctrl+[` (rotate left), `Ctrl+]` (rotate right)
  - New rotation icons in toolbar (RotateCcw, RotateCw from lucide-react)

#### Data Extraction
- **LLM-Based Extraction**: Added data extraction feature using `hazo_llm_api` integration
  - New `show_extract_button` prop to enable Extract button in toolbar
  - New `extract_prompt_area`, `extract_prompt_key`, `extract_api_endpoint` props for configuration
  - New `extract_storage_type` prop for hazo_files integration ('local' or 'google_drive')
  - New `on_extract_complete` and `on_extract_error` callbacks
  - Extracted data automatically saved to `hazo_files` SQLite table
  - New API routes: `/api/extract`, `/api/prompts` for server-side processing

#### File Info Sidepanel
- **File Metadata Display**: Added new file info sidepanel component (`file_info_sidepanel.tsx`)
  - Replaces previous `file_metadata_sidepanel.tsx` (deleted)
  - New `file_metadata` prop accepting `FileMetadataInput` array
  - Displays extracted data with flexible structure (string fields and table arrays)
  - Shows file system information (name, path, size, dates)
  - Collapsible table sections with row-based display
  - Automatic field name formatting (snake_case to Title Case)
  - New `show_file_info_button` prop to show/hide file info button in toolbar

#### hazo_files Integration
- **Remote Storage Support**: Added integration with `hazo_files` package for remote file storage
  - New `file_manager` prop accepting `FileAccessProvider` interface
  - New `save_path` prop for specifying remote save destination
  - New `file_access_middleware.ts` utility for loading/saving PDFs via hazo_files
  - New `file_access.ts` types defining `FileAccessProvider`, `FileDownloadResult`, `FileUploadResult`
  - Support for Google Drive, Dropbox, and local filesystem storage
  - Automatic data conversion (Buffer/ArrayBuffer/Uint8Array)
  - Added `hazo_files` as optional peer dependency in `package.json`
  - New configuration file: `config/hazo_files_config.ini`

#### Popout Functionality
- **Popout to New Tab**: Added ability to open PDF viewer in a new browser tab
  - New `enable_popout` prop to enable popout feature (default: false)
  - New `popout_route` prop to specify popout URL route (default: '/pdf-viewer')
  - New `on_popout` prop for custom popout handling
  - Uses sessionStorage to pass context (file info, annotations) to new tab
  - New popout icon in toolbar (ExternalLink from lucide-react)

#### UI Components
- **Toolbar Enhancements**: Added new toolbar buttons and controls
  - File info button with icon (Info from lucide-react)
  - Extract button with sparkles icon (Sparkles from lucide-react)
  - Rotate left/right buttons with rotation icons
  - Improved toolbar layout and button grouping
  - New `ToolbarDropdownButton` component for grouped actions
- **File Browser Demo**: Added new demo page at `/demo/file-browser` showing hazo_files integration
- **File Table Demo**: Added new demo page at `/demo/file-table` for tabular file listing
- **Prompt Editor Demo**: Added new demo page at `/demo/prompt-editor` for LLM prompt management

#### API Routes
- **Files API**: New `/api/files` route for querying hazo_files SQLite table
  - GET: List file metadata records with filtering
  - DELETE: Remove file metadata records by ID
- **Extract API**: Template API route structure in `/api/extract` for LLM extraction
- **Prompts API**: Template API route structure in `/api/prompts` for prompt management

#### UI Components (shadcn)
- **Alert Dialog**: Added `components/ui/alert-dialog.tsx` for confirmation dialogs
- **Table**: Added `components/ui/table.tsx` for data table displays

#### Database
- **SQLite Database**: Added `prompt_library.sqlite` for storing prompts and file metadata
  - `hazo_files` table for file metadata records
  - Integration with `hazo_connect` for CRUD operations

### Changed
- **PdfViewer Component**: Extended with multi-file, rotation, extraction, and remote storage features
  - Updated prop interface with 20+ new optional props
  - Enhanced toolbar with rotation, extract, file info, and popout buttons
  - Improved file loading logic to support both URL and hazo_files modes
  - Added cached PDF data state for file_manager integration
- **Type Definitions**: Extended `src/types/index.ts` with new interfaces
  - Added `FileItem`, `UploadResult`, `FileManagerDisplayMode`, `PopoutContext` types
  - Added `FileMetadataInput`, `FileMetadataItem` types for flexible metadata
  - Re-exported file manager and file access types
- **Configuration**: Extended default configuration and INI file structure
  - Added extraction-related configuration options
  - Added rotation-related configuration options
  - Updated `config/hazo_pdf_config.ini` with new settings
- **Build Configuration**: Updated `next.config.mjs` for Node.js module compatibility
  - Added webpack configuration for hazo_files, hazo_llm_api, better-sqlite3 modules
  - Created stub files for browser compatibility (`app/lib/node-stubs.js`, `app/lib/empty-module.js`)
- **Package Dependencies**: Updated `package.json`
  - Added `hazo_connect` (^2.4.2) for database operations
  - Added `xlsx` (^0.18.5) for Excel file conversion
  - Added `shadcn` (^3.5.0) for UI components
  - Updated `hazo_files` and `hazo_llm_api` in devDependencies
  - Version bumped to 1.4.0

### Deprecated
- **file_metadata_sidepanel.tsx**: Replaced by `file_info_sidepanel.tsx` with more flexible structure

### Removed
- **file_metadata_sidepanel.tsx**: Deleted in favor of new file info sidepanel component

### Fixed
- Metadata view rendering issues (commit 106eccb)
- Package configuration for proper exports

### Notes
- **Breaking Changes**: None - all new features are opt-in via new props
- **Migration**: Existing code continues to work without modifications
  - If using the old metadata sidepanel, migrate to new `file_metadata` prop structure
  - See README.md for migration examples
- **Version Compatibility**: Requires React 18+, Node.js 18+

## [1.3.4] - 2026-01-18

### Fixed
- Various bug fixes and stability improvements

## [1.3.3] - 2026-01-17

### Added
- Rotate button functionality

## [1.3.2] - 2026-01-16

### Fixed
- Package and configuration fixes

## [1.3.1] - 2026-01-16

### Fixed
- Package exports and type definitions

## [1.3.0] - 2026-01-16

### Added
- **Logger Integration**: Added optional `logger` prop to `PdfViewer` component for integration with `hazo_logs` or custom logging systems
  - New `Logger` interface export matching hazo_logs signature with `info`, `debug`, `warn`, `error` methods
  - New `set_logger()` utility function for configuring the logger instance globally
  - New `get_logger()` utility function for retrieving the current logger instance
  - Fallback to console-based logging when no logger is provided
  - Comprehensive logging in `pdf_converter.ts` for PDF conversion operations
  - Added `hazo_logs` as an optional peer dependency in `package.json`
- **Test App Configuration**: Created `config/hazo_logs_config.ini` for the test application with logging configuration

### Changed
- PDF conversion operations now emit structured log messages for debugging and monitoring
- Logger instance is initialized via `useEffect` in `PdfViewer` when the `logger` prop is provided

## [1.2.1] - Previous Release

### Changed
- Various bug fixes and improvements

## [1.2.0] - Previous Release

### Added
- Search and highlight API features

## [1.1.0] - Previous Release

### Added
- File upload working functionality

---

## Notes

- **Breaking Changes**: None in 1.3.0
- **Migration**: The logger prop is optional and backward compatible. Existing code will continue to work without any changes.
- **Deprecations**: None
