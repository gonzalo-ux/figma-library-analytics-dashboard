import React, { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Switch } from "./ui/switch"
import { EditModeToggle } from "./EditModeToggle"
import { GenerateCSVButton } from "./GenerateCSVButton"
import { useEditMode } from "./EditModeProvider"
import { loadConfigSync } from "../lib/config"

export function Header({ selectedFileLabel }) {
  const { isEditMode } = useEditMode()
  const config = loadConfigSync()
  const dashboardTitle = config?.content?.dashboardTitle || "Figma Components Library Analytics"
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check if dark mode is already set
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleDarkMode = (checked) => {
    setIsDark(checked)
    if (checked) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark")
      setIsDark(true)
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark")
      setIsDark(false)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        document.documentElement.classList.add("dark")
        setIsDark(true)
      }
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">{dashboardTitle}</h1>
          {/* <h2 className="text-muted-foreground mt-1 text-xl">
            {selectedFileLabel || "Components"}
          </h2> */}
        </div>
        <div className="flex items-center gap-3">
          <GenerateCSVButton />
          {isEditMode && <EditModeToggle />}
          <Sun className="h-4 w-4 text-muted-foreground" />
          <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}

