import React, { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useTheme } from "../lib/useTheme"

/**
 * GitHub-style contribution calendar for Figma library publications
 * Shows publication activity over the last year
 */
export function PublicationCalendar({ versionData, title, description }) {
  const { isDark } = useTheme()
  const [hoveredCell, setHoveredCell] = useState(null)

  // Process version data into daily counts
  const { dailyCounts, maxCount, weekData, monthLabels, totalPublications } = useMemo(() => {
    if (!versionData || versionData.length === 0) {
      return { dailyCounts: new Map(), maxCount: 0, weekData: [], monthLabels: [] }
    }

    // Count publications per day
    const counts = new Map()
    versionData.forEach((version) => {
      if (!version.created_at) return
      
      // Parse the timestamp and convert to YYYY-MM-DD
      const date = new Date(version.created_at)
      const dateKey = date.toISOString().split('T')[0]
      
      counts.set(dateKey, (counts.get(dateKey) || 0) + 1)
    })

    // Find max count for color scaling
    const max = Math.max(...Array.from(counts.values()), 1)

    // Generate last 365 days (52 weeks + a few days)
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    
    // Start from the Sunday before one year ago
    const startDate = new Date(oneYearAgo)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    // Generate all days
    const days = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0]
      days.push({
        date: dateKey,
        count: counts.get(dateKey) || 0,
        dayOfWeek: currentDate.getDay(),
        month: currentDate.getMonth(),
        displayDate: new Date(currentDate),
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Group into weeks
    const weeks = []
    let currentWeek = []
    
    days.forEach((day, index) => {
      currentWeek.push(day)
      
      if (day.dayOfWeek === 6 || index === days.length - 1) {
        weeks.push([...currentWeek])
        currentWeek = []
      }
    })

    // Generate month labels
    const labels = []
    let lastMonth = -1
    
    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0]
      if (firstDay && firstDay.month !== lastMonth) {
        labels.push({
          month: firstDay.month,
          weekIndex: weekIndex,
          label: firstDay.displayDate.toLocaleDateString('en-US', { month: 'short' })
        })
        lastMonth = firstDay.month
      }
    })

    return {
      dailyCounts: counts,
      maxCount: max,
      weekData: weeks,
      monthLabels: labels,
      totalPublications: versionData.length, // Total for the year
    }
  }, [versionData])

  // Get color for a cell based on count
  const getCellColor = (count) => {
    if (count === 0) {
      return 'var(--accent)' // Lightest for empty days
    }
    
    // INVERTED: Less publications = darker, More publications = brighter
    // Use absolute thresholds instead of percentage for better granularity
    
    // For better color distribution, use fixed buckets
    if (count === 1) {
      return 'var(--chart-themed-9)' // Darkest for just 1
    } else if (count <= 3) {
      return 'var(--chart-themed-7)' // Very dark for 2-3
    } else if (count <= 6) {
      return 'var(--chart-themed-6)' // Dark for 4-6
    } else if (count <= 10) {
      return 'var(--chart-themed-5)' // Medium for 7-10
    } else {
      return 'var(--chart-themed-2)' // Light/bright for 11+
    }
  }

  const dayLabels = ['Mon', 'Wed', 'Fri']

  if (!versionData || versionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No version history data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="relative overflow-hidden -mx-4">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 ml-8">
            {monthLabels.map((label, index) => (
              <div
                key={`month-${index}`}
                style={{
                  position: 'absolute',
                  left: `${32 + (label.weekIndex * 15)}px`,
                  fontSize: '12px',
                }}
                className="text-muted-foreground"
              >
                {label.label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-[3px] mt-4">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-2 text-[11px] text-muted-foreground">
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px' }}>{dayLabels[0]}</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px' }}>{dayLabels[1]}</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px' }}>{dayLabels[2]}</div>
              <div style={{ height: '12px' }}></div>
            </div>

            {/* Weeks */}
            <div className="flex gap-[3px]">
              {weekData.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="flex flex-col gap-[3px]">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const day = week.find(d => d.dayOfWeek === dayIndex)
                    
                    if (!day) {
                      return (
                        <div
                          key={`empty-${dayIndex}`}
                          style={{
                            width: '12px',
                            height: '12px',
                          }}
                        />
                      )
                    }

                    return (
                      <div
                        key={day.date}
                        className="relative group"
                        onMouseEnter={() => setHoveredCell(day)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: getCellColor(day.count),
                            borderRadius: '2px',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                          }}
                          className="hover:ring-2 hover:ring-foreground/30"
                        />
                        {/* GitHub-style tooltip - smart positioning */}
                        {(() => {
                          // Determine vertical position (top/bottom)
                          const isTopRow = day.dayOfWeek <= 1
                          const verticalClass = isTopRow ? 'top-full mt-2' : 'bottom-full mb-2'
                          
                          // Determine horizontal position (left/center/right)
                          const totalWeeks = weekData.length
                          let horizontalClass = 'left-1/2 -translate-x-1/2' // center by default
                          
                          if (weekIndex < 3) {
                            // First 3 weeks - align left
                            horizontalClass = 'left-0'
                          } else if (weekIndex > totalWeeks - 4) {
                            // Last 3 weeks - align right
                            horizontalClass = 'right-0'
                          }
                          
                          return (
                            <div 
                              className={`absolute px-3 py-2 bg-popover text-popover-foreground rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100] border border-border ${verticalClass} ${horizontalClass}`}
                            >
                              <div className="font-semibold text-sm">
                                {day.count} publication{day.count !== 1 ? 's' : ''}
                              </div>
                              <div className="text-muted-foreground text-xs mt-0.5">
                                {day.displayDate.toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  month: 'long', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Info below calendar - Fixed height */}
          <div className="mt-3" style={{ minHeight: '44px' }}>
            {/* Show total publications */}
            <div className="text-sm text-muted-foreground mb-1">
              <span className="font-medium text-foreground">{totalPublications}</span> publications in the last year
            </div>
            
            {/* Show hovered cell info or placeholder */}
            <div className="text-sm text-muted-foreground" style={{ minHeight: '20px' }}>
              {hoveredCell ? (
                <>
                  <span className="font-medium text-foreground">
                    {hoveredCell.count} publication{hoveredCell.count !== 1 ? 's' : ''}
                  </span>
                  {' '}on {hoveredCell.displayDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </>
              ) : (
                <span className="opacity-0">Hover over a square</span>
              )}
            </div>
          </div>

          {/* Legend aligned to the right */}
          <div className="flex items-center justify-end gap-2 mt-1 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[3px]">
              {/* Show the actual color levels: 0, 1, 3, 6, 11 */}
              {[0, 1, 3, 6, 11].map((count, index) => (
                <div
                  key={`legend-${index}`}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: getCellColor(count),
                    borderRadius: '2px',
                  }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

