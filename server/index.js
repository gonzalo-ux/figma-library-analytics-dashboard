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
  const { token, libraryUrl } = req.body

  console.log('Received CSV generation request:', { 
    hasToken: !!token, 
    libraryUrl: libraryUrl,
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
  
  // Output directory for CSV files
  const outputDir = path.join(__dirname, '../public/csv')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  console.log(`Extracted file key: ${fileKey} from URL: ${cleanedUrl}`)

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
    const pythonProcess = spawn('python3', [
      pythonScript,
      '--token', token,
      '--file-key', fileKey,
      '--output-dir', outputDir
    ], {
      cwd: pythonApiPath,
      env: {
        ...process.env,
        FIGMA_ACCESS_TOKEN: token
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

      // Check if CSV files were generated
      const csvFiles = [
        'actions_by_component.csv',
        'actions_by_team.csv',
        'usages_by_component.csv',
        'usages_by_file.csv',
        'variable_actions_by_team.csv',
        'variable_actions_by_variable.csv'
      ]

      const generatedFiles = csvFiles.filter(file => 
        fs.existsSync(path.join(outputDir, file))
      )

      if (generatedFiles.length === 0) {
        return reject(new Error('No CSV files were generated. Check Python script output.'))
      }

      resolve({
        success: true,
        files: generatedFiles,
        message: `Generated ${generatedFiles.length} CSV files`
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
