# Include Filters Feature

## Overview

Added **Include Filters** alongside the existing Exclude Filters, making it much easier to create focused pages from a single library.

## What Changed

### Filter Structure

**Before (Exclude Only):**
```json
{
  "filters": {
    "exclude": {
      "prefix": "",
      "suffix": "",
      "contains": ""
    }
  }
}
```

**After (Include + Exclude):**
```json
{
  "filters": {
    "include": {
      "prefix": "",
      "suffix": "",
      "contains": ""
    },
    "exclude": {
      "prefix": "",
      "suffix": "",
      "contains": ""
    }
  }
}
```

## How It Works

### Filter Application Order

1. **Include Filters** (applied first, if any are set)
   - Narrows down to only items matching the criteria
   - Uses OR logic: item matches ANY include filter = included
   - If no include filters set, all items pass through

2. **Exclude Filters** (applied second, if any are set)
   - Removes unwanted items from the included set
   - Uses OR logic: item matches ANY exclude filter = excluded
   - If no exclude filters set, no items are excluded

### Examples

#### Example 1: Show Only Buttons
```
Include:
  Contains: "Button"
Exclude:
  (empty)

Result: Only items with "Button" in the name
```

#### Example 2: Show Icons Except Draft Ones
```
Include:
  Starts with: "Icon -"
Exclude:
  Contains: "draft"

Result: All icons except those with "draft" in name
```

#### Example 3: Show Production-Ready Forms
```
Include:
  Contains: "Form"
Exclude:
  Prefix: "_"
  Suffix: "_old"

Result: Form components, excluding those starting with "_" or ending with "_old"
```

## UI Changes

### PageConfig Component

**Filter Toggle:**
- Changed from "Use Exclusion Filters" to "Use Filters"
- More generic label since it handles both include and exclude

**Filter Section (When Expanded):**
```
┌─────────────────────────────────────┐
│ Include Only (Optional)             │
│ Show only items matching...         │
│ ┌───────────────────────────────┐   │
│ │ Starts with | Ends with | Contains│
│ └───────────────────────────────┘   │
│                                     │
│ Exclude (Optional)                  │
│ Remove items matching...            │
│ ┌───────────────────────────────┐   │
│ │ Starts with | Ends with | Contains│
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Common Use Cases

### 1. Create Category Pages from Single Library

**Setup:** 1 Library, Multiple Pages

```
Page: "Buttons"
├─ Include: Contains "Button"
└─ Exclude: (empty)

Page: "Forms"  
├─ Include: Contains "Input" OR Contains "Form"
└─ Exclude: (empty)

Page: "Icons"
├─ Include: Starts with "Icon -"
└─ Exclude: (empty)
```

### 2. Filter by Status

```
Page: "Production Components"
├─ Include: (empty = all)
└─ Exclude: Contains "draft" OR Contains "WIP"

Page: "In Development"
├─ Include: Contains "WIP"
└─ Exclude: (empty)
```

### 3. Filter by Size Variant

```
Page: "Large Components"
├─ Include: Ends with "/Large"
└─ Exclude: (empty)

Page: "Small Components"
├─ Include: Ends with "/Small"  
└─ Exclude: (empty)
```

### 4. Complex Filtering

```
Page: "Active Navigation Elements"
├─ Include: Contains "Nav"
└─ Exclude: Contains "deprecated" OR Starts with "_"

Result: Navigation items, excluding deprecated or internal ones
```

## Implementation Details

### New Function: `applyIncludeFilters()`

Located in `src/lib/dataFilter.js`:

```javascript
export function applyIncludeFilters(data, filters, nameField) {
  // If no include filters, return all data
  if (!filters.include || !(prefix || suffix || contains)) {
    return data
  }
  
  // Keep items that match ANY include criterion
  return data.filter(item => {
    return matchesPrefix || matchesSuffix || matchesContains
  })
}
```

### Updated Function: `filterDataForPage()`

Now applies filters in sequence:

```javascript
export function filterDataForPage(data, config, pageId) {
  let filtered = data
  
  if (page.useFilters && page.filters) {
    // Step 1: Include filters (narrows down)
    if (hasIncludeFilters) {
      filtered = applyIncludeFilters(filtered, page.filters)
    }
    
    // Step 2: Exclude filters (removes unwanted)
    if (hasExcludeFilters) {
      filtered = applyLibraryFilters(filtered, page.filters)
    }
  }
  
  return filtered
}
```

## Files Modified

1. ✅ `src/components/PageConfig.jsx`
   - Added include filter inputs
   - Updated filter label to "Use Filters"
   - Enhanced handlePageChange to handle both filter types

2. ✅ `src/lib/dataFilter.js`
   - Added `applyIncludeFilters()` function
   - Updated `filterDataForPage()` to apply filters in sequence
   - Added filter detection logic

3. ✅ `src/components/SetupStep1.jsx`
   - Updated default page structure with include filters

4. ✅ No linting errors

## Benefits

1. **Easier Category Creation**: Include filters make it simple to show only specific items
2. **More Intuitive**: "Show me buttons" is easier to think about than "Hide everything except buttons"
3. **Powerful Combinations**: Include + Exclude provides maximum flexibility
4. **Single Library Reuse**: Create many focused pages from one library
5. **Clear Intent**: Include = "what I want", Exclude = "what I don't want"

## Filter Logic Summary

| Include Filters | Exclude Filters | Result |
|----------------|-----------------|---------|
| None | None | All items |
| Set | None | Only included items |
| None | Set | All items except excluded |
| Set | Set | Included items, then remove excluded |

**Key Point**: Include narrows down, Exclude removes. Use together for precise control!

## Migration

No breaking changes! Existing configs without include filters will work as before:

**Old Config (still works):**
```json
{
  "filters": {
    "exclude": { "prefix": "Icon -" }
  }
}
```

**Will be treated as:**
```json
{
  "filters": {
    "include": { },  // empty = include all
    "exclude": { "prefix": "Icon -" }
  }
}
```

## Examples in Action

### Single Library, Multiple Focused Pages

**Library:** "Design System" (500 components total)

```
Page 1: "Buttons" (50 components)
├─ Include: Contains "Button"

Page 2: "Form Elements" (80 components)  
├─ Include: Contains "Input" OR Contains "Select" OR Contains "Form"

Page 3: "Icons" (200 components)
├─ Include: Starts with "Icon -"

Page 4: "Layout" (30 components)
├─ Include: Contains "Container" OR Contains "Grid"

Page 5: "Everything Else" (140 components)
├─ Exclude: Contains "Button"
├─ Exclude: Contains "Input"
├─ Exclude: Starts with "Icon -"
└─ Exclude: Contains "Container"
```

Total shown: 500 components across 5 pages, no duplication! 🎉

---

**Result**: Much more powerful and intuitive filtering system!

