import React from "react"
import { X } from "lucide-react"
import { useAdminMode } from "./AdminModeProvider"
import { ThemeEditor } from "./ThemeEditor"
import { TypographyEditor } from "./TypographyEditor"
import { Button } from "./ui/button"

export function AdminSidebar() {
  const { isAdminMode, toggleAdminMode } = useAdminMode()

  if (!isAdminMode) return null

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-card border-l border-border z-40 overflow-y-auto shadow-lg">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-semibold">Admin Preferences</h2>
          <p className="text-sm text-muted-foreground">Configure theme and typography</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAdminMode}
          title="Close admin mode"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <ThemeEditor />
        <TypographyEditor />
      </div>
    </div>
  )
}

