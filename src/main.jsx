import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadTheme } from './lib/themeLoader'
import { loadConfigSync } from './lib/config'

// Initialize theme and dark mode immediately before React renders
// This ensures theme class and dark mode are applied before any components check for them
try {
  // Initialize dark mode first (before theme) to prevent flash
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      // Check system preference if no saved preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        document.documentElement.classList.add("dark")
      }
    }
  }

  // Try to get preferences from localStorage first
  const localStoragePrefs = typeof window !== 'undefined' 
    ? localStorage.getItem('appPreferences')
    : null
  
  let themeConfig = { baseColor: 'neutral', theme: 'blue' }
  
  if (localStoragePrefs) {
    try {
      const prefs = JSON.parse(localStoragePrefs)
      // Support new structure
      if (prefs?.theme?.baseColor || prefs?.theme?.theme !== undefined) {
        themeConfig = {
          baseColor: prefs.theme.baseColor || 'neutral',
          theme: prefs.theme.theme || null
        }
      } else if (prefs?.theme?.preset) {
        // Backward compatibility: convert old preset to new structure
        const preset = prefs.theme.preset
        if (preset === 'stone') {
          themeConfig = { baseColor: 'stone', theme: null }
        } else if (preset === 'blue') {
          themeConfig = { baseColor: 'neutral', theme: 'blue' }
        } else if (preset === 'green') {
          themeConfig = { baseColor: 'neutral', theme: 'green' }
        } else {
          themeConfig = { baseColor: 'neutral', theme: null }
        }
      }
    } catch (e) {
      // If parsing fails, try config.json
      const config = loadConfigSync()
      if (config?.theme?.baseColor || config?.theme?.theme !== undefined) {
        themeConfig = {
          baseColor: config.theme.baseColor || 'neutral',
          theme: config.theme.theme || null
        }
      } else if (config?.theme?.preset) {
        const preset = config.theme.preset
        if (preset === 'stone') {
          themeConfig = { baseColor: 'stone', theme: null }
        } else if (preset === 'blue') {
          themeConfig = { baseColor: 'neutral', theme: 'blue' }
        } else if (preset === 'green') {
          themeConfig = { baseColor: 'neutral', theme: 'green' }
        }
      }
    }
  } else {
    // Fallback to config.json
    const config = loadConfigSync()
    if (config?.theme?.baseColor || config?.theme?.theme !== undefined) {
      themeConfig = {
        baseColor: config.theme.baseColor || 'neutral',
        theme: config.theme.theme || null
      }
    } else if (config?.theme?.preset) {
      const preset = config.theme.preset
      if (preset === 'stone') {
        themeConfig = { baseColor: 'stone', theme: null }
      } else if (preset === 'blue') {
        themeConfig = { baseColor: 'neutral', theme: 'blue' }
      } else if (preset === 'green') {
        themeConfig = { baseColor: 'neutral', theme: 'green' }
      }
    }
  }
  
  loadTheme(themeConfig)
} catch (error) {
  // Fallback to neutral base with blue theme on error
  loadTheme({ baseColor: 'neutral', theme: 'blue' })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
