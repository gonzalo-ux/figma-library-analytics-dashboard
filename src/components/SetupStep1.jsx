import React, { useState } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function SetupStep1({ config, onNext }) {
  const [accessToken, setAccessToken] = useState(config?.figma?.accessToken || '')
  const [libraryUrl, setLibraryUrl] = useState(config?.figma?.libraryUrl || '')

  const handleNext = () => {
    if (!accessToken || !libraryUrl) {
      alert('Please fill in all fields')
      return
    }

    // Validate URL format - accept both /file/ and /design/ paths, with or without www
    // Examples:
    // - https://www.figma.com/file/ABC123XYZ/Name
    // - https://figma.com/file/ABC123XYZ
    // - https://www.figma.com/design/ABC123XYZ/Name
    const trimmedUrl = libraryUrl.trim()
    const figmaUrlPattern = /^https:\/\/(www\.)?figma\.com\/(file|design)\/[^\/\s]+(\/[^\s]*)?$/
    
    if (!figmaUrlPattern.test(trimmedUrl)) {
      alert('Invalid Figma library URL. Expected format:\nhttps://www.figma.com/file/ABC123XYZ/Name\nor\nhttps://www.figma.com/design/ABC123XYZ/Name\n\nNote: Both /file/ and /design/ URLs are accepted.')
      return
    }

    onNext({
      figma: {
        accessToken,
        libraryUrl: libraryUrl.trim()
      }
    })
  }

  // Allow skipping if user wants to use existing CSV files (optional)
  const handleSkip = () => {
    if (confirm('Skip Figma credentials? You can still use existing CSV files, but won\'t be able to generate new data from Figma.')) {
      onNext({
        figma: {
          accessToken: '',
          libraryUrl: ''
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Figma API Credentials</h3>
        <p className="text-sm text-muted-foreground">
          To fetch data from your Figma library, we need your access token and library URL.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="access-token">Figma Access Token</Label>
          <input
            id="access-token"
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Enter your Figma access token"
          />
          <p className="text-xs text-muted-foreground">
            Get your token from{' '}
            <a
              href="https://www.figma.com/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Figma Account Settings
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="library-url">Figma Library URL</Label>
          <input
            id="library-url"
            type="url"
            value={libraryUrl}
            onChange={(e) => setLibraryUrl(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="https://www.figma.com/file/ABC123XYZ/Name"
          />
          <p className="text-xs text-muted-foreground">
            Copy the URL from your Figma library file. Accepts both /file/ and /design/ URLs.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip (Use Existing Data)
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}
