import React from 'react'
import { Settings } from 'lucide-react'
import { Button } from './ui/button'
import { useEditMode } from './EditModeProvider'

export function EditModeToggle() {
  const { isEditMode, toggleEditMode } = useEditMode()

  return (
    <Button
      variant={isEditMode ? 'default' : 'outline'}
      size="sm"
      onClick={toggleEditMode}
      className="gap-2"
    >
      <Settings className="h-4 w-4" />
      {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
    </Button>
  )
}
