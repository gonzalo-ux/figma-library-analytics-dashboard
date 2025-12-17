/**
 * Loads a theme preset and applies it to the document using CSS classes
 * Only blue and green themes are supported. Dark mode is controlled by the .dark class.
 */
export function loadTheme(presetName) {
  if (presetName === 'custom') {
    // Custom theme is handled separately
    return
  }

  // Remove all theme classes first (but keep .dark class as it's controlled by header toggle)
  document.documentElement.classList.remove('theme-blue', 'theme-green')

  // Apply theme class based on preset
  // Note: 'default' and 'dark' are no longer valid - default to 'blue'
  if (presetName === 'blue' || presetName === 'default' || presetName === 'dark') {
    document.documentElement.classList.add('theme-blue')
  } else if (presetName === 'green') {
    document.documentElement.classList.add('theme-green')
  } else {
    // Fallback to blue if unknown theme
    document.documentElement.classList.add('theme-blue')
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
