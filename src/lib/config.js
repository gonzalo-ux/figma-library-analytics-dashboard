import defaultConfig from '../config/default.config.json'

/**
 * Loads and merges configuration from default config and user config
 * Falls back to localStorage for runtime preferences
 */
export async function loadConfig() {
  let userConfig = {}
  
  // Try to load user config from config.json (if exists)
  try {
    // In browser, we'll fetch it; in Node.js, we'll use fs
    if (typeof window === 'undefined') {
      // Node.js environment - use fs
      const fs = await import('fs')
      const path = await import('path')
      const { fileURLToPath } = await import('url')
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      const configPath = path.join(__dirname, '../../config.json')
      if (fs.existsSync(configPath)) {
        userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      }
    } else {
      // Browser environment - try to load from localStorage first
      const savedConfig = localStorage.getItem('appConfig')
      if (savedConfig) {
        try {
          userConfig = JSON.parse(savedConfig)
        } catch (e) {
          console.warn('Failed to parse saved config from localStorage', e)
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load user config:', error)
  }

  // Deep merge default config with user config
  const merged = deepMerge(defaultConfig, userConfig)
  
  return merged
}

/**
 * Saves configuration to both localStorage and config.json
 */
export async function saveConfig(config) {
  // Save to localStorage for runtime access
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('appConfig', JSON.stringify(config))
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error)
    }

    // Save to server (config.json file) so changes are visible to all users
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })
      
      if (!response.ok) {
        console.warn('Failed to save config to server:', response.statusText)
      }
    } catch (error) {
      console.warn('Failed to save config to server:', error)
      // Continue even if server save fails - localStorage is still saved
    }
  }

  return config
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const output = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  
  return output
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Synchronous version for browser use (uses localStorage only)
 */
export function loadConfigSync() {
  let userConfig = {}
  
  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem('appConfig')
    if (savedConfig) {
      try {
        userConfig = JSON.parse(savedConfig)
      } catch (e) {
        console.warn('Failed to parse saved config from localStorage', e)
      }
    }
  }
  
  return deepMerge(defaultConfig, userConfig)
}

/**
 * Get a config value by path (e.g., 'figma.accessToken')
 */
export function getConfigValue(path, defaultValue = null) {
  const config = loadConfigSync()
  const keys = path.split('.')
  let value = config
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return defaultValue
    }
  }
  
  return value !== undefined ? value : defaultValue
}

/**
 * Set a config value by path
 */
export async function setConfigValue(path, value) {
  const config = loadConfigSync()
  const keys = path.split('.')
  const lastKey = keys.pop()
  let target = config
  
  for (const key of keys) {
    if (!target[key] || typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key]
  }
  
  target[lastKey] = value
  return saveConfig(config)
}
