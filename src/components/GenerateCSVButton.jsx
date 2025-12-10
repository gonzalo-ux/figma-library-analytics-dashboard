import React, { useState } from 'react'
import { Button } from './ui/button'
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { loadConfigSync } from '../lib/config'

export function GenerateCSVButton() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setResult(null)

    try {
      const config = loadConfigSync()
      const { accessToken, libraryUrl } = config?.figma || {}

      console.log('Config loaded:', { 
        hasAccessToken: !!accessToken, 
        libraryUrl: libraryUrl,
        libraryUrlType: typeof libraryUrl 
      })

      if (!accessToken || !libraryUrl) {
        setResult({
          success: false,
          message: 'Figma credentials not configured. Please complete setup or add credentials in Edit Mode.'
        })
        setIsGenerating(false)
        return
      }

      // Ensure libraryUrl is a string
      const urlToSend = String(libraryUrl).trim()
      console.log('Sending request with URL:', urlToSend)

      const response = await fetch('/api/generate-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: accessToken,
          libraryUrl: urlToSend
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `Successfully generated ${data.files?.length || 0} CSV files. Refresh the page to see updated data.`
        })
        // Clear result after 5 seconds
        setTimeout(() => setResult(null), 5000)
      } else {
        // Show detailed error message from server
        let errorMsg = data.error || 'Failed to generate CSV files. Make sure the backend server is running and Python API is configured.'
        
        // Add more context for common errors
        if (errorMsg.includes('Python API not found')) {
          errorMsg += '\n\nPlease clone the figma-analytics-api repository or set PYTHON_API_PATH environment variable.'
        } else if (errorMsg.includes('Python process')) {
          errorMsg += '\n\nCheck the server console for Python error details.'
        } else if (errorMsg.includes('No CSV files were generated')) {
          errorMsg += '\n\nCheck the server console for Python script output.'
        }
        
        setResult({
          success: false,
          message: errorMsg
        })
        console.error('CSV generation error:', data)
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Failed to connect to backend server. Make sure it\'s running on port 3001.'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
          result.success
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>{result.message}</span>
        </div>
      )}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        variant="outline"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate CSV Files
          </>
        )}
      </Button>
    </div>
  )
}
