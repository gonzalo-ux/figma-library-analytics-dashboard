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

export function InsertionsLineChart({ data, variableData, textStylesData, days = 90, title, description, headerActions, areas }) {
  const { isDark, themePreset } = useTheme()
  const baseGradientId = useId()
  
  // Determine which areas to show based on available data
  const activeAreas = useMemo(() => {
    const result = []
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
    // If areas prop is provided, use it instead
    return areas || result
  }, [data, variableData, textStylesData, areas])
  
  // Generate gradient IDs for each area
  const gradientIds = useMemo(() => 
    activeAreas.map((_, index) => `${baseGradientId}-${index}`),
    [baseGradientId, activeAreas.length]
  )
  
  // Grid color - use border color from theme
  const gridColor = "hsl(var(--border))"
  
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
    // Calculate date N days ago
    const today = new Date()
    const daysAgo = new Date(today)
    daysAgo.setDate(today.getDate() - days)

    // Process component data (separate components and icons)
    const componentsWeekMap = new Map()
    const iconsWeekMap = new Map()
    if (data && data.length > 0) {
      data.forEach((row) => {
        // Check if row has required columns
        if (!row.week || !row.insertions || !row.component_name) {
          return
        }

        const componentName = row.component_name || ""
        const isIcon = componentName.trim().startsWith("Icon -") || componentName.trim().toLowerCase().includes("icon -")

        // For non-icon components, only include rows with a component_set_name (not empty)
        if (!isIcon) {
          const componentSetName = row.component_set_name || ""
          if (!componentSetName.trim()) {
            return
          }
        }

        // Parse the week date
        const weekDate = new Date(row.week)
        if (isNaN(weekDate.getTime())) {
          return
        }

        // Filter by last N days
        if (weekDate >= daysAgo) {
          const weekKey = row.week
          const insertions = parseFloat(row.insertions) || 0

          if (isIcon) {
            // Add to icons map
            if (iconsWeekMap.has(weekKey)) {
              iconsWeekMap.set(weekKey, iconsWeekMap.get(weekKey) + insertions)
            } else {
              iconsWeekMap.set(weekKey, insertions)
            }
          } else {
            // Add to components map
            if (componentsWeekMap.has(weekKey)) {
              componentsWeekMap.set(weekKey, componentsWeekMap.get(weekKey) + insertions)
            } else {
              componentsWeekMap.set(weekKey, insertions)
            }
          }
        }
      })
    }

    // Process variable data
    const variablesWeekMap = new Map()
    if (variableData && variableData.length > 0) {
      variableData.forEach((row) => {
        // Check if row has required columns
        if (!row.week || !row.insertions) {
          return
        }

        // Parse the week date
        const weekDate = new Date(row.week)
        if (isNaN(weekDate.getTime())) {
          return
        }

        // Filter by last N days
        if (weekDate >= daysAgo) {
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

    // Process text styles data (filter for TEXT type only)
    const textStylesWeekMap = new Map()
    if (textStylesData && textStylesData.length > 0) {
      textStylesData.forEach((row) => {
        // Check if row has required columns
        if (!row.week || !row.insertions || !row.style_type) {
          return
        }

        // Only include TEXT styles
        const styleType = (row.style_type || "").trim()
        if (styleType !== "TEXT") {
          return
        }

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
    return weeksArray.map(item => ({
      date: item.week,
      components: item.components,
      icons: item.icons,
      variables: item.variables,
      textStyles: item.textStyles,
    }))
  }, [data, variableData, textStylesData, days])

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
            tick={{ fill: "hsl(var(--card-foreground))" }}
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
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "hsl(var(--card-foreground))" }}
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

