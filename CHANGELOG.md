# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-28

### Added
- **Multi-Library Support**: Track data from multiple Figma libraries using a single access token
  - Add unlimited libraries with unique URLs and names
  - Each library maintains its own configuration
  - Sequential CSV generation for all configured libraries
  
- **Advanced Filtering System**: Exclude unwanted elements from analytics
  - Prefix filter: Exclude items starting with specific text
  - Suffix filter: Exclude items ending with specific text
  - Contains filter: Exclude items containing specific text
  - Case-insensitive matching with OR logic
  
- **Custom Page Configuration**: Create personalized dashboard views
  - Add unlimited custom pages/tabs
  - Assign each page to a specific library
  - Built-in page types: Components, Icons, Variables, Styles, Branches
  - Reuse libraries with different filters across pages
  
- **New Components**:
  - `LibraryConfig.jsx`: Manage multiple library configurations
  - `PageConfig.jsx`: Configure dashboard pages and tabs
  
- **New Utilities**:
  - `dataFilter.js`: Comprehensive filtering utilities
    - `applyLibraryFilters()`: Apply exclusion filters to datasets
    - `filterDataForPage()`: Combine library and page-type filters
    - `getConfiguredPages()`: Access page configurations
    - `getLibraryForPage()`: Retrieve library for specific page
    
- **Documentation**:
  - Multi-Library Guide: Comprehensive usage guide
  - Implementation Summary: Technical details and changes
  - Quick Reference: One-page cheat sheet
  - Testing Checklist: Complete QA guide

### Changed
- **Configuration Structure**: Updated from single library to multi-library format
  - Old: `figma.libraryUrl` → New: `figma.libraries[]`
  - Added `pages[]` configuration array
  - Maintains backward compatibility with old format
  
- **Setup Wizard**: Enhanced Step 1 with library and page management
  - Integrated LibraryConfig component
  - Integrated PageConfig component
  - Auto-generates 4 default pages on first setup
  - Enhanced validation for all fields
  
- **Dashboard**: Complete refactor for page-based navigation
  - Dynamic page generation from configuration
  - Replaced file-based tabs with page-based tabs
  - Integrated data filtering throughout
  - Updated all calculations to use page context
  
- **CSV Generation**: Multi-library support
  - Process all libraries sequentially
  - Aggregate success/failure reporting
  - Pass library metadata to backend
  - Enhanced error handling per library
  
- **Backend API**: Updated `/api/generate-csv` endpoint
  - Accept `libraryName`, `libraryId`, `filters` parameters
  - Pass library metadata as environment variables
  - Enhanced logging for multi-library processing

### Fixed
- Configuration persistence across setup wizard steps
- Page type filtering for icons vs components
- Data loading race conditions
- Memory optimization for large datasets

### Documentation
- Updated README with multi-library features
- Added comprehensive guides and references
- Included migration instructions
- Added testing checklist

## [1.x.x] - Previous Versions

### Features from Previous Versions
- Interactive charts (Bar, Line, Area, Pie, Radial)
- Customizable themes and typography
- Edit mode for live customization
- CSV data visualization
- Branch management
- Flexible changelog (Figma, Google Docs, Notion)
- Publication activity calendar
- Python API integration
- Responsive design
- Dark mode support

---

## Migration Guide

### From 1.x to 2.0

**No breaking changes!** Your existing configuration will continue to work.

**Old Configuration:**
```json
{
  "figma": {
    "accessToken": "token",
    "libraryUrl": "https://figma.com/file/ABC/Name"
  }
}
```

**Automatically Compatible** - Default pages will be created automatically.

**To Use New Features:**
1. Run the setup wizard again
2. Your token is preserved
3. Add your library with the new structure
4. Configure filters and pages as desired
5. Complete the wizard

See `docs/MULTI_LIBRARY_GUIDE.md` for detailed migration instructions.

---

## Development

### Version 2.0.0 Changes Summary
- 6 new/modified files in `src/components/`
- 1 new utility file in `src/lib/`
- Updated configuration schema
- Enhanced backend API
- 4 new documentation files

### Contributors
- Development team

---

## Support

For issues, questions, or feature requests:
1. Check documentation in `docs/`
2. Review the Quick Reference
3. Check browser console for errors
4. Review the Testing Checklist

---

[2.0.0]: https://github.com/your-org/figma-analytics-dashboard/releases/tag/v2.0.0
[1.x.x]: https://github.com/your-org/figma-analytics-dashboard/releases

