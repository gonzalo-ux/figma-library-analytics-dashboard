import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent } from './ui/card'
import { Moon, Sun } from 'lucide-react'
import { Switch } from './ui/switch'
import { loadTheme } from '../lib/themeLoader'

const THEME_PRESETS = [
  { value: 'default', label: 'Default', description: 'Clean and minimal' },
  { value: 'dark', label: 'Dark', description: 'Dark mode theme' },
  { value: 'blue', label: 'Blue', description: 'Blue accent theme' },
  { value: 'green', label: 'Green', description: 'Green accent theme' }
]

export function SetupStep2({ config, onNext, onBack }) {
  const [selectedTheme, setSelectedTheme] = useState(config?.theme?.preset || 'default')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check if dark mode is already set
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  useEffect(() => {
    // Apply selected theme
    loadTheme(selectedTheme)
  }, [selectedTheme])

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
    // The actual theme preset is saved in config
    onNext({
      theme: {
        preset: selectedTheme,
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
          Select a theme preset. You can always change this later in edit mode.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {THEME_PRESETS.map((theme) => (
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
