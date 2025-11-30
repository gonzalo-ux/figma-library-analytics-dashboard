import React, { createContext, useContext, useState } from "react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

const TabsContext = createContext({
  value: "",
  onValueChange: () => {},
})

const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || "")
  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = onValueChange || setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ className, children }) => {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

const TabsTrigger = ({ value, className, children }) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext)
  const isSelected = selectedValue === value

  return (
    <Button
      variant={isSelected ? "default" : "ghost"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected && "bg-background text-foreground shadow-sm",
        className
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </Button>
  )
}

const TabsContent = ({ value, className, children }) => {
  const { value: selectedValue } = useContext(TabsContext)
  
  if (selectedValue !== value) {
    return null
  }

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

