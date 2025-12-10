import React, { useEffect } from 'react'
import { useEditMode } from './EditModeProvider'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { loadTheme } from '../lib/themeLoader'
import { initTypography } from '../lib/typographyLoader'

const THEME_PRESETS = [
  { value: 'default', label: 'Default' },
  { value: 'dark', label: 'Dark' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'custom', label: 'Custom CSS' }
]

export function ThemeEditor() {
  const { preferences, updatePreference, isEditMode } = useEditMode()

  if (!isEditMode) return null

  const currentTheme = preferences?.theme?.preset || 'default'

  useEffect(() => {
    // Apply theme when preferences change
    if (preferences?.theme?.preset) {
      loadTheme(preferences.theme.preset)
    }
    // Apply typography when preferences change
    if (preferences?.theme?.typography) {
      initTypography(preferences)
    }
  }, [preferences?.theme?.preset, preferences?.theme?.typography])

  const handleThemeChange = async (value) => {
    await updatePreference('theme.preset', value)
    loadTheme(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>Choose a theme preset or use custom CSS</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-preset">Theme Preset</Label>
            <select
              id="theme-preset"
              value={currentTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {THEME_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
