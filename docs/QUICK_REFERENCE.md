# Multi-Library Quick Reference

## Setup in 3 Steps

### 1. Add Your Libraries
```
Setup Wizard → Step 1 → Add Library
- Enter Figma URL
- Give it a name (e.g., "Components", "Icons")
- Set filters (optional)
```

### 2. Configure Pages
```
Setup Wizard → Step 1 → Pages Section
- 4 default pages provided
- Customize names and library assignments
- Add more pages if needed
```

### 3. Generate Data
```
Dashboard → Generate CSV Files button
- Processes all libraries
- Wait for completion
- Refresh page to see data
```

## Filter Quick Reference

### Exclude by Prefix
Remove items that **start with** a specific text:
- `Icon -` → Removes all icons
- `_` → Removes items starting with underscore
- `Deprecated` → Removes deprecated items

### Exclude by Suffix
Remove items that **end with** a specific text:
- `/old` → Removes old versions
- `_v1` → Removes version 1 items
- `-deprecated` → Removes deprecated items

### Exclude by Contains
Remove items that **contain** a specific text:
- `temp` → Removes temporary items
- `test` → Removes test items
- `archive` → Removes archived items

### Tips
✅ Filters are case-insensitive  
✅ Use OR logic (any match = excluded)  
✅ Leave empty to include everything  
✅ Test with one library first  

## Common Use Cases

### Separate Icons from Components
**Setup:**
- Library 1: Main Library
  - Filter: Prefix = "Icon -"
- Page 1: Components → Library 1
- Page 2: Icons → Library 1 (remove filter)

### Multiple Product Libraries
**Setup:**
- Library 1: Product A Components
- Library 2: Product B Components
- Library 3: Shared Components
- Page 1: Product A → Library 1
- Page 2: Product B → Library 2
- Page 3: Shared → Library 3

### Filter by Component Type
**Setup:**
- Library 1: Main Library
- Page 1: Buttons → Contains "Button"
- Page 2: Forms → Contains "Input"
- Page 3: Navigation → Contains "Nav"

## Page Types

| Type | Shows | Auto-Filters |
|------|-------|--------------|
| **Components** | Component analytics | Excludes icons |
| **Icons** | Icon analytics | Only icons |
| **Variables** | Design tokens | None |
| **Styles** | Color/text styles | None |
| **Branches** | Git branches | N/A |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Switch tabs | Click tab or ← → |
| Edit mode | Click "Edit Mode" button |
| Date range | Click calendar icon |

## Troubleshooting

### No data showing?
1. Check library URL is correct
2. Verify filters aren't excluding everything
3. Generate CSV files for that library
4. Refresh the page

### Filter not working?
1. Check spelling (case-insensitive but must match)
2. Try simpler filter first
3. Test with "Contains" instead of prefix/suffix
4. View raw data in CSV to verify names

### CSV generation fails?
1. Verify Figma access token
2. Check library URL format
3. Ensure Python API is running
4. Check console for error details

## Configuration Format

```json
{
  "figma": {
    "accessToken": "your-token",
    "libraries": [
      {
        "id": "1",
        "url": "https://figma.com/file/ABC/Name",
        "name": "Main Library",
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
      "id": "1",
      "name": "Components",
      "libraryId": "1",
      "type": "components"
    }
  ]
}
```

## Best Practices

1. **Use Descriptive Names**: "Marketing Icons" not "Library 2"
2. **Test Filters First**: Start simple, then refine
3. **Consistent Naming**: Use naming conventions in Figma
4. **One Library = One Purpose**: Separate by function
5. **Document Filters**: Keep notes on what each filter does

## Need More Help?

📖 Full Guide: `docs/MULTI_LIBRARY_GUIDE.md`  
📋 Implementation Details: `docs/IMPLEMENTATION_SUMMARY.md`  
🐛 Issues: Check browser console first  

## Example Workflows

### Weekly Review
```
1. Generate CSV Files for all libraries
2. Check Components page for new additions
3. Review Icons page for usage
4. Check Variables for token adoption
5. Export data if needed
```

### Setting Up New Library
```
1. Go to Setup Wizard (or Edit Mode)
2. Add Library with URL and name
3. Set filters if needed
4. Create page(s) for this library
5. Generate CSV files
6. Refresh and verify data
```

### Migrating from Old Config
```
1. Run Setup Wizard
2. Your token is already there
3. Add your existing library as Library 1
4. Accept default pages or customize
5. Complete wizard
6. Everything works as before + new features
```

---

**Remember**: All changes in Setup Wizard are saved automatically!

