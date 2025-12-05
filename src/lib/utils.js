import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Get CSS variable value as HSL string
 * @param {string} variableName - CSS variable name (e.g., '--primary')
 * @returns {string} HSL color string (e.g., 'hsl(222.2, 47.4%, 11.2%)')
 */
export function getCSSVariable(variableName) {
  if (typeof window === 'undefined') {
    return 'hsl(0, 0%, 0%)' // fallback for SSR
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()
  
  if (!value) {
    return 'hsl(0, 0%, 0%)' // fallback
  }
  
  // Convert HSL values to HSL string format
  const hslValues = value.split(' ').map(v => v.trim())
  if (hslValues.length === 3) {
    return `hsl(${hslValues[0]}, ${hslValues[1]}%, ${hslValues[2]}%)`
  }
  
  return value
}

/**
 * Get CSS variable value as RGB/RGBA with opacity
 * @param {string} variableName - CSS variable name (e.g., '--primary')
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
export function getCSSVariableWithOpacity(variableName, opacity = 1) {
  if (typeof window === 'undefined') {
    return `rgba(0, 0, 0, ${opacity})` // fallback for SSR
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()
  
  if (!value) {
    return `rgba(0, 0, 0, ${opacity})` // fallback
  }
  
  // Convert HSL to RGB
  const hslValues = value.split(' ').map(v => parseFloat(v.trim()))
  if (hslValues.length === 3) {
    const [h, s, l] = hslValues
    const sNorm = s / 100
    const lNorm = l / 100
    
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = lNorm - c / 2
    
    let r, g, b
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }
    
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  
  return value
}

