import React from "react"
import { FileText } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"

const CSV_FILES = [
  { name: "actions_by_component.csv", label: "Components" },
  { name: "icons", label: "Icons" },
  { name: "variable_actions_by_variable.csv", label: "Variables" },
]

export function Sidebar({ selectedFile, onFileSelect }) {
  return (
    <div className="w-64 bg-card border-r border-border h-screen fixed left-0 top-16 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">CSV Files</h2>
        <nav className="space-y-1">
          {CSV_FILES.map((file) => (
            <Button
              key={file.name}
              onClick={() => onFileSelect(file.name)}
              variant={selectedFile === file.name ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                selectedFile === file.name ? "" : ""
              )}
            >
              <FileText className="h-4 w-4 mr-2" />
              <span>{file.label}</span>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  )
}

