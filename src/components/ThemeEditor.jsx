import React, { useEffect } from 'react'
import { useEditMode } from './EditModeProvider'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { loadTheme } from '../lib/themeLoader'
import { initTypography } from '../lib/typographyLoader'

const BASE_COLORS = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'stone', label: 'Stone' },
  { value: 'slate', label: 'Slate' },
  { value: 'zinc', label: 'Zinc' },
  { value: 'gray', label: 'Gray' }
]

const THEMES = [
  { value: '', label: 'None' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' }
]

export function ThemeEditor() {
  const { preferences, updatePreference } = useEditMode()

  // Support both old preset format and new baseColor/theme format
  const getBaseColor = () => {
    if (preferences?.theme?.baseColor) {
      return preferences.theme.baseColor
    }
    // Backward compatibility: check old preset
    const preset = preferences?.theme?.preset
    if (preset === 'stone') return 'stone'
    if (preset === 'slate') return 'slate'
    if (preset === 'zinc') return 'zinc'
    if (preset === 'gray') return 'gray'
    return 'neutral'
  }

  const getTheme = () => {
    if (preferences?.theme?.theme !== undefined) {
      return preferences.theme.theme || ''
    }
    // Backward compatibility: check old preset
    const preset = preferences?.theme?.preset
    if (preset === 'blue') return 'blue'
    if (preset === 'green') return 'green'
    if (preset === 'orange') return 'orange'
    return ''
  }

  const currentBaseColor = getBaseColor()
  const currentTheme = getTheme()

  useEffect(() => {
    // Apply theme when preferences change
    const baseColor = getBaseColor()
    const theme = getTheme()
    loadTheme({ baseColor, theme: theme || null })
    
    // Apply typography when preferences change
    if (preferences?.theme?.typography) {
      initTypography(preferences)
    }
  }, [preferences?.theme?.baseColor, preferences?.theme?.theme, preferences?.theme?.preset, preferences?.theme?.typography])

  const handleBaseColorChange = async (value) => {
    await updatePreference('theme.baseColor', value)
    loadTheme({ baseColor: value, theme: currentTheme || null })
  }

  const handleThemeChange = async (value) => {
    const themeValue = value === '' ? null : value
    await updatePreference('theme.theme', themeValue)
    loadTheme({ baseColor: currentBaseColor, theme: themeValue })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>Choose a base color and optional theme accent</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base-color">Base Color</Label>
            <select
              id="base-color"
              value={currentBaseColor}
              onChange={(e) => handleBaseColorChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {BASE_COLORS.map((base) => (
                <option key={base.value} value={base.value}>
                  {base.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-accent">Theme Accent</Label>
            <select
              id="theme-accent"
              value={currentTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {THEMES.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Theme accent overrides some colors from the base color
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
