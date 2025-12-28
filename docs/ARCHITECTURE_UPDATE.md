# Multi-Library Support - Updated Architecture

## Key Design Change

**Filters are now part of page configuration, not library configuration.**

This design allows for much more flexibility:
- ✅ Use the same library across multiple pages
- ✅ Apply different filters per page
- ✅ Show different views of the same data
- ✅ Filters are optional and hidden by default

## Configuration Structure

```json
{
  "figma": {
    "accessToken": "your-token",
    "libraries": [
      {
        "id": "1",
        "url": "https://figma.com/file/ABC123/Library-Name",
        "name": "Main Library"
      }
    ]
  },
  "pages": [
    {
      "id": "1",
      "name": "All Components",
      "libraryId": "1",
      "type": "components",
      "useFilters": false,
      "filters": {
        "exclude": {
          "prefix": "",
          "suffix": "",
          "contains": ""
        }
      }
    },
    {
      "id": "2",
      "name": "Buttons Only",
      "libraryId": "1",
      "type": "components",
      "useFilters": true,
      "filters": {
        "exclude": {
          "prefix": "",
          "suffix": "",
          "contains": "Button"
        }
      }
    }
  ]
}
```

## Setup Wizard Experience

### Step 1: Add Libraries
1. Enter Figma access token
2. Add one or more libraries (just URL and name)
3. No filters at this stage - cleaner interface

### Step 2: Configure Pages
For each page:
1. **Basic Settings** (always visible):
   - Page Name
   - Library Source (dropdown)
   - Data Type (components, icons, variables, styles)

2. **Optional Filters** (hidden by default):
   - Toggle "Use Exclusion Filters" switch to show
   - Once enabled, expand/collapse filters section
   - Configure prefix, suffix, or contains filters

## Benefits of This Design

### 1. Reuse Libraries Efficiently
```
Single Library "Design System"
├── Page 1: "All Components" (no filters)
├── Page 2: "Buttons" (filter: contains "Button")
├── Page 3: "Form Elements" (filter: contains "Input")
└── Page 4: "Navigation" (filter: contains "Nav")
```

### 2. Compare Filtered vs Unfiltered
```
Library "Components"
├── Page 1: "All Components" (no filters)
└── Page 2: "Production Ready" (filter: exclude suffix "_draft")
```

### 3. Multiple Views Same Data
```
Library "Design Tokens"
├── Page 1: "All Variables"
├── Page 2: "Colors Only" (filter: contains "color")
└── Page 3: "Spacing Only" (filter: contains "spacing")
```

## User Interface

### PageConfig Component Features

**Collapsed State (Default):**
```
┌─────────────────────────────────────────┐
│ Page Name | Library | Data Type | [×]   │
│ ☐ Use Exclusion Filters                │
└─────────────────────────────────────────┘
```

**Expanded State (When Enabled):**
```
┌─────────────────────────────────────────┐
│ Page Name | Library | Data Type | [×]   │
│ ☑ Use Exclusion Filters          [˄]   │
│   ┌───────────────────────────────────┐ │
│   │ Starts with | Ends with | Contains│ │
│   │ [       ]   | [     ]   | [     ] │ │
│   └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Interactive Elements
- **Switch**: Enable/disable filters for the page
- **Collapse/Expand**: Show/hide filter inputs (only when enabled)
- **Auto-expand**: Automatically expands when filters are enabled

## Example Use Cases

### Case 1: Separate Component Categories
**Setup:**
- 1 Library: "Design System"
- 3 Pages from same library:
  - "Buttons" → contains "Button"
  - "Forms" → contains "Input" OR "Select" OR "Form"
  - "Layout" → contains "Container" OR "Grid"

### Case 2: Clean vs All Data
**Setup:**
- 1 Library: "Components"
- 2 Pages:
  - "Production" → exclude contains "temp" AND exclude suffix "_old"
  - "All" → no filters

### Case 3: Multiple Libraries, Some Filtered
**Setup:**
- Library 1: "Components"
  - Page: "All Components" → no filters
- Library 2: "Experimental"
  - Page: "Stable Only" → exclude prefix "WIP"
  - Page: "All Experimental" → no filters

## Filter Logic

### When Filters Are Applied
1. Check if `page.useFilters === true`
2. If yes, apply exclusion filters from `page.filters.exclude`
3. Apply page-type specific logic (e.g., icons vs components)

### Filter Priority
1. **User Filters** (if enabled): Applied first
2. **Type Filters**: Applied second (built-in logic)

### Example Flow
```javascript
// Original data: 100 components

// Step 1: User has "useFilters: true" with "exclude contains: temp"
// → Removes 10 components with "temp" → 90 remain

// Step 2: Page type is "components" (excludes icons automatically)
// → Removes 20 icon components → 70 remain

// Final result: 70 components displayed
```

## Migration Notes

### Old Structure (Don't Use)
```json
{
  "libraries": [{
    "filters": { "exclude": { ... } }  // ❌ Filters at library level
  }]
}
```

### New Structure (Use This)
```json
{
  "libraries": [{
    "id": "1",
    "url": "...",
    "name": "..."
    // ✅ No filters here
  }],
  "pages": [{
    "libraryId": "1",
    "useFilters": true,
    "filters": { "exclude": { ... } }  // ✅ Filters at page level
  }]
}
```

## Benefits Summary

| Feature | Old Design | New Design |
|---------|-----------|------------|
| Filter Location | Library level | Page level |
| Reuse Library | Limited | Unlimited |
| Filter Visibility | Always visible | Hidden by default |
| Multiple Views | Need multiple libraries | Use one library |
| UI Complexity | Higher | Lower |
| Flexibility | Medium | High |

## Implementation Details

### Key Files Modified
- `src/components/LibraryConfig.jsx` - Removed filter inputs
- `src/components/PageConfig.jsx` - Added filter section with switch
- `src/lib/dataFilter.js` - Updated to use page filters
- `src/components/GenerateCSVButton.jsx` - Removed filter parameters

### Filter Application
```javascript
// In dataFilter.js
export function filterDataForPage(data, config, pageId) {
  const page = getPageConfig(config, pageId)
  
  // Only apply filters if enabled
  if (page.useFilters && page.filters) {
    data = applyLibraryFilters(data, page.filters)
  }
  
  // Then apply type-specific logic
  // ...
}
```

This design is cleaner, more flexible, and provides better UX by hiding complexity until needed.

