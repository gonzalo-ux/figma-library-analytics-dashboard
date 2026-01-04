import React, { useMemo, useId } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "./ui/chart-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useTheme } from "../lib/useTheme"

const chartConfig = {
  components: {
    label: "Components",
    color: "var(--chart-themed-6)",
  },
  icons: {
    label: "Icons",
    color: "var(--chart-themed-2)",
  },
  variables: {
    label: "Variables",
    color: "var(--chart-themed-4)",
  },
  textStyles: {
    label: "Text Styles",
    color: "var(--chart-themed-3)",
  },
}

export function InsertionsLineChart({ data, variableData, textStylesData, days = 90, title, description, headerActions, areas, pageType, dateRange, pageConfig }) {
  const { isDark, themePreset } = useTheme()
  const baseGradientId = useId()
  
  // Determine which areas to show based on page type and available data
  const activeAreas = useMemo(() => {
    // If areas prop is provided, use it instead
    if (areas) {
      return areas
    }
    
    const result = []
    
    // Based on page type, show only relevant data
    // Data is already filtered by filterDataForPage, so we just determine which area to show
    if (pageType === 'components' || pageType === 'icons') {
      // Components or icons page: show data from data prop (already filtered)
      if (data && data.length > 0) {
        // Check if the page has include filters - if so, treat as filtered content (works for any pattern)
        const hasIncludeFilters = pageConfig?.useFilters && pageConfig?.filters?.include &&
          (pageConfig.filters.include.prefix || pageConfig.filters.include.suffix || pageConfig.filters.include.contains)
        const isFilteredPage = pageType === 'icons' || hasIncludeFilters
        result.push({ dataKey: isFilteredPage ? "icons" : "components" })
      }
    } else if (pageType === 'variables') {
      // For variables page, data prop contains variable data (already filtered)
      if (data && data.length > 0) {
        result.push({ dataKey: "variables" })
      }
    } else if (pageType === 'styles') {
      // For styles page, data prop contains styles data (already filtered)
      if (data && data.length > 0) {
        result.push({ dataKey: "textStyles" })
      }
    } else {
      // Default behavior: show all available data (for backward compatibility)
      if (data && data.length > 0) {
        result.push({ dataKey: "components" })
        result.push({ dataKey: "icons" })
      }
      if (variableData && variableData.length > 0) {
        result.push({ dataKey: "variables" })
      }
      if (textStylesData && textStylesData.length > 0) {
        result.push({ dataKey: "textStyles" })
      }
    }
    
    return result
  }, [data, variableData, textStylesData, areas, pageType])
  
  // Generate gradient IDs for each area
  const gradientIds = useMemo(() => 
    activeAreas.map((_, index) => `${baseGradientId}-${index}`),
    [baseGradientId, activeAreas.length]
  )
  
  // Grid color - use border color from theme
  const gridColor = "var(--border)"
  
  // Helper to get stroke color for each area
  const getStrokeColor = (dataKey) => {
    return chartConfig[dataKey]?.color || "var(--chart-themed-4)"
  }
  
  // Helper to get themed color by index for gradients (starts at 4)
  const getGradientColor = (index) => {
    const dataKey = activeAreas[index]?.dataKey
    return chartConfig[dataKey]?.color || `var(--chart-themed-${4 + index})`
  }

  const chartData = useMemo(() => {
    // Use date range if provided, otherwise calculate from days
    let startDate, endDate
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      startDate = new Date(dateRange.startDate)
      endDate = new Date(dateRange.endDate)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Fallback to days calculation
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)
    }

    // Process component/icon data
    // Data is already filtered by filterDataForPage, so we just aggregate it by week
    const componentsWeekMap = new Map()
    const iconsWeekMap = new Map()
    if (data && data.length > 0 && (pageType === 'components' || pageType === 'icons')) {
      // Check if the page has include filters - if so, all data is already filtered to match those filters
      // This works for any naming pattern (Icons, Logos, Illustrations, etc.)
      const hasIncludeFilters = pageConfig?.useFilters && pageConfig?.filters?.include &&
        (pageConfig.filters.include.prefix || pageConfig.filters.include.suffix || pageConfig.filters.include.contains)
      
      // If page type is 'icons' OR page has include filters, treat all data as filtered content
      // This allows the chart to work with any filter pattern, not just "Icon -"
      const isFilteredPage = pageType === 'icons' || hasIncludeFilters
      
      data.forEach((row) => {
        // Check if row has required columns (same as components page)
        if (!row.week || row.insertions === undefined || row.insertions === null || !row.component_name) {
          return
        }

        // Parse the week date
        const weekDate = new Date(row.week)
        if (isNaN(weekDate.getTime())) {
          return
        }

        // Filter by date range
        if (weekDate >= startDate && weekDate <= endDate) {
          const weekKey = row.week
          const insertions = parseFloat(row.insertions) || 0

          if (isFilteredPage) {
            // For filtered pages (icons, logos, illustrations, etc.): aggregate all insertions by week
            // Works exactly like components page but for any filtered content - just sum all insertions per week
            // Filtered items may not have component_set_name, so we aggregate all insertions together by week
            if (iconsWeekMap.has(weekKey)) {
              iconsWeekMap.set(weekKey, iconsWeekMap.get(weekKey) + insertions)
            } else {
              iconsWeekMap.set(weekKey, insertions)
            }
          } else {
            // For components page: exclude icons and aggregate by week
            const componentName = row.component_name || ""
            const isIcon = componentName.trim().startsWith("Icon -") || componentName.trim().toLowerCase().includes("icon -")
            
            if (!isIcon) {
              // Only include rows with component_set_name (same logic as components page)
              const componentSetName = row.component_set_name || ""
              if (componentSetName.trim()) {
                // Add to components map (excluding icons)
                if (componentsWeekMap.has(weekKey)) {
                  componentsWeekMap.set(weekKey, componentsWeekMap.get(weekKey) + insertions)
                } else {
                  componentsWeekMap.set(weekKey, insertions)
                }
              }
            }
          }
        }
      })
    }

    // Process variable data
    // Data is already filtered by filterDataForPage
    const variablesWeekMap = new Map()
    // For variables page, use data prop; for components page, use variableData prop
    const varsData = pageType === 'variables' ? data : variableData
    if (varsData && varsData.length > 0 && (pageType === 'variables' || !pageType)) {
      varsData.forEach((row) => {
        // Check if row has required columns
        if (!row.week || row.insertions === undefined || row.insertions === null) {
          return
        }

        // Parse the week date
        const weekDate = new Date(row.week)
        if (isNaN(weekDate.getTime())) {
          return
        }

        // Filter by date range
        if (weekDate >= startDate && weekDate <= endDate) {
          const weekKey = row.week
          const insertions = parseFloat(row.insertions) || 0

          if (variablesWeekMap.has(weekKey)) {
            variablesWeekMap.set(weekKey, variablesWeekMap.get(weekKey) + insertions)
          } else {
            variablesWeekMap.set(weekKey, insertions)
          }
        }
      })
    }

    // Process text styles data
    // Data is already filtered by filterDataForPage
    const textStylesWeekMap = new Map()
    // For styles page, use data prop; for components page, use textStylesData prop
    const stylesDataToUse = pageType === 'styles' ? data : textStylesData
    if (stylesDataToUse && stylesDataToUse.length > 0 && (pageType === 'styles' || !pageType)) {
      stylesDataToUse.forEach((row) => {
        // Check if row has required columns
        if (!row.week || row.insertions === undefined || row.insertions === null) {
          return
        }

        // For components page, only include TEXT styles; for styles page, include all (already filtered)
        if (pageType === 'styles' || (row.style_type && (row.style_type || "").trim() === "TEXT")) {
          // Parse the week date
          const weekDate = new Date(row.week)
          if (isNaN(weekDate.getTime())) {
            return
          }

          // Filter by last N days
          if (weekDate >= daysAgo) {
            const weekKey = row.week
            const insertions = parseFloat(row.insertions) || 0

            if (textStylesWeekMap.has(weekKey)) {
              textStylesWeekMap.set(weekKey, textStylesWeekMap.get(weekKey) + insertions)
            } else {
              textStylesWeekMap.set(weekKey, insertions)
            }
          }
        }
      })
    }

    // Get all unique weeks from all maps
    const allWeeks = new Set([
      ...Array.from(componentsWeekMap.keys()),
      ...Array.from(iconsWeekMap.keys()),
      ...Array.from(variablesWeekMap.keys()),
      ...Array.from(textStylesWeekMap.keys())
    ])

    // Convert to array and sort by week (ascending)
    const weeksArray = Array.from(allWeeks)
      .map(week => ({
        week,
        components: componentsWeekMap.get(week) || 0,
        icons: iconsWeekMap.get(week) || 0,
        variables: variablesWeekMap.get(week) || 0,
      textStyles: textStylesWeekMap.get(week) || 0,
    }))
      .sort((a, b) => new Date(a.week) - new Date(b.week))

    // Convert to Recharts format - use ISO date string for proper formatting
    const result = weeksArray.map(item => ({
      date: item.week,
      components: item.components,
      icons: item.icons,
      variables: item.variables,
      textStyles: item.textStyles,
    }))
    
    return result
  }, [data, variableData, textStylesData, days, pageType, dateRange, pageConfig])

  const chartContent = !chartData || chartData.length === 0 ? (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        No data found for the last {days} days
      </div>
  ) : (
    <ChartContainer 
      config={chartConfig} 
      className="h-[300px] w-full min-w-0" 
      key={`chart-${isDark}-${themePreset}`}
      style={{ minWidth: 0, minHeight: 300 }}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <AreaChart data={chartData} key={`area-chart-${isDark}-${themePreset}`}>
          <defs>
            {activeAreas.map((area, index) => {
              const gradientColor = getGradientColor(index)
              return (
                <linearGradient key={gradientIds[index]} id={gradientIds[index]} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={gradientColor}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={gradientColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              )
            })}
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={gridColor}
            strokeWidth={1}
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            tickMargin={8}
            minTickGap={32}
            tick={{ fill: "var(--muted-foreground)" }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            tickMargin={8}
            tick={{ fill: "var(--muted-foreground)" }}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}k`
              }
              return value.toString()
            }}
          />
          <RechartsTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
                indicator="dot"
              />
            }
          />
          {activeAreas.map((area, index) => (
            <Area
              key={area.dataKey || `area-${index}`}
              dataKey={area.dataKey}
              type="natural"
              fill={`url(#${gradientIds[index]})`}
              stroke={getStrokeColor(area.dataKey)}
              strokeWidth={2}
              fillOpacity={1}
            />
          ))}
          <RechartsLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )

  return (
    <Card>
      {(title || headerActions) && (
        <CardHeader>
          {headerActions ? (
            <div className="flex items-center justify-between">
              {title && (
                <div className="flex items-center gap-2">
                  <CardTitle>{title}</CardTitle>
                </div>
              )}
              {headerActions}
            </div>
          ) : (
            title && <CardTitle>{title}</CardTitle>
          )}
        </CardHeader>
      )}
      <CardContent>
        {chartContent}
      </CardContent>
    </Card>
  )
}

