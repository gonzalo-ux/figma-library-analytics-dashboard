import { useEffect, useState } from "react"

/**
 * Hook to detect dark mode and theme preset changes
 * Returns { isDark, themePreset }
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false
    return document.documentElement.classList.contains("dark")
  })

  const [themePreset, setThemePreset] = useState(() => {
    if (typeof window === "undefined") return "blue"
    const el = document.documentElement
    if (el.classList.contains("theme-green")) return "green"
    if (el.classList.contains("theme-blue")) return "blue"
    return "blue"
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
      const el = document.documentElement
      if (el.classList.contains("theme-green")) {
        setThemePreset("green")
      } else if (el.classList.contains("theme-blue")) {
        setThemePreset("blue")
      } else {
        setThemePreset("blue")
      }
    })

    // Observe changes to the classList of the document element
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  return { isDark, themePreset }
}

