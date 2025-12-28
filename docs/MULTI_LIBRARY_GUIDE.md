# Multi-Library Support Guide

## Overview

The Figma Library Analytics Dashboard now supports tracking data from multiple Figma libraries using a single access token. This guide explains the new features and how to configure them.

## Key Features

### 1. Multiple Library Support
- Add and manage multiple Figma libraries
- Each library can have its own configuration
- All libraries use the same Figma access token

### 2. Library Filtering
Each library can have exclusion filters to remove unwanted elements:
- **Prefix Filter**: Exclude items that start with a specific text (e.g., "Icon -")
- **Suffix Filter**: Exclude items that end with a specific text (e.g., "/deprecated")
- **Contains Filter**: Exclude items that contain a specific text (e.g., "_old")

These filters apply to component names, variable names, and style names depending on the data type.

### 3. Custom Pages/Tabs
Create custom dashboard pages with different configurations:
- **Components**: Display component data (excluding icons by default)
- **Icons**: Display only icon components
- **Variables**: Display design token/variable data
- **Styles**: Display style data
- **Branches**: Display Figma branch information

Each page can pull data from a different library or reuse the same library with different filters.

## Configuration Structure

The new configuration format looks like this:

```json
{
  "figma": {
    "accessToken": "your-figma-token",
    "libraries": [
      {
        "id": "unique-id",
        "url": "https://figma.com/file/ABC123/Library-Name",
        "name": "Main Components",
        "filters": {
          "exclude": {
            "prefix": "Icon -",
            "suffix": "",
            "contains": ""
          }
        }
      }
    ]
  },
  "pages": [
    {
      "id": "page-1",
      "name": "Components",
      "libraryId": "unique-id",
      "type": "components"
    }
  ]
}
```

## Setup Wizard (Step 1)

When running the setup wizard, you'll now see:

### 1. Figma Access Token
Enter your Figma access token (same as before)

### 2. Library Configuration
Add one or more libraries:
- **Library URL**: The Figma file URL
- **Display Name**: A friendly name for the library (e.g., "Components", "Icons", "Design Tokens")
- **Exclusion Filters**: Optional filters to exclude specific elements

### 3. Page Configuration
Configure dashboard pages:
- **Page Name**: The name that appears in the tab
- **Library Source**: Which library this page pulls data from
- **Data Type**: What type of data to display (components, icons, variables, styles)

## Default Configuration

The wizard provides 4 default pages that all use the first library:
1. **Components** - Shows all components (excluding icons)
2. **Icons** - Shows only icon components
3. **Variables** - Shows design tokens/variables
4. **Styles** - Shows styles (colors, text styles, effects, etc.)

You can modify these or create additional pages as needed.

## Use Cases

### Use Case 1: Separate Icon Library
If you have a separate library for icons:

1. Add two libraries:
   - Library 1: Main Components Library
   - Library 2: Icons Library

2. Create pages:
   - Components page → Library 1
   - Icons page → Library 2

### Use Case 2: Filtered Components
If you want to split components by naming convention:

1. Add one library
2. Create multiple pages:
   - Page 1: "Buttons" → Filter contains "Button"
   - Page 2: "Forms" → Filter contains "Input" or "Form"
   - Page 3: "Navigation" → Filter contains "Nav"

### Use Case 3: Multiple Product Libraries
If you manage multiple products:

1. Add multiple libraries:
   - Product A Components
   - Product B Components
   - Shared Components

2. Create pages for each product with appropriate library assignments

## Filter Examples

### Exclude Icons from Components
```
Prefix: "Icon -"
```
This removes all items starting with "Icon -" from the dataset.

### Exclude Deprecated Items
```
Contains: "deprecated"
```
This removes all items with "deprecated" in the name.

### Exclude Old Versions
```
Suffix: "_v1"
```
This removes all items ending with "_v1".

### Combine Multiple Filters
You can use all three filters together. An item is excluded if it matches ANY of the filters (OR logic).

## Migration from Old Configuration

If you have an existing configuration with the old format:

**Old Format:**
```json
{
  "figma": {
    "accessToken": "token",
    "libraryUrl": "https://figma.com/file/ABC123/Name"
  }
}
```

**New Format:**
```json
{
  "figma": {
    "accessToken": "token",
    "libraries": [
      {
        "id": "1",
        "url": "https://figma.com/file/ABC123/Name",
        "name": "Main Library",
        "filters": {
          "exclude": { "prefix": "", "suffix": "", "contains": "" }
        }
      }
    ]
  },
  "pages": [
    { "id": "1", "name": "Components", "libraryId": "1", "type": "components" },
    { "id": "2", "name": "Icons", "libraryId": "1", "type": "icons" },
    { "id": "3", "name": "Variables", "libraryId": "1", "type": "variables" },
    { "id": "4", "name": "Styles", "libraryId": "1", "type": "styles" }
  ]
}
```

### Automatic Migration
The dashboard includes backward compatibility. If you have an old config:
1. Default pages will be created automatically
2. Your single library will work with all pages
3. No data loss or breaking changes

However, it's recommended to run through the setup wizard again to take advantage of the new features.

## CSV Generation

When you click "Generate CSV Files", the system will:
1. Process each library sequentially
2. Fetch data from each Figma library URL
3. Apply the configured filters
4. Generate CSV files for all libraries
5. Show a summary of successful and failed generations

The generated files will be stored in the `/public/csv/` directory and can be used across all configured pages.

## Tips

1. **Descriptive Names**: Use clear, descriptive names for libraries and pages
2. **Consistent Naming**: Use consistent naming conventions in Figma to make filtering easier
3. **Test Filters**: Start with one library and test your filters before adding more
4. **Reuse Libraries**: You can create multiple pages from the same library with different filters
5. **One Library Per Page**: Each page can only display data from one library (but you can have multiple pages for the same library)

## Troubleshooting

### Issue: No data showing on a page
**Solution**: Check that:
- The library URL is correct
- Your filters aren't excluding everything
- CSV files have been generated for that library

### Issue: Filter not working
**Solution**: 
- Filters are case-insensitive
- Make sure you're using the correct field (prefix, suffix, or contains)
- Check the actual component/variable names in Figma

### Issue: CSV generation fails for one library
**Solution**:
- Verify the library URL is accessible with your token
- Check that the library hasn't been moved or deleted in Figma
- Look at the console for detailed error messages

## API Changes

If you're integrating with the backend API, note these changes:

### POST `/api/generate-csv`
Now accepts:
```json
{
  "token": "figma-token",
  "libraryUrl": "library-url",
  "libraryName": "library-name",
  "libraryId": "library-id",
  "filters": {
    "exclude": {
      "prefix": "",
      "suffix": "",
      "contains": ""
    }
  }
}
```

The backend should handle these parameters to apply appropriate filtering when generating CSV files.

## Future Enhancements

Planned features for future releases:
- Include filters (show only matching items)
- Complex filter logic (AND/OR combinations)
- Library-specific color schemes
- Cross-library comparisons
- Export/import library configurations

