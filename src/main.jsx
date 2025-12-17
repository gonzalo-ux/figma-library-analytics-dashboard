import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadTheme } from './lib/themeLoader'
import { loadConfigSync } from './lib/config'

// Initialize theme immediately before React renders
// This ensures theme class is applied before any components check for dark mode
try {
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
