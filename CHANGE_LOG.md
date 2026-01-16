# Change Log

All notable changes to the hazo_pdf project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
