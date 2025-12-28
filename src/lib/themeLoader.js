/**
 * Loads a theme preset and applies it to the document using CSS classes
 * Supports base colors (neutral, stone, slate, zinc, gray) and themes (blue, green, orange) that can be combined.
 * Dark mode is controlled by the .dark class.
 * 
 * @param {string|object} presetOrConfig - Either a preset name (for backward compatibility) 
 *                                         or an object with { baseColor, theme }
 * @param {string} [presetOrConfig.baseColor] - Base color: 'neutral', 'stone', 'slate', 'zinc', or 'gray'
 * @param {string} [presetOrConfig.theme] - Theme: 'blue', 'green', or 'orange' (optional)
 */
export function loadTheme(presetOrConfig) {
  // Handle backward compatibility: if string, treat as old preset
  if (typeof presetOrConfig === 'string') {
    if (presetOrConfig === 'custom') {
      // Custom theme is handled separately
      return
    }
    
    // Map old preset names to new structure
    let baseColor = 'neutral'
    let theme = null
    
    if (presetOrConfig === 'blue' || presetOrConfig === 'default' || presetOrConfig === 'dark') {
      theme = 'blue'
    } else if (presetOrConfig === 'green') {
      theme = 'green'
    } else if (presetOrConfig === 'orange') {
      theme = 'orange'
    } else if (presetOrConfig === 'neutral') {
      // neutral base, no theme
    } else if (presetOrConfig === 'stone') {
      baseColor = 'stone'
    }
    
    presetOrConfig = { baseColor, theme }
  }
  
  const { baseColor = 'neutral', theme = null } = presetOrConfig

  // Remove all theme classes first (but keep .dark class as it's controlled by header toggle)
  document.documentElement.classList.remove(
    'theme-blue', 
    'theme-green',
    'theme-orange',
    'neutral-theme', 
    'theme-stone',
    'theme-slate',
    'theme-zinc',
    'theme-gray'
  )

  // Apply base color class
  let baseColorClass = 'neutral-theme'
  if (baseColor === 'stone') {
    baseColorClass = 'theme-stone'
  } else if (baseColor === 'slate') {
    baseColorClass = 'theme-slate'
  } else if (baseColor === 'zinc') {
    baseColorClass = 'theme-zinc'
  } else if (baseColor === 'gray') {
    baseColorClass = 'theme-gray'
  }
  document.documentElement.classList.add(baseColorClass)

  // Apply theme class if provided (theme overrides some colors of base)
  if (theme === 'blue') {
    document.documentElement.classList.add('theme-blue')
  } else if (theme === 'green') {
    document.documentElement.classList.add('theme-green')
  } else if (theme === 'orange') {
    document.documentElement.classList.add('theme-orange')
  }
  
  // Force a reflow to ensure CSS is recalculated
  document.documentElement.offsetHeight
  console.log(
    `Theme loaded: baseColor=${baseColor}, theme=${theme || 'none'}`, 
    document.documentElement.className
  )
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
