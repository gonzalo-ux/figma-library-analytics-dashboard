/**
 * Helper script to discover all row IDs from the changelog frame
 * 
 * This script uses the Figma API to fetch the frame metadata and extract
 * all row node IDs automatically.
 * 
 * Usage:
 *   FIGMA_ACCESS_TOKEN=your_token node scripts/discover-row-ids.js
 * 
 * This will output all row IDs that you can then add to sync-changelog.js
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config to get Figma file key
let FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || 'CizdSWIpNAplH7UkBcGqUC';
const CHANGELOG_FRAME_ID = '29368:8608';

// Try to load from config.json if it exists
try {
  const fs = await import('fs');
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
 * Fetches the file structure from Figma API
 */
async function fetchFileStructure() {
  let token = process.env.FIGMA_ACCESS_TOKEN || process.env.VITE_FIGMA_ACCESS_TOKEN;
  
  // Try to load from config.json if not in env
  if (!token) {
    try {
      const fs = await import('fs');
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

  return await response.json();
}

/**
 * Recursively finds all row nodes in the document tree
 */
function findRowNodes(node, rowNodes = []) {
  if (!node) return rowNodes;

  // Check if this is a row (based on name or type)
  if (node.name === 'Row' || (node.type === 'FRAME' && node.name?.includes('Row'))) {
    rowNodes.push({
      id: node.id,
      name: node.name,
    });
  }

  // Recursively search children
  if (node.children) {
    node.children.forEach(child => findRowNodes(child, rowNodes));
  }

  return rowNodes;
}

/**
 * Main function to discover row IDs
 */
async function discoverRowIds() {
  console.log('🔍 Discovering changelog row IDs...');
  console.log(`   Fetching file structure for frame ${CHANGELOG_FRAME_ID}...`);

  try {
    const fileData = await fetchFileStructure();
    
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

    console.log(`   ✓ Found changelog frame: ${changelogFrame.name}`);

    // Find all row nodes within the frame
    const rowNodes = findRowNodes(changelogFrame);

    console.log(`\n✅ Found ${rowNodes.length} row nodes:\n`);
    
    // Output in a format that can be copied to sync-changelog.js
    console.log('// Add these to ROW_NODE_IDS array in sync-changelog.js:');
    rowNodes.forEach((row, index) => {
      console.log(`  '${row.id}',${index < rowNodes.length - 1 ? '' : ' // Add more as needed'}`);
    });

    console.log(`\n📋 Row IDs (comma-separated):`);
    console.log(rowNodes.map(r => r.id).join(', '));

  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
    console.error('\n💡 Alternative: Use Figma Desktop MCP tools:');
    console.error('   1. Call get_metadata on frame 29368:8608');
    console.error('   2. Look for <frame name="Row"> elements');
    console.error('   3. Extract their node IDs');
    process.exit(1);
  }
}

// Run the script if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]);

if (isMainModule || process.argv[1]?.includes('discover-row-ids')) {
  discoverRowIds().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export { discoverRowIds };

