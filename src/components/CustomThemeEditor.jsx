import React, { useState, useEffect } from 'react'
import { useEditMode } from './EditModeProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Label } from './ui/label'

export function CustomThemeEditor() {
  const { preferences, updatePreference, isEditMode } = useEditMode()
  const [customCss, setCustomCss] = useState('')

  useEffect(() => {
    if (preferences?.theme?.customCss) {
      setCustomCss(preferences.theme.customCss)
    }
  }, [preferences])

  if (!isEditMode || preferences?.theme?.preset !== 'custom') return null

  const handleSave = async () => {
    await updatePreference('theme.customCss', customCss)
    applyCustomTheme(customCss)
  }

  const applyCustomTheme = (css) => {
    // Remove existing custom style tag if any
    const existingStyle = document.getElementById('custom-theme-style')
    if (existingStyle) {
      existingStyle.remove()
    }

    if (css.trim()) {
      // Create new style tag with custom CSS
      const style = document.createElement('style')
      style.id = 'custom-theme-style'
      style.textContent = css
      document.head.appendChild(style)
    }
  }

  const handleChange = (value) => {
    setCustomCss(value)
    // Apply immediately for preview
    applyCustomTheme(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom CSS Theme</CardTitle>
        <CardDescription>
          Define custom CSS variables. Use the same variable names as in index.css
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-css">CSS Variables</Label>
            <textarea
              id="custom-css"
              value={customCss}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full min-h-[200px] font-mono text-sm p-3 border border-input rounded-md bg-background"
              placeholder={`:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  /* ... more variables ... */
}`}
            />
          </div>
          <Button onClick={handleSave}>Save Custom Theme</Button>
          <p className="text-xs text-muted-foreground">
            Tip: Check src/index.css for available CSS variables you can override.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
