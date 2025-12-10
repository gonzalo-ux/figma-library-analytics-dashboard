import defaultTheme from '../themes/default.json'
import darkTheme from '../themes/dark.json'
import blueTheme from '../themes/blue.json'
import greenTheme from '../themes/green.json'

const THEMES = {
  default: defaultTheme,
  dark: darkTheme,
  blue: blueTheme,
  green: greenTheme
}

/**
 * Loads a theme preset and applies it to the document
 */
export function loadTheme(presetName) {
  if (presetName === 'custom') {
    // Custom theme is handled separately
    return
  }

  const theme = THEMES[presetName] || THEMES.default

  // Apply theme colors to document root
  Object.entries(theme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })

  // Apply theme class if needed
  if (presetName === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  if (presetName === 'blue') {
    document.documentElement.classList.add('theme-blue')
  } else {
    document.documentElement.classList.remove('theme-blue')
  }

  if (presetName === 'green') {
    document.documentElement.classList.add('theme-green')
  } else {
    document.documentElement.classList.remove('theme-green')
  }
}

/**
 * Gets theme colors for a preset
 */
export function getThemeColors(presetName) {
  if (presetName === 'custom') {
    return null
  }
  return THEMES[presetName]?.colors || THEMES.default.colors
}

/**
 * Applies custom CSS theme
 */
export function applyCustomTheme(css) {
  // Remove existing custom style tag if any
  const existingStyle = document.getElementById('custom-theme-style')
  if (existingStyle) {
    existingStyle.remove()
  }

  if (css && css.trim()) {
    // Create new style tag with custom CSS
    const style = document.createElement('style')
    style.id = 'custom-theme-style'
    style.textContent = css
    document.head.appendChild(style)
  }
}
