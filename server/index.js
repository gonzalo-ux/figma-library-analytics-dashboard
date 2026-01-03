import express from 'express'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')))

/**
 * Generate CSV files using Python API
 */
app.post('/api/generate-csv', async (req, res) => {
  const { token, libraryUrl, libraryName, libraryId } = req.body

  console.log('Received CSV generation request:', { 
    hasToken: !!token, 
    libraryUrl: libraryUrl,
    libraryName: libraryName || 'N/A',
    libraryId: libraryId || 'N/A',
    libraryUrlType: typeof libraryUrl,
    libraryUrlLength: libraryUrl?.length 
  })

  if (!token || !libraryUrl) {
    return res.status(400).json({ 
      error: 'Missing required parameters: token and libraryUrl' 
    })
  }

  // Clean and validate URL - remove query parameters and fragments
  let cleanedUrl = String(libraryUrl).trim()
  
  // Remove query parameters and fragments (everything after ? or #)
  cleanedUrl = cleanedUrl.split('?')[0].split('#')[0]
  
  console.log('Cleaned URL (after removing query params):', cleanedUrl)
  
  // Extract file key from URL - support both /file/ and /design/ paths
  // Match patterns like:
  // - https://www.figma.com/file/ABC123XYZ/Name
  // - https://figma.com/file/ABC123XYZ
  // - https://www.figma.com/design/ABC123XYZ/Name
  let fileKey = null
  
  // Pattern: Match /file/ or /design/ followed by the file key
  // File key is the first segment (stops at next / or end of string)
  // File keys are typically 15-20 characters of alphanumeric
  const match = cleanedUrl.match(/\/(file|design)\/([A-Za-z0-9]+)(?:\/|$)/)
  
  if (match && match[2]) {
    fileKey = match[2]
    console.log('Extracted file key:', fileKey)
  } else {
    // Fallback: Try without requiring trailing / or end
    const fallbackMatch = cleanedUrl.match(/\/(file|design)\/([A-Za-z0-9]+)/)
    if (fallbackMatch && fallbackMatch[2]) {
      fileKey = fallbackMatch[2]
      console.log('Extracted file key (fallback):', fileKey)
    }
  }
  
  if (!fileKey || fileKey.length === 0) {
    console.error('Failed to extract file key from URL:', cleanedUrl)
    console.error('Original URL was:', libraryUrl)
    return res.status(400).json({ 
      error: `Invalid Figma library URL: "${cleanedUrl}". Expected format: https://www.figma.com/file/ABC123XYZ/Name or https://www.figma.com/design/ABC123XYZ/Name` 
    })
  }

  // Determine Python API path - use local python-api directory by default
  const pythonApiPath = process.env.PYTHON_API_PATH || 
    path.join(__dirname, '../python-api')
  
  // Base output directory for CSV files
  const baseOutputDir = path.join(__dirname, '../public/csv')
  if (!fs.existsSync(baseOutputDir)) {
    fs.mkdirSync(baseOutputDir, { recursive: true })
  }
  
  // Create library-specific folder using library name
  // Sanitize library name to be filesystem-safe
  const sanitizeLibraryName = (name) => {
    if (!name || typeof name !== 'string') {
      return 'default'
    }
    // Replace invalid filesystem characters with underscores
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').trim() || 'default'
  }
  
  const libraryFolderName = sanitizeLibraryName(libraryName)
  const outputDir = path.resolve(path.join(baseOutputDir, libraryFolderName))
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  console.log(`Extracted file key: ${fileKey} from URL: ${cleanedUrl}`)
  console.log(`Library name: ${libraryName || 'N/A'}`)
  console.log(`Library folder: ${libraryFolderName}`)
  console.log(`Output directory (absolute): ${outputDir}`)

  const pythonScript = path.join(pythonApiPath, 'main.py')

  // Check if Python script exists
  if (!fs.existsSync(pythonScript)) {
    console.error(`Python script not found at: ${pythonScript}`)
    console.error(`Python API path: ${pythonApiPath}`)
    console.error(`Directory exists: ${fs.existsSync(pythonApiPath)}`)
    return res.status(500).json({ 
      error: `Python API not found at ${pythonApiPath}. The Python script should be at ${pythonScript}. Make sure python-api/main.py exists in the project root.` 
    })
  }
  
  console.log(`Using Python script: ${pythonScript}`)
  console.log(`Output directory: ${outputDir}`)

  return new Promise((resolve, reject) => {
    // Spawn Python process
    // Pass library name to Python script for folder organization
    const pythonProcess = spawn('python3', [
      pythonScript,
      '--token', token,
      '--file-key', fileKey,
      '--output-dir', outputDir,
      '--library-name', libraryName || libraryFolderName
    ], {
      cwd: pythonApiPath,
      env: {
        ...process.env,
        FIGMA_ACCESS_TOKEN: token,
        LIBRARY_NAME: libraryName || '',
        LIBRARY_ID: libraryId || ''
      }
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
      console.log(`Python stdout: ${data}`)
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
      console.error(`Python stderr: ${data}`)
    })

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process failed:')
        console.error('Exit code:', code)
        console.error('Stdout:', stdout)
        console.error('Stderr:', stderr)
        return reject(new Error(`Python process exited with code ${code}. ${stderr || stdout || 'No error message'}`))
      }

      // Check if CSV files were generated and have data
      const csvFiles = [
        'actions_by_component.csv',
        'actions_by_team.csv',
        'usages_by_component.csv',
        'usages_by_file.csv',
        'variable_actions_by_team.csv',
        'variable_actions_by_variable.csv',
        'styles_actions_by_style.csv',
        'styles_usages_by_style.csv'
      ]

      console.log(`Checking for CSV files in: ${outputDir}`)
      console.log(`Output directory exists: ${fs.existsSync(outputDir)}`)
      
      // List all files in output directory for debugging
      if (fs.existsSync(outputDir)) {
        const filesInDir = fs.readdirSync(outputDir)
        console.log(`Files found in output directory: ${filesInDir.join(', ')}`)
      }

      const generatedFiles = []
      const filesWithData = []
      let totalRows = 0

      for (const file of csvFiles) {
        const filePath = path.join(outputDir, file)
        if (fs.existsSync(filePath)) {
          generatedFiles.push(file)
          // Check if file has data (more than just header)
          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            const lines = content.trim().split('\n')
            const rowCount = lines.length - 1 // Subtract header
            if (rowCount > 0) {
              filesWithData.push(file)
              totalRows += rowCount
            }
          } catch (err) {
            console.error(`Error reading ${file}:`, err)
          }
        } else {
          console.log(`File not found: ${filePath}`)
        }
      }

      if (generatedFiles.length === 0) {
        console.error(`Python stdout: ${stdout}`)
        console.error(`Python stderr: ${stderr}`)
        return reject(new Error(`No CSV files were generated in ${outputDir}. Check Python script output above.`))
      }

      const message = filesWithData.length === 0
        ? `Generated ${generatedFiles.length} CSV files, but all are empty (headers only). Library Analytics API may not be available. Check Python output for details.`
        : `Generated ${generatedFiles.length} CSV files with ${totalRows} total data rows`

      resolve({
        success: true,
        files: generatedFiles,
        filesWithData: filesWithData.length,
        totalRows: totalRows,
        message: message,
        warning: filesWithData.length === 0 ? 'All CSV files are empty. Library Analytics API may require Enterprise plan.' : null
      })
    })

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
  })
    .then(result => {
      console.log('CSV generation successful:', result)
      res.json(result)
    })
    .catch(error => {
      console.error('CSV generation error:', error)
      console.error('Error stack:', error.stack)
      res.status(500).json({ 
        error: error.message || 'Failed to generate CSV files',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    })
})

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

/**
 * Save config.json (for edit mode)
 */
app.post('/api/config', async (req, res) => {
  try {
    const config = req.body
    const configPath = path.join(__dirname, '../config.json')
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    
    res.json({ success: true, message: 'Config saved successfully' })
  } catch (error) {
    console.error('Config save error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 CSV generation endpoint: POST http://localhost:${PORT}/api/generate-csv`)
})
