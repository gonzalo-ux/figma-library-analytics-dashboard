import { loadConfigSync, saveConfig, getConfigValue, setConfigValue } from './config'

/**
 * Preferences management system
 * Handles both localStorage (runtime) and config.json (persistence)
 */

const PREFERENCES_KEY = 'appPreferences'

/**
 * Get all preferences
 */
export function getPreferences() {
  const config = loadConfigSync()
  const localStoragePrefs = typeof window !== 'undefined' 
    ? localStorage.getItem(PREFERENCES_KEY) 
    : null
    
  let prefs = {}
  
  if (localStoragePrefs) {
    try {
      prefs = JSON.parse(localStoragePrefs)
    } catch (e) {
      console.warn('Failed to parse preferences from localStorage', e)
    }
  }
  
  // Merge config with localStorage preferences (localStorage takes precedence for runtime)
  return { ...config, ...prefs }
}

/**
 * Save preferences to both localStorage and config
 */
export async function savePreferences(preferences) {
  // Save to localStorage for immediate access
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error)
    }
  }
  
  // Also save to config.json structure
  await saveConfig(preferences)
  
  return preferences
}

/**
 * Get a specific preference value
 */
export function getPreference(key, defaultValue = null) {
  const prefs = getPreferences()
  const keys = key.split('.')
  let value = prefs
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return defaultValue
    }
  }
  
  return value !== undefined ? value : defaultValue
}

/**
 * Set a specific preference value
 */
export async function setPreference(key, value) {
  const prefs = getPreferences()
  const keys = key.split('.')
  const lastKey = keys.pop()
  let target = prefs
  
  for (const k of keys) {
    if (!target[k] || typeof target[k] !== 'object') {
      target[k] = {}
    }
    target = target[k]
  }
  
  target[lastKey] = value
  return savePreferences(prefs)
}

/**
 * Reset preferences to defaults
 */
export async function resetPreferences() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PREFERENCES_KEY)
    localStorage.removeItem('appConfig')
  }
  
  // Reload will use defaults
  return getPreferences()
}

/**
 * Export preferences as JSON (for backup/sharing)
 */
export function exportPreferences() {
  return JSON.stringify(getPreferences(), null, 2)
}

/**
 * Import preferences from JSON
 */
export async function importPreferences(jsonString) {
  try {
    const prefs = JSON.parse(jsonString)
    return savePreferences(prefs)
  } catch (error) {
    throw new Error('Invalid preferences JSON: ' + error.message)
  }
}
