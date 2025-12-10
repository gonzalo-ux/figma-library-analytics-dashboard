import React, { createContext, useContext, useState, useEffect } from 'react'
import { getPreferences, savePreferences } from '../lib/preferences'
import { initTypography } from '../lib/typographyLoader'

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
      } catch (error) {
        console.error('Failed to load preferences:', error)
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
