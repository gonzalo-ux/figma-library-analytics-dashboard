# Changelog Sync Script

## Quick Start

1. Set your Figma access token:
   ```bash
   export FIGMA_ACCESS_TOKEN=your_token_here
   ```

2. Run the sync script:
   ```bash
   npm run sync-changelog
   ```

   Or directly:
   ```bash
   node scripts/sync-changelog.js
   ```

## How It Works

The script:
1. Fetches all changelog rows from Figma in parallel
2. Parses version, date, and description from each row
3. Saves the data to `src/data/changelog.json`
4. The component automatically loads from this file

## Finding New Row IDs

### Option 1: Auto-Discover (Recommended)

Run the discovery script to automatically find all row IDs:

```bash
FIGMA_ACCESS_TOKEN=your_token npm run discover-rows
```

This will output all row IDs that you can copy into `sync-changelog.js`.

### Option 2: Manual Discovery

When new entries are added to the Figma changelog:

1. Get the frame metadata using Figma Desktop MCP:
   - Use `get_metadata` on the changelog frame (`29368:8608`)
   - Look for new `<frame name="Row">` elements
   - Extract their node IDs (format: `id="123:456"`)

2. Add the new row IDs to `ROW_NODE_IDS` array in `sync-changelog.js`

3. Run the sync script again

## Alternative: Auto-Discover Row IDs

For a more automated approach, you could:
1. Fetch the frame metadata first
2. Parse the XML/metadata to extract all row node IDs automatically
3. Then fetch all rows

This would eliminate the need to manually maintain the `ROW_NODE_IDS` array.

## Troubleshooting

**Error: FIGMA_ACCESS_TOKEN environment variable is required**
- Set the token: `export FIGMA_ACCESS_TOKEN=your_token`
- Or add it to your `.env` file (if using dotenv)

**Error: Figma API error 404**
- Check that the file key and node IDs are correct
- Verify your access token has permission to access the file

**Some rows fail to parse**
- Check the console output for which rows failed
- The row structure in Figma might have changed
- Update the `parseChangelogRow` function if needed

