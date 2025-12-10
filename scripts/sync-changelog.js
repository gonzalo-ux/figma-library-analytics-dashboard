/**
 * Script to sync changelog data from Figma
 * 
 * This script fetches the changelog table from Figma and saves it to src/data/changelog.json
 * 
 * Prerequisites:
 * - Set FIGMA_ACCESS_TOKEN environment variable
 * - Or pass it as an argument: FIGMA_ACCESS_TOKEN=your_token node scripts/sync-changelog.js
 * 
 * Usage:
 *   node scripts/sync-changelog.js
 * 
 * The script:
 * 1. Fetches the changelog frame metadata to get all row IDs
 * 2. Fetches all rows in parallel
 * 3. Parses version, date, and description from each row
 * 4. Saves to src/data/changelog.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config to get Figma file key
let FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || 'CizdSWIpNAplH7UkBcGqUC';
const CHANGELOG_FRAME_ID = '29368:8608';
const OUTPUT_FILE = path.join(__dirname, '../src/data/changelog.json');

// Try to load from config.json if it exists
try {
  const configPath = path.join(__dirname, '../config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.figma?.libraryUrl) {
      // Extract file key from URL (e.g., https://www.figma.com/file/ABC123XYZ/Name)
      const urlMatch = config.figma.libraryUrl.match(/\/file\/([^\/]+)/);
      if (urlMatch) {
        FIGMA_FILE_KEY = urlMatch[1];
      }
    }
  }
} catch (error) {
  // Use default if config doesn't exist
}

/**
 * Recursively finds all row nodes in the document tree
 */
function findRowNodes(node, rowNodes = []) {
  if (!node) return rowNodes;

  // Check if this is a row (based on name or type)
  if (node.name === 'Row' || (node.type === 'FRAME' && node.name?.includes('Row'))) {
    rowNodes.push(node.id);
  }

  // Recursively search children
  if (node.children) {
    node.children.forEach(child => findRowNodes(child, rowNodes));
  }

  return rowNodes;
}

/**
 * Fetches the file structure and discovers all row IDs
 */
async function discoverRowIds() {
  let token = process.env.FIGMA_ACCESS_TOKEN || process.env.VITE_FIGMA_ACCESS_TOKEN;
  
  // Try to load from config.json if not in env
  if (!token) {
    try {
      const configPath = path.join(__dirname, '../config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        token = config.figma?.accessToken;
      }
    } catch (error) {
      // Continue to error below
    }
  }
  
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN environment variable or config.json accessToken is required');
  }

  const url = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}`;
  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const fileData = await response.json();
  
  // Find the changelog frame in the document
  function findFrame(node, targetId) {
    if (node.id === targetId) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findFrame(child, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  const changelogFrame = findFrame(fileData.document, CHANGELOG_FRAME_ID);
  
  if (!changelogFrame) {
    throw new Error(`Could not find frame ${CHANGELOG_FRAME_ID} in the file`);
  }

  // Find all row nodes within the frame, excluding the header
  const allRows = findRowNodes(changelogFrame);
  
  // Filter out the header row (it's named "Header", not "Row")
  // Also, we'll filter out any rows that don't have valid data during parsing
  const rowIds = allRows.filter(id => {
    // The header has a specific ID pattern, but it's safer to filter during parsing
    return true; // We'll filter invalid rows during parsing
  });
  
  return rowIds;
}

/**
 * Fetches a node from Figma API
 */
async function fetchFigmaNode(nodeId) {
  let token = process.env.FIGMA_ACCESS_TOKEN || process.env.VITE_FIGMA_ACCESS_TOKEN;
  
  // Try to load from config.json if not in env
  if (!token) {
    try {
      const configPath = path.join(__dirname, '../config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        token = config.figma?.accessToken;
      }
    } catch (error) {
      // Continue to error below
    }
  }
  
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN environment variable or config.json accessToken is required');
  }

  const url = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes?ids=${nodeId}`;
  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.nodes[nodeId];
}

