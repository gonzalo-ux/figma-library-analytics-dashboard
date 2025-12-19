import React, { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "../lib/utils"

const QUICK_FILTERS = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 180 days", days: 180 },
]

// Format date as mm-dd-yyyy
const formatDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const year = date.getFullYear()
  return `${month}-${day}-${year}`
}

// Check if a date range matches a quick filter
const matchesQuickFilter = (startDate, endDate, days) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const expectedStart = new Date(today)
  expectedStart.setDate(today.getDate() - days)
  expectedStart.setHours(0, 0, 0, 0)
  
  const startMatch = startDate.getTime() === expectedStart.getTime()
  const endMatch = endDate.getTime() === today.getTime()
  
  return startMatch && endMatch
}

// Generate calendar days for a month
const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  const days = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }
  
  return days
}

export function DateRangePicker({ startDate, endDate, onDateChange }) {
  const [open, setOpen] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(startDate)
  const [tempEndDate, setTempEndDate] = useState(endDate)
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(() => new Date(startDate))

  // Update temp dates when props change
  useEffect(() => {
    setTempStartDate(startDate)
    setTempEndDate(endDate)
    
    // Update current month to show start date
    setCurrentMonth(new Date(startDate))
    
    // Check if current range matches any quick filter
    let matchedFilter = null
    for (const filter of QUICK_FILTERS) {
      if (matchesQuickFilter(startDate, endDate, filter.days)) {
        matchedFilter = filter.days
        break
      }
    }
    setSelectedQuickFilter(matchedFilter)
  }, [startDate, endDate])

  // Reset temp dates when popover opens
  useEffect(() => {
    if (open) {
      setTempStartDate(startDate)
      setTempEndDate(endDate)
    }
  }, [open, startDate, endDate])

  const handleQuickFilterClick = (days) => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const newStartDate = new Date(today)
    newStartDate.setDate(today.getDate() - days)
    newStartDate.setHours(0, 0, 0, 0)
    
    setTempStartDate(newStartDate)
    setTempEndDate(today)
    setSelectedQuickFilter(days)
    // Don't apply immediately - wait for Apply button
  }

  const handleDateClick = (date) => {
    if (!date) return
    
    const normalizedDate = normalizeDate(date)
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Start new selection
      setTempStartDate(normalizedDate)
      setTempEndDate(null)
      setSelectedQuickFilter(null)
    } else if (tempStartDate && !tempEndDate) {
      // Complete selection
      const normalizedStart = normalizeDate(tempStartDate)
      let finalStart, finalEnd
      if (normalizedDate < normalizedStart) {
        // If clicked date is before start, swap them
        finalStart = normalizedDate
        finalEnd = normalizedStart
      } else {
        finalStart = normalizedStart
        finalEnd = normalizedDate
      }
      
      setTempStartDate(finalStart)
      setTempEndDate(finalEnd)
      setSelectedQuickFilter(null)
      // Don't apply immediately - wait for Apply button
    }
  }

  const handleApply = () => {
    if (tempStartDate && tempEndDate) {
      onDateChange(tempStartDate, tempEndDate)
      setOpen(false)
    }
  }

  const handleCancel = () => {
    // Reset to original dates
    setTempStartDate(startDate)
    setTempEndDate(endDate)
    
    // Reset quick filter
    let matchedFilter = null
    for (const filter of QUICK_FILTERS) {
      if (matchesQuickFilter(startDate, endDate, filter.days)) {
        matchedFilter = filter.days
        break
      }
    }
    setSelectedQuickFilter(matchedFilter)
    
    setOpen(false)
  }

  const normalizeDate = (date) => {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  const isDateInRange = (date) => {
    if (!date || !tempStartDate) return false
    const normalizedDate = normalizeDate(date)
    const normalizedStart = normalizeDate(tempStartDate)
    
    if (!tempEndDate) {
      return normalizedDate.getTime() === normalizedStart.getTime()
    }
    const normalizedEnd = normalizeDate(tempEndDate)
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd
  }

  const isDateSelected = (date) => {
    if (!date) return false
    const normalizedDate = normalizeDate(date)
    const normalizedStart = tempStartDate ? normalizeDate(tempStartDate) : null
    const normalizedEnd = tempEndDate ? normalizeDate(tempEndDate) : null
    
    return (
      (normalizedStart && normalizedDate.getTime() === normalizedStart.getTime()) ||
      (normalizedEnd && normalizedDate.getTime() === normalizedEnd.getTime())
    )
  }

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const calendarDays = getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth())
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getQuickFilterLabel = () => {
    if (selectedQuickFilter) {
      const filter = QUICK_FILTERS.find(f => f.days === selectedQuickFilter)
      return filter ? filter.label : null
    }
    return null
  }

  const displayRange = `${formatDate(startDate)} - ${formatDate(endDate)}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 px-3 justify-between min-w-[280px] font-normal"
        >
          <div className="flex items-center gap-2">
            {getQuickFilterLabel() && (
              <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium">
                {getQuickFilterLabel()}
              </span>
            )}
            <span className="text-sm">{displayRange}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 min-w-[420px]" align="end">
        <div className="flex flex-col">
          <div className="flex">
            {/* Quick Filters - Left Side */}
            <div className="flex flex-col gap-1 p-3 border-r min-w-[142px]">
              {QUICK_FILTERS.map((filter) => (
                <Button
                  key={filter.days}
                  variant={selectedQuickFilter === filter.days ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleQuickFilterClick(filter.days)}
                  className="justify-start text-left w-full"
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Calendar - Right Side */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => navigateMonth(-1)}
                >
                  ←
                </Button>
                <div className="font-medium text-sm">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => navigateMonth(1)}
                >
                  →
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-muted-foreground text-xs font-medium text-center h-9 flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-9" />
                  }

                  const isInRange = isDateInRange(date)
                  const isSelected = isDateSelected(date)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isPast = date < new Date() && !isToday

                  return (
                    <button
                      key={date.getTime()}
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        "h-9 w-9 rounded-md text-sm transition-colors flex items-center justify-center",
                        isSelected && "bg-primary text-primary-foreground font-semibold",
                        isInRange && !isSelected && "bg-primary/20",
                        isToday && !isSelected && "border border-primary",
                        isPast && !isInRange && "text-muted-foreground",
                        !isPast && !isInRange && "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Cancel and Apply Buttons */}
          <div className="flex justify-end gap-2 p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleApply}
              disabled={!tempStartDate || !tempEndDate}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
