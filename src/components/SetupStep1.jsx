import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { LibraryConfig } from './LibraryConfig'
import { PageConfig } from './PageConfig'

export function SetupStep1({ config, onNext }) {
  const [accessToken, setAccessToken] = useState(config?.figma?.accessToken || '')
  const [libraries, setLibraries] = useState(config?.figma?.libraries || [])
  const [pages, setPages] = useState(config?.pages || [])

  // Initialize with default pages if none exist
  useEffect(() => {
    if (libraries.length > 0 && pages.length === 0) {
      const defaultPages = [
        { 
          id: '1', 
          name: 'Components', 
          libraryId: libraries[0].id, 
          type: 'components',
          useFilters: false,
          filters: { 
            include: { prefix: '', suffix: '', contains: '' },
            exclude: { prefix: '', suffix: '', contains: '' } 
          }
        },
        { 
          id: '2', 
          name: 'Variables', 
          libraryId: libraries[0].id, 
          type: 'variables',
          useFilters: false,
          filters: { 
            include: { prefix: '', suffix: '', contains: '' },
            exclude: { prefix: '', suffix: '', contains: '' } 
          }
        },
        { 
          id: '3', 
          name: 'Styles', 
          libraryId: libraries[0].id, 
          type: 'styles',
          useFilters: false,
          filters: { 
            include: { prefix: '', suffix: '', contains: '' },
            exclude: { prefix: '', suffix: '', contains: '' } 
          }
        }
      ]
      setPages(defaultPages)
    }
  }, [libraries, pages.length])

  const handleNext = () => {
    if (!accessToken) {
      alert('Please provide a Figma access token')
      return
    }

    if (libraries.length === 0) {
      alert('Please add at least one library')
      return
    }

    // Validate all library URLs
    const figmaUrlPattern = /^https:\/\/(www\.)?figma\.com\/(file|design)\/[^\/\s]+(\/[^\s]*)?$/
    
    for (const library of libraries) {
      if (!library.url || !library.url.trim()) {
        alert('Please provide a URL for all libraries')
        return
      }
      
      if (!figmaUrlPattern.test(library.url.trim())) {
        alert(`Invalid Figma library URL for "${library.name || 'unnamed library'}".\n\nExpected format:\nhttps://www.figma.com/file/ABC123XYZ/Name\nor\nhttps://www.figma.com/design/ABC123XYZ/Name`)
        return
      }

      if (!library.name || !library.name.trim()) {
        alert('Please provide a name for all libraries')
        return
      }
    }

    // Validate pages
    if (pages.length === 0) {
      alert('Please add at least one page')
      return
    }

    for (const page of pages) {
      if (!page.name || !page.name.trim()) {
        alert('Please provide a name for all pages')
        return
      }
    }

    onNext({
      figma: {
        accessToken,
        libraries: libraries.map(lib => ({
          ...lib,
          url: lib.url.trim()
        }))
      },
      pages
    })
  }

  // Allow skipping if user wants to use existing CSV files (optional)
  const handleSkip = () => {
    if (confirm('Skip Figma credentials? You can still use existing CSV files, but won\'t be able to generate new data from Figma.')) {
      onNext({
        figma: {
          accessToken: '',
          libraries: []
        },
        pages: []
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Figma API Credentials</h3>
        <p className="text-sm text-muted-foreground">
          Configure your Figma access token and the libraries you want to track.
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

        <LibraryConfig 
          libraries={libraries}
          onChange={setLibraries}
        />

        <PageConfig 
          pages={pages}
          libraries={libraries}
          onChange={setPages}
        />
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
