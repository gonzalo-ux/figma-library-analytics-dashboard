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
    color: "var(--chart-themed-4)",
  },
  variables: {
    label: "Variables",
    color: "var(--chart-themed-5)",
  },
}

export function InsertionsLineChart({ data, variableData, days = 90, title, description, headerActions, areas }) {
  const { isDark, themePreset } = useTheme()
  const baseGradientId = useId()
  
  // Determine which areas to show based on available data
  const activeAreas = useMemo(() => {
    const result = []
    if (data && data.length > 0) {
      result.push({ dataKey: "components" })
    }
    if (variableData && variableData.length > 0) {
      result.push({ dataKey: "variables" })
    }
    // If areas prop is provided, use it instead
    return areas || result
  }, [data, variableData, areas])
  
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

    // Process component data
    const componentsWeekMap = new Map()
    if (data && data.length > 0) {
      data.forEach((row) => {
        // Check if row has required columns
        if (!row.week || !row.insertions || !row.component_name) {
          return
        }

        // Skip icon components
        const componentName = row.component_name || ""
        if (componentName.trim().startsWith("Icon -") || componentName.trim().toLowerCase().includes("icon -")) {
          return
        }

        // Only include rows with a component_set_name (not empty)
        const componentSetName = row.component_set_name || ""
        if (!componentSetName.trim()) {
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

          if (componentsWeekMap.has(weekKey)) {
            componentsWeekMap.set(weekKey, componentsWeekMap.get(weekKey) + insertions)
          } else {
            componentsWeekMap.set(weekKey, insertions)
          }
        }
      })
    }

    // Process variable data
    const variablesWeekMap = new Map()
    if (variableData && variableData.length > 0) {
      variableData.forEach((row) => {
        // Check if row has required columns
        if (!row.week || !row.variable_name) {
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
          const actions = parseFloat(row.actions) || 0

          if (variablesWeekMap.has(weekKey)) {
            variablesWeekMap.set(weekKey, variablesWeekMap.get(weekKey) + actions)
          } else {
            variablesWeekMap.set(weekKey, actions)
          }
        }
      })
    }

    // Get all unique weeks from both maps
    const allWeeks = new Set([
      ...Array.from(componentsWeekMap.keys()),
      ...Array.from(variablesWeekMap.keys())
    ])

    // Convert to array and sort by week (ascending)
    const weeksArray = Array.from(allWeeks)
      .map(week => ({
        week,
        components: componentsWeekMap.get(week) || 0,
        variables: variablesWeekMap.get(week) || 0,
      }))
      .sort((a, b) => new Date(a.week) - new Date(b.week))

    // Convert to Recharts format - use ISO date string for proper formatting
    return weeksArray.map(item => ({
      date: item.week,
      components: item.components,
      variables: item.variables,
    }))
  }, [data, variableData, days])

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