/**
 * Extracts text content from a text node
 */
function extractText(node) {
  if (!node) return '';
  
  if (node.type === 'TEXT') {
    return node.characters || '';
  }
  
  if (node.children) {
    return node.children.map(extractText).join(' ').trim();
  }
  
  return '';
}

/**
 * Parses a changelog row to extract version, date, and description
 */
function parseChangelogRow(rowNode) {
  if (!rowNode || !rowNode.document) {
    return null;
  }

  const row = rowNode.document;
  
  // Find the three cells: version, date, description
  const cells = row.children || [];
  if (cells.length < 3) {
    return null;
  }

  const versionCell = cells[0];
  const dateCell = cells[1];
  const descriptionCell = cells[2];

  // Extract version
  const version = extractText(versionCell).trim();

  // Extract date
  const date = extractText(dateCell).trim();

  // Extract description - this is more complex as it can have multiple text nodes
  const description = extractDescription(descriptionCell);

  if (!version || !date) {
    return null;
  }

  return {
    version,
    date,
    description,
  };
}

/**
 * Extracts description from the description cell
 * Handles multiple text nodes, bullet points, etc.
 */
function extractDescription(cell) {
  if (!cell || !cell.children) {
    return '';
  }

  const parts = [];
  
  function traverse(node) {
    if (node.type === 'TEXT') {
      const text = node.characters || '';
      if (text.trim()) {
        parts.push(text);
      }
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  cell.children.forEach(traverse);
  
  // Join parts and clean up
  return parts.join('\n').trim();
}

/**
 * Main function to sync changelog data
 */
async function syncChangelog() {
  console.log('🔄 Starting changelog sync...');
  console.log('   Discovering changelog row IDs...');
  
  // Auto-discover all row IDs
  const ROW_NODE_IDS = await discoverRowIds();
  
  console.log(`   Found ${ROW_NODE_IDS.length} potential changelog entries`);
  console.log(`   Fetching rows from Figma (in batches to avoid rate limits)...`);

  const changelogEntries = [];
  const BATCH_SIZE = 10; // Fetch 10 rows at a time to avoid rate limits

  // Fetch rows in batches
  for (let i = 0; i < ROW_NODE_IDS.length; i += BATCH_SIZE) {
    const batch = ROW_NODE_IDS.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(ROW_NODE_IDS.length / BATCH_SIZE);
    
    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} rows)...`);

    const fetchPromises = batch.map(async (nodeId, batchIndex) => {
      const globalIndex = i + batchIndex + 1;
      try {
        const nodeData = await fetchFigmaNode(nodeId);
        const entry = parseChangelogRow(nodeData);
        
        if (entry && entry.version && entry.date) {
          changelogEntries.push(entry);
          return { success: true, entry };
        } else {
          return { success: false, reason: 'Could not parse' };
        }
      } catch (error) {
        return { success: false, reason: error.message };
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Log results
    results.forEach((result, idx) => {
      const globalIndex = i + idx + 1;
      if (result.success) {
        console.log(`   [${globalIndex}/${ROW_NODE_IDS.length}] ✓ ${result.entry.version} - ${result.entry.date}`);
      }
    });

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < ROW_NODE_IDS.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Sort by date descending (newest first)
  changelogEntries.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save to JSON file
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(changelogEntries, null, 2),
    'utf-8'
  );

  console.log(`\n✅ Changelog sync complete!`);
  console.log(`   Total entries: ${changelogEntries.length}`);
  console.log(`   Saved to: ${OUTPUT_FILE}`);
  console.log(`   Versions: ${changelogEntries.map(e => e.version).join(', ')}`);
}

// Run the script if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]);

if (isMainModule || process.argv[1]?.includes('sync-changelog')) {
  syncChangelog().catch((error) => {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  });
}

export { syncChangelog };
