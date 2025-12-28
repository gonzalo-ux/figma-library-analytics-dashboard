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
      const { accessToken, libraries } = config?.figma || {}

      console.log('Config loaded:', { 
        hasAccessToken: !!accessToken, 
        librariesCount: libraries?.length || 0
      })

      if (!accessToken) {
        setResult({
          success: false,
          message: 'Figma access token not configured. Please complete setup or add credentials in Edit Mode.'
        })
        setIsGenerating(false)
        return
      }

      if (!libraries || libraries.length === 0) {
        setResult({
          success: false,
          message: 'No libraries configured. Please add at least one library in setup.'
        })
        setIsGenerating(false)
        return
      }

      // Generate CSV files for all libraries
      const results = []
      let hasErrors = false

      for (const library of libraries) {
        try {
          const urlToSend = String(library.url).trim()
          console.log(`Generating CSV for library: ${library.name} (${urlToSend})`)

          const response = await fetch('/api/generate-csv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token: accessToken,
              libraryUrl: urlToSend,
              libraryName: library.name,
              libraryId: library.id
            })
          })

          const data = await response.json()

          if (response.ok) {
            results.push({
              library: library.name,
              success: true,
              files: data.files?.length || 0
            })
          } else {
            hasErrors = true
            results.push({
              library: library.name,
              success: false,
              error: data.error || 'Unknown error'
            })
          }
        } catch (error) {
          hasErrors = true
          results.push({
            library: library.name,
            success: false,
            error: error.message
          })
        }
      }

      // Build result message
      const successCount = results.filter(r => r.success).length
      const totalCount = results.length
      
      if (hasErrors) {
        const failedLibraries = results.filter(r => !r.success).map(r => r.library).join(', ')
        setResult({
          success: false,
          message: `Generated CSV files for ${successCount}/${totalCount} libraries. Failed: ${failedLibraries}. Check console for details.`
        })
      } else {
        setResult({
          success: true,
          message: `Successfully generated CSV files for all ${totalCount} libraries. Refresh the page to see updated data.`
        })
        // Clear result after 5 seconds
        setTimeout(() => setResult(null), 5000)
      }

      console.log('Generation results:', results)
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
