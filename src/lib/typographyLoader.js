/**
 * Typography loader for Google Fonts
 * Dynamically loads fonts based on configuration
 */

const GOOGLE_FONTS_API = 'https://fonts.googleapis.com/css2'

/**
 * Loads a Google Font and applies it to the document
 */
export function loadTypography(fontFamily, fontWeights = '300;400;500;600;700') {
  // Remove spaces and format font family name for URL
  const fontName = fontFamily.replace(/\s+/g, '+')
  
  // Create Google Fonts URL
  const fontUrl = `${GOOGLE_FONTS_API}?family=${fontName}:wght@${fontWeights}&display=swap`
  
  // Find or create the font link element
  let fontLink = document.getElementById('google-font-link')
  
  if (!fontLink) {
    // Create new link element if it doesn't exist
    fontLink = document.createElement('link')
    fontLink.id = 'google-font-link'
    fontLink.rel = 'stylesheet'
    document.head.appendChild(fontLink)
  }
  
  // Update the href to load the new font
  fontLink.href = fontUrl
  
  // Apply font family to CSS variable for Tailwind to use
  // Store with quotes for font names with spaces
  const fontValue = fontFamily.includes(' ') ? `'${fontFamily}'` : fontFamily
  document.documentElement.style.setProperty('--font-family', fontValue)
}

/**
 * Gets available Google Fonts (common ones)
 */
export function getAvailableFonts() {
  return [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' },
    { value: 'Nunito', label: 'Nunito' },
    { value: 'Raleway', label: 'Raleway' },
    { value: 'Ubuntu', label: 'Ubuntu' },
  ]
}

/**
 * Initialize typography from config
 * Called on app startup to load default or configured font
 */
export function initTypography(config) {
  // Only load if we're in the browser
  if (typeof window === 'undefined') return
  
  const typography = config?.theme?.typography || {}
  const fontFamily = typography.fontFamily || 'Inter'
  const fontWeights = typography.fontWeights || '300;400;500;600;700'
  
  // Load the font (defaults to Inter if no config)
  loadTypography(fontFamily, fontWeights)
}
