import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { loadTypography, getAvailableFonts } from '../lib/typographyLoader'

const PRESET_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Noto Sans', label: 'Noto Sans' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' }
]

export function SetupStep3({ config, onComplete, onBack }) {
  const [fontSource, setFontSource] = useState('preset') // 'preset' or 'custom'
  const [selectedFont, setSelectedFont] = useState(config?.theme?.typography?.fontFamily || 'Inter')
  const [customFontUrl, setCustomFontUrl] = useState('')
  const [customFontName, setCustomFontName] = useState('')
  const [customFontLoaded, setCustomFontLoaded] = useState(false)

  useEffect(() => {
    // Load default font on mount
    loadTypography(selectedFont)
  }, [selectedFont])

  const handlePresetFontChange = (fontFamily) => {
    setSelectedFont(fontFamily)
    loadTypography(fontFamily)
  }

  const handleCustomFontLoad = () => {
    if (!customFontUrl || !customFontName) {
      alert('Please provide both the Google Font URL and font name')
      return
    }

    try {
      // Remove existing custom font link if any
      const existingLink = document.getElementById('custom-google-font-link')
      if (existingLink) {
        existingLink.remove()
      }

      // Create and add the custom font link
      const link = document.createElement('link')
      link.id = 'custom-google-font-link'
      link.rel = 'stylesheet'
      link.href = customFontUrl
      document.head.appendChild(link)

      // Wait for font to load, then apply it
      link.onload = () => {
        // Apply the font using loadTypography
        loadTypography(customFontName)
        setCustomFontLoaded(true)
      }

      // Fallback: apply immediately if onload doesn't fire
      setTimeout(() => {
        loadTypography(customFontName)
        setCustomFontLoaded(true)
      }, 500)
    } catch (error) {
      alert('Failed to load custom font. Please check the URL.')
      console.error('Custom font load error:', error)
    }
  }

  const handleComplete = () => {
    // Validate that a font is selected
    if (fontSource === 'preset' && !selectedFont) {
      alert('Please select a font')
      return
    }

    if (fontSource === 'custom' && (!customFontName || !customFontLoaded)) {
      alert('Please load a custom font first')
      return
    }

    const typographyConfig = {
      fontFamily: fontSource === 'preset' ? selectedFont : customFontName,
      fontWeights: '300;400;500;600;700'
    }

    onComplete({
      theme: {
        ...config.theme,
        typography: typographyConfig
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Typography</h3>
        <p className="text-sm text-muted-foreground">
          Select a font family from Google Fonts. Default is Inter.
        </p>
      </div>

      <div className="space-y-4">
        {/* Font source selection */}
        <div className="space-y-2">
          <Label>Font Source</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="font-source"
                value="preset"
                checked={fontSource === 'preset'}
                onChange={(e) => setFontSource(e.target.value)}
                className="w-4 h-4"
              />
              <span>Preset Fonts</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="font-source"
                value="custom"
                checked={fontSource === 'custom'}
                onChange={(e) => setFontSource(e.target.value)}
                className="w-4 h-4"
              />
              <span>Custom Google Font</span>
            </label>
          </div>
        </div>

        {fontSource === 'preset' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PRESET_FONTS.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => handlePresetFontChange(font.value)}
                  className={`p-3 border rounded-md text-left transition-all ${
                    selectedFont === font.value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: `'${font.value}', sans-serif` }} className="font-medium">
                      {font.label}
                    </span>
                    {selectedFont === font.value && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="p-4 border rounded-md bg-muted/50">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className="space-y-2">
                <p style={{ fontFamily: `'${selectedFont}', sans-serif` }} className="text-2xl font-bold">
                  The quick brown fox jumps over the lazy dog
                </p>
                <p style={{ fontFamily: `'${selectedFont}', sans-serif` }} className="text-base">
                  Regular text sample - 1234567890
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-font-url">Google Fonts URL</Label>
              <input
                id="custom-font-url"
                type="url"
                value={customFontUrl}
                onChange={(e) => setCustomFontUrl(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="https://fonts.googleapis.com/css2?family=Your+Font:wght@300;400;500;600;700&display=swap"
              />
              <p className="text-xs text-muted-foreground">
                Paste the Google Fonts CSS URL here
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-font-name">Font Family Name</Label>
              <input
                id="custom-font-name"
                type="text"
                value={customFontName}
                onChange={(e) => setCustomFontName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., 'Your Font Name'"
              />
              <p className="text-xs text-muted-foreground">
                Enter the exact font family name as it appears in Google Fonts
              </p>
            </div>

            <Button
              type="button"
              onClick={handleCustomFontLoad}
              disabled={!customFontUrl || !customFontName}
              variant="outline"
            >
              {customFontLoaded ? '✓ Font Loaded' : 'Load Custom Font'}
            </Button>

            {customFontLoaded && customFontName && (
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="space-y-2">
                  <p style={{ fontFamily: `'${customFontName}', sans-serif` }} className="text-2xl font-bold">
                    The quick brown fox jumps over the lazy dog
                  </p>
                  <p style={{ fontFamily: `'${customFontName}', sans-serif` }} className="text-base">
                    Regular text sample - 1234567890
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleComplete}>Complete Setup</Button>
      </div>
    </div>
  )
}
