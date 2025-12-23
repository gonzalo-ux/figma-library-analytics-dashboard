/**
 * Loads a theme preset and applies it to the document using CSS classes
 * Supports neutral (default), stone, blue, and green themes. Dark mode is controlled by the .dark class.
 */
export function loadTheme(presetName) {
  if (presetName === 'custom') {
    // Custom theme is handled separately
    return
  }

  // Remove all theme classes first (but keep .dark class as it's controlled by header toggle)
  document.documentElement.classList.remove('theme-blue', 'theme-green', 'neutral-theme', 'theme-stone')

  // Apply theme class based on preset
  let themeClass = null
  if (presetName === 'blue' || presetName === 'default' || presetName === 'dark') {
    themeClass = 'theme-blue'
  } else if (presetName === 'green') {
    themeClass = 'theme-green'
  } else if (presetName === 'neutral') {
    themeClass = 'neutral-theme'
  } else if (presetName === 'stone') {
    themeClass = 'theme-stone'
  } else {
    // Fallback to neutral if unknown theme
    themeClass = 'neutral-theme'
  }
  
  if (themeClass) {
    document.documentElement.classList.add(themeClass)
    // Force a reflow to ensure CSS is recalculated
    document.documentElement.offsetHeight
    console.log(`Theme loaded: ${presetName} -> class: ${themeClass}`, document.documentElement.className)
  }
}

/**
 * Gets theme colors for a preset
 * Note: This function is deprecated. Themes are now defined in CSS classes only.
 * Use getComputedStyle to read CSS variables directly if needed.
 */
export function getThemeColors(presetName) {
  if (presetName === 'custom') {
    return null
  }
  // Return null as themes are now CSS-only
  // To get theme colors, read CSS variables from getComputedStyle(document.documentElement)
  return null
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
