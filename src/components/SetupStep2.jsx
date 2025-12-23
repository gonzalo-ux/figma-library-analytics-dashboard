import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent } from './ui/card'
import { Moon, Sun } from 'lucide-react'
import { Switch } from './ui/switch'
import { loadTheme } from '../lib/themeLoader'

const BASE_COLORS = [
  { value: 'neutral', label: 'Neutral', description: 'Neutral grayscale base (default)' },
  { value: 'stone', label: 'Stone', description: 'Stone gray base' }
]

const THEMES = [
  { value: '', label: 'None', description: 'No theme accent' },
  { value: 'blue', label: 'Blue', description: 'Blue accent theme' },
  { value: 'green', label: 'Green', description: 'Green accent theme' }
]

export function SetupStep2({ config, onNext, onBack }) {
  // Support both old preset format and new baseColor/theme format
  const getInitialBaseColor = () => {
    if (config?.theme?.baseColor) {
      return config.theme.baseColor
    }
    const preset = config?.theme?.preset
    if (preset === 'stone') return 'stone'
    return 'neutral'
  }

  const getInitialTheme = () => {
    if (config?.theme?.theme !== undefined) {
      return config.theme.theme || ''
    }
    const preset = config?.theme?.preset
    if (preset === 'blue') return 'blue'
    if (preset === 'green') return 'green'
    return ''
  }

  const [selectedBaseColor, setSelectedBaseColor] = useState(getInitialBaseColor())
  const [selectedTheme, setSelectedTheme] = useState(getInitialTheme())
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check if dark mode is already set
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  useEffect(() => {
    // Apply selected base color and theme
    loadTheme({ 
      baseColor: selectedBaseColor, 
      theme: selectedTheme || null 
    })
  }, [selectedBaseColor, selectedTheme])

  const toggleDarkMode = (checked) => {
    setIsDark(checked)
    if (checked) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const handleNext = () => {
    // Save dark mode preference to localStorage for immediate effect
    // The actual theme configuration is saved in config
    onNext({
      theme: {
        baseColor: selectedBaseColor,
        theme: selectedTheme || null,
        customCss: config?.theme?.customCss || '',
        typography: config?.theme?.typography || {
          fontFamily: 'Inter',
          fontWeights: '300;400;500;600;700'
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Theme</h3>
        <p className="text-sm text-muted-foreground">
          Select a base color and optional theme accent. You can always change this later in edit mode.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium mb-3 block">Base Color</Label>
          <div className="grid grid-cols-2 gap-4">
            {BASE_COLORS.map((base) => (
              <Card
                key={base.value}
                className={`cursor-pointer transition-all ${
                  selectedBaseColor === base.value
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedBaseColor(base.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{base.label}</h4>
                      <p className="text-xs text-muted-foreground">{base.description}</p>
                    </div>
                    {selectedBaseColor === base.value && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base font-medium mb-3 block">Theme Accent</Label>
          <div className="grid grid-cols-3 gap-4">
            {THEMES.map((theme) => (
              <Card
                key={theme.value}
                className={`cursor-pointer transition-all ${
                  selectedTheme === theme.value
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedTheme(theme.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{theme.label}</h4>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    </div>
                    {selectedTheme === theme.value && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Theme accent overrides some colors from the base color
          </p>
        </div>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between p-4 border rounded-md">
          <div>
            <Label htmlFor="dark-mode" className="text-base font-medium">
              Dark Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Toggle dark mode for any theme
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              id="dark-mode"
              checked={isDark}
              onCheckedChange={toggleDarkMode}
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}
