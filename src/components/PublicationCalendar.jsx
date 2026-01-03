import React, { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useTheme } from "../lib/useTheme"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  RadialBarChart,
  RadialBar,
  LabelList,
} from "recharts"
import { ChartContainer as ShadcnChartContainer, ChartTooltipContent } from "./ui/chart-container"
import { CHART_COLORS } from "../lib/chartColors"

/**
 * GitHub-style contribution calendar for Figma library publications
 * Shows publication activity over the last year
 */
export function PublicationCalendar({ versionData, title, description }) {
  const { isDark } = useTheme()
  const [hoveredCell, setHoveredCell] = useState(null)

  // Extract available years from version data
  const availableYears = useMemo(() => {
    if (!versionData || versionData.length === 0) return []

    const years = new Set()
    versionData.forEach((version) => {
      if (version.created_at) {
        const year = new Date(version.created_at).getFullYear()
        years.add(year)
      }
    })

    return Array.from(years).sort((a, b) => b - a) // Sort descending (most recent first)
  }, [versionData])

  // Default to current year if it has data, otherwise use the most recent year with data
  const defaultYear = useMemo(() => {
    const currentYear = new Date().getFullYear()
    if (availableYears.includes(currentYear)) {
      return currentYear
    }
    return availableYears.length > 0 ? availableYears[0] : currentYear
  }, [availableYears])

  const [selectedYear, setSelectedYear] = useState(defaultYear)

  // Update selected year when defaultYear changes (e.g., when data loads)
  useEffect(() => {
    setSelectedYear(defaultYear)
  }, [defaultYear])

  // Process version data into daily counts
  const { dailyCounts, maxCount, weekData, monthLabels, totalPublications, topUsers, topMonths } = useMemo(() => {
    if (!versionData || versionData.length === 0) {
      return { dailyCounts: new Map(), maxCount: 0, weekData: [], monthLabels: [], topUsers: [], topMonths: [] }
    }

    // Count publications per day for the selected year
    const counts = new Map()
    versionData.forEach((version) => {
      if (!version.created_at) return

      // Parse the timestamp and convert to YYYY-MM-DD
      const date = new Date(version.created_at)
      const year = date.getFullYear()

      // Only count publications in the selected year
      if (year === selectedYear) {
        const dateKey = date.toISOString().split('T')[0]
        counts.set(dateKey, (counts.get(dateKey) || 0) + 1)
      }
    })

    // Find max count for color scaling
    const max = Math.max(...Array.from(counts.values()), 1)

    // Generate calendar for selected year (Jan 1 to Dec 31)
    // Start from January 1st of selected year (at midnight)
    const jan1 = new Date(selectedYear, 0, 1)
    jan1.setHours(0, 0, 0, 0)
    // End on December 31st of selected year (at end of day)
    const dec31 = new Date(selectedYear, 11, 31)
    dec31.setHours(23, 59, 59, 999)

    // Start from the Sunday before or on Jan 1 (GitHub style)
    const startDate = new Date(jan1)
    startDate.setHours(0, 0, 0, 0) // Ensure we're at midnight to avoid timezone issues
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    // End on the Saturday after or on Dec 31
    const endDate = new Date(dec31)
    endDate.setHours(23, 59, 59, 999) // End of day
    const endDayOfWeek = endDate.getDay()
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek))

    // Generate all days in the week range (including padding days)
    const days = []
    const currentDate = new Date(startDate)
    currentDate.setHours(12, 0, 0, 0) // Use noon to avoid timezone issues

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const dayOfWeek = currentDate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Compare dates at the same time (noon) to avoid timezone issues
      const currentDateAtNoon = new Date(currentDate)
      currentDateAtNoon.setHours(12, 0, 0, 0)
      const jan1AtNoon = new Date(jan1)
      jan1AtNoon.setHours(12, 0, 0, 0)
      const dec31AtNoon = new Date(dec31)
      dec31AtNoon.setHours(12, 0, 0, 0)
      const isInYear = currentDateAtNoon >= jan1AtNoon && currentDateAtNoon <= dec31AtNoon

      days.push({
        date: dateKey,
        count: isInYear ? (counts.get(dateKey) || 0) : null, // null means hide this cell
        dayOfWeek: dayOfWeek,
        month: currentDate.getMonth(),
        displayDate: new Date(currentDate),
        isInYear: isInYear,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }


    // Group into weeks - structure each week so week[0] = Sunday, week[1] = Monday, etc.
    // Since we start from a Sunday, we start a new week every time we encounter a Sunday
    const weeks = []
    let currentWeek = [null, null, null, null, null, null, null] // Initialize first week immediately

    // Verify first day is Sunday
    if (days.length > 0 && days[0].dayOfWeek !== 0) {
      console.error('First day is not Sunday!', days[0])
    }

    days.forEach((day, index) => {
      // If we encounter a Sunday and it's not the first day, push the previous week and start a new one
      if (day.dayOfWeek === 0 && index > 0) {
        weeks.push([...currentWeek])
        currentWeek = [null, null, null, null, null, null, null]
      }

      // Place each day in the correct position based on its dayOfWeek
      // day.dayOfWeek is 0-6 (Sunday-Saturday), which matches week array indices
      // This ensures week[0] = Sunday, week[1] = Monday, etc.
      // Verify we're not overwriting an existing day
      if (currentWeek[day.dayOfWeek] !== null) {
        console.warn('Overwriting day in week!', {
          weekIndex: weeks.length,
          dayOfWeek: day.dayOfWeek,
          existing: currentWeek[day.dayOfWeek]?.date,
          new: day.date
        })
      }
      currentWeek[day.dayOfWeek] = day
    })

    // Push the last week
    weeks.push([...currentWeek])

    // Generate month labels - show label when first day of a new month appears in a week
    const labels = []
    let lastMonth = -1

    weeks.forEach((week, weekIndex) => {
      // Find the first day in this week that is within the selected year
      const firstDayInYear = week.find(d => d && d.isInYear)
      if (firstDayInYear) {
        // Check if this is the first day of a new month
        const dayOfMonth = firstDayInYear.displayDate.getDate()
        if (firstDayInYear.month !== lastMonth && dayOfMonth <= 7) {
          labels.push({
            month: firstDayInYear.month,
            weekIndex: weekIndex,
            label: firstDayInYear.displayDate.toLocaleDateString('en-US', { month: 'short' })
          })
          lastMonth = firstDayInYear.month
        }
      }
    })

    // Count total publications in the current year
    const yearPublications = versionData.filter(version => {
      if (!version.created_at) return false
      const date = new Date(version.created_at)
      return date >= jan1 && date <= dec31
    }).length

    // Count publications per user for the selected year
    const userCounts = new Map()
    versionData.forEach((version) => {
      if (!version.created_at || !version.user) return

      const date = new Date(version.created_at)
      const year = date.getFullYear()

      if (year === selectedYear) {
        const userId = version.user.id || version.user.handle
        const userName = version.user.handle || 'Unknown'
        userCounts.set(userId, {
          name: userName,
          count: (userCounts.get(userId)?.count || 0) + 1
        })
      }
    })

    // Get top 6 users
    const topUsers = Array.from(userCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    // Count publications per month for the selected year
    const monthCounts = new Map()
    versionData.forEach((version) => {
      if (!version.created_at) return

      const date = new Date(version.created_at)
      const year = date.getFullYear()

      if (year === selectedYear) {
        const monthKey = date.getMonth() // 0-11
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        monthCounts.set(monthKey, {
          month: monthKey,
          name: monthName,
          count: (monthCounts.get(monthKey)?.count || 0) + 1
        })
      }
    })

    // Get top 5 months
    const topMonths = Array.from(monthCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(month => ({
        name: month.name,
        value: month.count,
        publications: month.count // For tooltip
      }))

    return {
      dailyCounts: counts,
      maxCount: max,
      weekData: weeks,
      monthLabels: labels,
      totalPublications: yearPublications, // Total for the selected year
      topUsers: topUsers, // Top 6 users for the selected year
      topMonths: topMonths, // Top 5 months for the selected year
    }
  }, [versionData, selectedYear])

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
        <div className="relative">
          <div className="flex items-start gap-4 overflow-x-auto">
            {/* Calendar section */}
            <div className="flex-shrink-0 min-w-0">
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
              <div className="flex gap-[3px] mt-4 overflow-hidden">
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] mr-2 text-[11px] text-muted-foreground flex-shrink-0">
                  <div style={{ height: '12px' }}></div>
                  <div style={{ height: '12px' }}>{dayLabels[0]}</div>
                  <div style={{ height: '12px' }}></div>
                  <div style={{ height: '12px' }}>{dayLabels[1]}</div>
                  <div style={{ height: '12px' }}></div>
                  <div style={{ height: '12px' }}>{dayLabels[2]}</div>
                  <div style={{ height: '12px' }}></div>
                </div>

                {/* Weeks */}
                <div className="flex gap-[3px] overflow-hidden">
                  {weekData.map((week, weekIndex) => (
                    <div key={`week-${weekIndex}`} className="flex flex-col gap-[3px]">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                        // week[0] = Sunday, week[1] = Monday, etc.
                        const day = week[dayOfWeek]

                        // Render empty placeholder for days outside the year to maintain grid structure
                        // This ensures visible days appear in the correct rows
                        if (!day || !day.isInYear) {
                          return (
                            <div
                              key={`empty-${weekIndex}-${dayOfWeek}`}
                              style={{
                                width: '12px',
                                height: '12px',
                                visibility: 'hidden', // Hide but maintain layout space
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
              <div className="mt-3 flex items-start justify-between" style={{ minHeight: '44px' }}>
                <div className="flex-1">
                  {/* Show total publications */}
                  <div className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">{totalPublications}</span> publications in {selectedYear}
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

                {/* Legend aligned to the right, top-aligned with publication counter */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            </div>

            {/* Year selector - positioned to the right, aligned with calendar top */}
            {availableYears.length > 0 && (
              <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`
                      text-xs px-2 py-1 rounded transition-colors
                      ${selectedYear === year
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }
                    `}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Publications Donut Chart - below calendar, counter, and legend */}
        {topUsers.length > 0 && (
          <div className="">

            <div className="flex items-top gap-4">

              {/* User labels - left side */}
              <div className="flex flex-col gap-2 min-w-[200px]">
                <div className="text-sm font-medium text-foreground mb-2">
                  Top Contributors
                </div>
                {topUsers.map((user, index) => (
                  <div key={user.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-foreground flex-1 truncate">
                      {user.name}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {user.count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Donut Chart - middle */}
              <div className="flex-0 flex justify-center">
                <div className="relative" style={{ height: '280px', width: '280px', minWidth: '280px' }}>
                  <ShadcnChartContainer
                    config={{ value: { label: "Publications", color: "var(--chart-themed-1)" } }}
                    className="h-full w-full"
                    style={{ minWidth: '280px', minHeight: '280px' }}
                  >
                    <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                      <PieChart>
                        <Pie
                          data={topUsers}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          stroke="transparent"
                          strokeWidth={0}
                        >
                          {topUsers.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={<ChartTooltipContent indicator="dot" />}
                          cursor={{ fill: "transparent" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ShadcnChartContainer>
                  {/* Center text overlay showing total publications */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-2xl font-bold text-foreground">
                      {totalPublications}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      publications
                    </div>
                  </div>
                </div>
              </div>

              {/* Radial Chart - right side */}
              {topMonths.length > 0 && (
                <div className="flex-0 flex justify-center">
                  <div className="relative" style={{ height: '280px', width: '240px', minWidth: '240px' }}>
                    <div className="text-sm font-medium text-foreground text-center">
                      Top Months
                    </div>
                    <ShadcnChartContainer
                      config={{ value: { label: "Publications", color: "var(--chart-themed-1)" } }}
                      className="h-[240px] w-[240px]"
                      style={{ minWidth: '240px', minHeight: '240px', width: '240px', height: '240px' }}
                    >
                      <ResponsiveContainer width={240} height={240}>
                        <RadialBarChart
                          data={topMonths}
                          innerRadius="30%"
                          outerRadius="90%"
                          startAngle={90}
                          endAngle={-270}
                        >
                          <RadialBar
                            dataKey="value"
                            nameKey="name"
                            minAngle={15}
                            background={{ fill: "var(--muted)" }}
                          >
                            {topMonths.map((entry, index) => (
                              <Cell
                                key={`cell-month-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                            <LabelList
                              dataKey="name"
                              position="insideStart"
                              fill="hsl(var(--foreground))"
                              fontSize={13}
                              fontWeight={600}
                            />
                          </RadialBar>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length > 0) {
                                const data = payload[0].payload
                                return (
                                  <div className="rounded-lg border bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/60 p-2 shadow-md">
                                    <div className="font-medium text-popover-foreground">{data.name}</div>
                                    <div className="text-sm text-muted-foreground mt-0.5">
                                      <span className="font-medium text-popover-foreground">{data.value}</span> publications
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                            cursor={{ fill: "transparent" }}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </ShadcnChartContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

