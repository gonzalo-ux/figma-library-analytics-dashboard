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
  
  let themePreset = 'blue'
  
  if (localStoragePrefs) {
    try {
      const prefs = JSON.parse(localStoragePrefs)
      themePreset = prefs?.theme?.preset || 'blue'
    } catch (e) {
      // If parsing fails, try config.json
      const config = loadConfigSync()
      themePreset = config?.theme?.preset || 'blue'
    }
  } else {
    // Fallback to config.json
    const config = loadConfigSync()
    themePreset = config?.theme?.preset || 'blue'
  }
  
  loadTheme(themePreset)
} catch (error) {
  // Fallback to blue theme on error
  loadTheme('blue')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
