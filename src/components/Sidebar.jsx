import React from "react"
import { FileText } from "lucide-react"
import { cn } from "../lib/utils"

const CSV_FILES = [
  { name: "actions_by_component.csv", label: "Components" },
  { name: "icons", label: "Icons" },
  { name: "variable_actions_by_variable.csv", label: "Variables" },
]

export function Sidebar({ selectedFile, onFileSelect }) {
  return (
    <div className="w-64 bg-card border-r border-border h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">CSV Files</h2>
        <nav className="space-y-1">
          {CSV_FILES.map((file) => (
            <button
              key={file.name}
              onClick={() => onFileSelect(file.name)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                selectedFile === file.name
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground"
              )}
            >
              <FileText className="h-4 w-4" />
              <span className="text-left">{file.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

