import React, { createContext, useContext, useState, useRef, useEffect } from "react"
import { cn } from "../../lib/utils"

const PopoverContext = createContext({
  open: false,
  setOpen: () => {},
  triggerRef: null,
})

const Popover = ({ open: controlledOpen, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const triggerRef = useRef(null)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (value) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef(({ asChild, className, children, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useContext(PopoverContext)
  
  const combinedRef = (node) => {
    triggerRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      "data-popover-trigger": true,
      onClick: (e) => {
        setOpen(!open)
        children.props.onClick?.(e)
      },
      ref: combinedRef,
    })
  }

  return (
    <div
      ref={combinedRef}
      data-popover-trigger
      onClick={() => setOpen(!open)}
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef(({ 
  className, 
  align = "start", 
  side = "bottom",
  sideOffset = 4,
  alignOffset = 0,
  children,
  ...props 
}, ref) => {
  const { open, setOpen } = useContext(PopoverContext)
  const contentRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        // Check if click was on trigger
        const trigger = event.target.closest('[data-popover-trigger]')
        if (!trigger) {
          setOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 w-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        side === "bottom" && "top-full",
        side === "top" && "bottom-full",
        side === "left" && "right-full",
        side === "right" && "left-full",
        align === "start" && side === "bottom" && "left-0",
        align === "start" && side === "top" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && side === "bottom" && "right-0",
        align === "end" && side === "top" && "right-0",
        className
      )}
      style={{
        marginTop: side === "bottom" ? sideOffset : undefined,
        marginBottom: side === "top" ? sideOffset : undefined,
        marginLeft: side === "right" ? sideOffset : undefined,
        marginRight: side === "left" ? sideOffset : undefined,
        ...(alignOffset && align !== "center" && { 
          transform: `translateX(${alignOffset}px)` 
        }),
      }}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
