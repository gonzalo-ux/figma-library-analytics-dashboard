# Changelog Sync Strategy

## Overview

The changelog table is synced from Figma using a **local JSON file** approach. This is more efficient than making API calls on every page load.

## Architecture

### Current Setup

1. **Data Storage**: `src/data/changelog.json` - Contains all changelog entries
2. **Component**: `src/components/ChangelogTable.jsx` - Loads data from JSON file
3. **Parser**: `src/lib/parseChangelogDescription.js` - Converts plain text to React components
4. **Sync Script**: `scripts/sync-changelog.js` - Fetches data from Figma (to be implemented)

## Why This Approach?

### ❌ Problems with Individual API Calls
- **Slow**: Each row requires a separate API call (14+ calls)
- **Expensive**: Many API requests = rate limiting issues
- **Unreliable**: Network failures affect user experience
- **No caching**: Same data fetched repeatedly

### ✅ Benefits of Local JSON File
- **Fast**: Single file load, no API calls at runtime
- **Reliable**: Works offline, no network dependencies
- **Version controlled**: Changes tracked in git
- **Cacheable**: Browser can cache the JSON file
- **Simple**: Easy to debug and modify

## Sync Process

### Option 1: Manual Sync (Recommended for now)
1. Run sync script when Figma changelog is updated
2. Script fetches all rows from Figma
3. Saves to `src/data/changelog.json`
4. Commit changes to git

```bash
# When you need to update the changelog
node scripts/sync-changelog.js
```

### Option 2: Automated Sync (Future)
- Add to build process: `npm run build` could sync before building
- CI/CD: Sync on deployment
- Scheduled: Run periodically via cron/GitHub Actions

## Implementation Details

### Fetching Strategy

**Best approach**: Fetch frame metadata once, then fetch all rows in parallel

```javascript
// 1. Get frame metadata (1 API call)
const frameMetadata = await getFrameMetadata('29368:8608')

// 2. Extract all row IDs from metadata
const rowIds = extractRowIds(frameMetadata)

// 3. Fetch all rows in parallel (much faster than sequential)
const rows = await Promise.all(
  rowIds.map(id => getRowData(id))
)

// 4. Parse and save to JSON
saveToJSON(rows)
```

### Performance Comparison

| Approach | API Calls | Time | Reliability |
|----------|-----------|------|-------------|
| Individual calls (sequential) | 14+ | ~14-28s | Low |
| Individual calls (parallel) | 14+ | ~2-4s | Medium |
| **Frame metadata + parallel rows** | **15** | **~2-3s** | **High** |
| **Local JSON (runtime)** | **0** | **<50ms** | **Very High** |

## Data Format

The JSON file uses a simple format:

```json
[
  {
    "version": "7.7.6",
    "date": "2025-11-14",
    "description": "❖ Buttons group in action sheet and dialog\n- Change to primary button first order"
  }
]
```

The `parseChangelogDescription` utility converts the plain text description into React components with proper formatting.

## When to Sync

- **After Figma updates**: When new changelog entries are added
- **Before releases**: Ensure changelog is up-to-date
- **Periodically**: Weekly/monthly sync to catch any missed updates

## Future Improvements

1. **Incremental sync**: Only fetch new rows since last sync
2. **Version comparison**: Compare Figma version with local version
3. **Auto-detection**: Detect when Figma changelog changes
4. **Webhook**: Figma webhook to trigger sync automatically

