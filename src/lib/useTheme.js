import { useEffect, useState } from "react"

/**
 * Hook to detect dark mode, base color, and theme changes
 * Returns { isDark, baseColor, theme }
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false
    return document.documentElement.classList.contains("dark")
  })

  const [baseColor, setBaseColor] = useState(() => {
    if (typeof window === "undefined") return "neutral"
    const el = document.documentElement
    if (el.classList.contains("theme-stone")) return "stone"
    return "neutral"
  })

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return null
    const el = document.documentElement
    if (el.classList.contains("theme-green")) return "green"
    if (el.classList.contains("theme-blue")) return "blue"
    return null
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
      
      const el = document.documentElement
      
      // Detect base color
      if (el.classList.contains("theme-stone")) {
        setBaseColor("stone")
      } else {
        setBaseColor("neutral")
      }
      
      // Detect theme
      if (el.classList.contains("theme-green")) {
        setTheme("green")
      } else if (el.classList.contains("theme-blue")) {
        setTheme("blue")
      } else {
        setTheme(null)
      }
    })

    // Observe changes to the classList of the document element
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  return { isDark, baseColor, theme }
}

