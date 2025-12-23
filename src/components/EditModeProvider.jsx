import React, { createContext, useContext, useState, useEffect } from 'react'
import { getPreferences, savePreferences } from '../lib/preferences'
import { initTypography } from '../lib/typographyLoader'
import { loadTheme } from '../lib/themeLoader'

const EditModeContext = createContext()

export function EditModeProvider({ children }) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [preferences, setPreferences] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load preferences on mount
    const loadPrefs = async () => {
      try {
        const prefs = getPreferences()
        setPreferences(prefs)
        // Initialize typography
        initTypography(prefs)
        // Load theme - support both new structure and old preset format
        if (prefs?.theme?.baseColor || prefs?.theme?.theme !== undefined) {
          loadTheme({
            baseColor: prefs.theme.baseColor || 'neutral',
            theme: prefs.theme.theme || null
          })
        } else if (prefs?.theme?.preset) {
          // Backward compatibility: convert old preset to new structure
          loadTheme(prefs.theme.preset)
        } else {
          // Default to neutral base with blue theme if nothing is set
          loadTheme({ baseColor: 'neutral', theme: 'blue' })
        }
      } catch (error) {
        console.error('Failed to load preferences:', error)
        // Fallback to neutral base with blue theme on error
        loadTheme({ baseColor: 'neutral', theme: 'blue' })
      } finally {
        setIsLoading(false)
      }
    }
    loadPrefs()
  }, [])

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev)
  }

  const updatePreference = async (key, value) => {
    const newPrefs = { ...preferences }
    const keys = key.split('.')
    const lastKey = keys.pop()
    let target = newPrefs

    for (const k of keys) {
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {}
      }
      target = target[k]
    }

    target[lastKey] = value
    setPreferences(newPrefs)
    await savePreferences(newPrefs)
    
    // Update typography if typography preference changed
    if (key.startsWith('theme.typography')) {
      initTypography(newPrefs)
    }
    // Update theme if theme configuration changed
    if (key === 'theme.baseColor' || key === 'theme.theme') {
      const baseColor = newPrefs?.theme?.baseColor || 'neutral'
      const theme = newPrefs?.theme?.theme || null
      loadTheme({ baseColor, theme })
    } else if (key === 'theme.preset') {
      // Backward compatibility: handle old preset format
      loadTheme(value)
    }
  }

  const saveAllPreferences = async () => {
    if (preferences) {
      await savePreferences(preferences)
    }
  }

  const value = {
    isEditMode,
    toggleEditMode,
    preferences,
    updatePreference,
    saveAllPreferences,
    isLoading
  }

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode() {
  const context = useContext(EditModeContext)
  if (!context) {
    throw new Error('useEditMode must be used within EditModeProvider')
  }
  return context
}
