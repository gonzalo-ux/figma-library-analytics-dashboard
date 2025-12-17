import React, { useEffect, useState } from 'react'
import { useEditMode } from './EditModeProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { loadTypography, getAvailableFonts } from '../lib/typographyLoader'

export function TypographyEditor() {
  const { preferences, updatePreference } = useEditMode()
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontWeights, setFontWeights] = useState('300;400;500;600;700')

  useEffect(() => {
    if (preferences?.theme?.typography) {
      setFontFamily(preferences.theme.typography.fontFamily || 'Inter')
      setFontWeights(preferences.theme.typography.fontWeights || '300;400;500;600;700')
    }
  }, [preferences])

  const availableFonts = getAvailableFonts()

  const handleFontChange = async (newFontFamily) => {
    setFontFamily(newFontFamily)
    await updatePreference('theme.typography.fontFamily', newFontFamily)
    loadTypography(newFontFamily, fontWeights)
  }

  const handleWeightsChange = async (newWeights) => {
    setFontWeights(newWeights)
    await updatePreference('theme.typography.fontWeights', newWeights)
    loadTypography(fontFamily, newWeights)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Typography Settings</CardTitle>
        <CardDescription>Choose a font family from Google Fonts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <select
              id="font-family"
              value={fontFamily}
              onChange={(e) => handleFontChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {availableFonts.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-weights">Font Weights</Label>
            <input
              id="font-weights"
              type="text"
              value={fontWeights}
              onChange={(e) => handleWeightsChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="300;400;500;600;700"
            />
            <p className="text-xs text-muted-foreground">
              Semicolon-separated list of font weights (e.g., 300;400;500;600;700)
            </p>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <div className="space-y-2">
              <p style={{ fontFamily: `'${fontFamily}', sans-serif` }} className="text-2xl font-bold">
                The quick brown fox jumps over the lazy dog
              </p>
              <p style={{ fontFamily: `'${fontFamily}', sans-serif` }} className="text-base">
                Regular text sample - 1234567890
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
