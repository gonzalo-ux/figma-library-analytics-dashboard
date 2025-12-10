import React, { useState, useRef, useEffect } from 'react'
import { useEditMode } from './EditModeProvider'
import { Pencil } from 'lucide-react'

export function EditableText({ 
  value, 
  onChange, 
  as: Component = 'h2',
  className = '',
  placeholder = 'Enter text...',
  ...props 
}) {
  const { isEditMode } = useEditMode()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    if (isEditMode) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue !== value) {
      onChange(editValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  if (!isEditMode && !isEditing) {
    return <Component className={className} {...props}>{value}</Component>
  }

  if (isEditing) {
    return (
      <div className="relative group">
        {Component === 'h2' || Component === 'h1' || Component === 'h3' ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${className} w-full bg-transparent border-2 border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary`}
            placeholder={placeholder}
          />
        ) : (
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${className} w-full bg-transparent border-2 border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary min-h-[60px]`}
            placeholder={placeholder}
            rows={2}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative group inline-block w-full">
      <Component 
        className={`${className} cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors`}
        onClick={handleClick}
        {...props}
      >
        {value || placeholder}
      </Component>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 absolute top-0 right-0 transition-opacity" />
    </div>
  )
}
