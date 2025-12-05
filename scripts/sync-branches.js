/**
 * Script to sync branches data from Figma
 * 
 * This script fetches all branches from the Figma file and saves them to src/data/branches.json
 * 
 * Prerequisites:
 * - Set FIGMA_ACCESS_TOKEN environment variable
 * - Or pass it as an argument: FIGMA_ACCESS_TOKEN=your_token node scripts/sync-branches.js
 * 
 * Usage:
 *   node scripts/sync-branches.js
 * 
 * The script:
 * 1. Fetches the file with branch_data=true to get all branches
 * 2. Processes and categorizes branches (active, archived, merged)
 * 3. Saves to src/data/branches.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const FIGMA_FILE_KEY = 'CizdSWIpNAplH7UkBcGqUC';
const OUTPUT_FILE = path.join(__dirname, '../src/data/branches.json');

/**
 * Fetches branches from Figma API
 */
async function fetchBranches() {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN environment variable is required');
  }

  console.log('🔄 Fetching branches from Figma...');
  
  const url = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}?branch_data=true`;
  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Figma API error: ${response.status} ${response.statusText}. ${errorText}`);
  }

  const fileData = await response.json();
  return fileData;
}

/**
 * Determines branch status based on available data
 */
function determineBranchStatus(branch, allBranches) {
  // Check if branch has explicit status
  if (branch.status) {
    const status = branch.status.toLowerCase();
    if (['archived', 'merged', 'active'].includes(status)) {
      return status;
    }
  }
  
  // Check archived flag
  if (branch.archived === true) {
    return 'archived';
  }
  
  // Check merged flag
  if (branch.merged === true) {
    return 'merged';
  }
  
  // Default to active if no status indicators
  return 'active';
}

/**
 * Determines review status for active branches
 * Note: Figma API might not provide review status directly
 * This is a placeholder that can be enhanced if review data becomes available
 */
function determineReviewStatus(branch) {
  // Check for explicit review status
  if (branch.review_status) {
    return branch.review_status.toLowerCase();
  }
  
  // Check for approved flag
  if (branch.approved === true) {
    return 'approved';
  }
  
  // Check if branch was modified recently (might indicate it's in review)
  const lastModified = branch.last_modified || branch.lastModified;
  if (lastModified && branch.approved === false) {
    const daysSinceModified = (Date.now() - new Date(lastModified).getTime()) / (1000 * 60 * 60 * 24);
    // If modified within last 30 days and not approved, might be in review
    if (daysSinceModified < 30 && daysSinceModified > 0) {
      return 'in_review';
    }
  }
  
  // Default: no review status available
  // In a real implementation, you might want to check a separate reviews endpoint
  return null;
}

/**
 * Formats a date string
 */
function formatDate(dateString) {
  if (!dateString) return null;
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return dateString;
  }
}

/**
 * Main function to sync branches data
 */
async function syncBranches() {
  console.log('🔄 Starting branches sync...');
  
  try {
    const fileData = await fetchBranches();
    
    // Extract branches from the response
    const branchesData = fileData.branches || [];
    
    console.log(`   Found ${branchesData.length} branches`);
    
    if (branchesData.length === 0) {
      console.log('   ⚠️  No branches found. The file might not have branches.');
    }
    
    // Debug: Log first branch structure to see what fields are available (only in verbose mode)
    // Uncomment the line below if you need to debug the API response structure
    // if (branchesData.length > 0) {
    //   console.log('   Sample branch structure:', JSON.stringify(branchesData[0], null, 2));
    // }
    
    // Map branches to our structure
    const mappedBranches = branchesData.map((branch) => {
      const status = determineBranchStatus(branch, branchesData);
      const reviewStatus = status === 'active' ? determineReviewStatus(branch) : null;
      
      // Extract creator information - Figma API might provide this in different formats
      let createdBy = 'Unknown';
      if (branch.created_by) {
        createdBy = branch.created_by;
      } else if (branch.creator) {
        createdBy = branch.creator.handle || branch.creator.name || branch.creator.email || 'Unknown';
      } else if (branch.owner) {
        createdBy = branch.owner.handle || branch.owner.name || branch.owner.email || 'Unknown';
      }
      
      // Try to get creation date from various possible fields
      // Note: Figma API might not provide creation date, only last_modified
      let createdAt = null;
      if (branch.created_at) {
        createdAt = formatDate(branch.created_at);
      } else if (branch.created) {
        createdAt = formatDate(branch.created);
      } else if (branch.last_modified) {
        // Use last_modified as fallback for created_at
        createdAt = formatDate(branch.last_modified);
      }
      
      // Get last modified date (API uses last_modified, not lastModified)
      const lastModified = branch.last_modified ? formatDate(branch.last_modified) : null;
      
      return {
        key: branch.key,
        name: branch.name || branch.key,
        status: status,
        review_status: reviewStatus,
        created_at: createdAt,
        created_by: createdBy,
        lastModified: lastModified,
        description: branch.description || null,
        // Store additional metadata that might be useful
        thumbnailUrl: branch.thumbnail_url || branch.thumbnailUrl || null,
      };
    });
    
    // Group branches by status for summary
    const activeCount = mappedBranches.filter(b => b.status === 'active').length;
    const archivedCount = mappedBranches.filter(b => b.status === 'archived').length;
    const mergedCount = mappedBranches.filter(b => b.status === 'merged').length;
    
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save to JSON file
    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(mappedBranches, null, 2),
      'utf-8'
    );
    
    console.log(`\n✅ Branches sync complete!`);
    console.log(`   Total branches: ${mappedBranches.length}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Archived: ${archivedCount}`);
    console.log(`   Merged: ${mergedCount}`);
    console.log(`   Saved to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error syncing branches:', error.message);
    process.exit(1);
  }
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncBranches();
}

export { syncBranches };
