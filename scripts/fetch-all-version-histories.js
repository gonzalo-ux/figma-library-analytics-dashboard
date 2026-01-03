#!/usr/bin/env node
/**
 * Script to fetch version history for all libraries in config.json
 * 
 * Usage:
 *   node scripts/fetch-all-version-histories.js
 * 
 * This script:
 * 1. Reads config.json to get all libraries
 * 2. Extracts file keys from library URLs
 * 3. Fetches version history for each library
 * 4. Saves to the appropriate library folder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config
const configPath = path.join(__dirname, '../config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ config.json not found');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

if (!config.figma?.accessToken) {
  console.error('❌ Figma access token not found in config.json');
  process.exit(1);
}

if (!config.figma?.libraries || config.figma.libraries.length === 0) {
  console.error('❌ No libraries found in config.json');
  process.exit(1);
}

// Sanitize library name to match server-side sanitization
function sanitizeLibraryName(name) {
  if (!name || typeof name !== 'string') {
    return 'default';
  }
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').trim() || 'default';
}

// Extract file key from Figma URL
function extractFileKey(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // Support both /file/ and /design/ paths
  const match = url.match(/\/(file|design)\/([A-Za-z0-9]+)(?:\/|$|\?)/);
  return match ? match[2] : null;
}

const token = config.figma.accessToken;
const pythonApiPath = path.join(__dirname, '../python-api');
const baseOutputDir = path.join(__dirname, '../public/csv');

console.log('📦 Fetching version history for all libraries...\n');

for (const library of config.figma.libraries) {
  const fileKey = extractFileKey(library.url);
  if (!fileKey) {
    console.error(`⚠️  Could not extract file key from URL for library: ${library.name}`);
    continue;
  }
  
  const libraryFolder = sanitizeLibraryName(library.name);
  const outputPath = path.join(baseOutputDir, libraryFolder, 'version_history.json');
  
  // Ensure directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`📚 Library: ${library.name}`);
  console.log(`   File Key: ${fileKey}`);
  console.log(`   Output: ${outputPath}`);
  
  try {
    // Run Python script to fetch version history
    const command = `python3 ${path.join(pythonApiPath, 'fetch_versions.py')} --token ${token} --file-key ${fileKey} --output ${outputPath}`;
    execSync(command, { stdio: 'inherit', cwd: pythonApiPath });
    console.log(`   ✅ Successfully fetched version history\n`);
  } catch (error) {
    console.error(`   ❌ Failed to fetch version history: ${error.message}\n`);
  }
}

console.log('✨ Done!');

