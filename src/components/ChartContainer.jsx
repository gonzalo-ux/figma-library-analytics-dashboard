import React, { useMemo } from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { ChartContainer as ShadcnChartContainer, ChartTooltipContent } from "./ui/chart-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useTheme } from "../lib/useTheme"

const chartConfig = {
  insertions: {
    label: "Insertions",
    color: "hsl(var(--chart-1))",
  },
}

export function ChartContainer({ data, days = 90, title, description, headerActions }) {
  const isDark = useTheme()
  
  // Create color array from darker (top) to lighter (bottom)
  // Light mode: hsl(12, 76%, 61%) - from --chart-1
  // Dark mode: hsl(220, 70%, 50%) - from --chart-1
  const getColorArray = (baseHue, baseSaturation, isDarkMode) => {
    if (isDarkMode) {
      // Dark mode: darker (lower lightness) at top, lighter at bottom
      return [
        `hsl(${baseHue}, ${baseSaturation}%, 35%)`,  // Darkest (top)
        `hsl(${baseHue}, ${baseSaturation}%, 40%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 45%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 50%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 55%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 60%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 65%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 70%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 75%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 80%)`,  // Lightest (bottom)
      ]
    } else {
      // Light mode: darker at top, lighter at bottom
      return [
        `hsl(${baseHue}, ${baseSaturation}%, 45%)`,  // Darkest (top)
        `hsl(${baseHue}, ${baseSaturation}%, 50%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 55%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 60%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 61%)`,  // Base color
        `hsl(${baseHue}, ${baseSaturation}%, 65%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 70%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 75%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 80%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 85%)`,  // Lightest (bottom)
      ]
    }
  }

  const colorArray = isDark 
    ? getColorArray(220, 70, true)   // Dark mode: blue
    : getColorArray(12, 76, false)   // Light mode: orange/red

  // Grid color - use a more visible color based on theme
  // Light mode: use border color, Dark mode: use a lighter color for contrast
  const gridColor = isDark 
    ? "hsl(0, 0%, 25%)"  // Lighter gray for better visibility in dark mode
    : "hsl(0, 0%, 85%)"  // Darker gray for better visibility in light mode

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    // Calculate date N days ago
    const today = new Date()
    const daysAgo = new Date(today)
    daysAgo.setDate(today.getDate() - days)

    // Filter data from last N days and group by component_set_name (component names only, no variants)
    // Exclude icon components and rows without component_set_name
    const componentMap = new Map()

    data.forEach((row) => {
      // Check if row has required columns
      if (!row.week || !row.insertions || !row.component_name) {
        return
      }

      // Skip icon components (component_name starts with "Icon -")
      const componentName = row.component_name || ""
      if (componentName.trim().startsWith("Icon -") || componentName.trim().toLowerCase().includes("icon -")) {
        return
      }

      // Only include rows with a component_set_name (component name, not variants)
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
        const insertions = parseFloat(row.insertions) || 0

        if (componentMap.has(componentSetName)) {
          componentMap.set(componentSetName, componentMap.get(componentSetName) + insertions)
        } else {
          componentMap.set(componentSetName, insertions)
        }
      }
    })

    // Convert to array and sort by insertions (descending)
    const componentsArray = Array.from(componentMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Get top 10

    // Transform to Recharts format
    return componentsArray.map(item => ({
      name: item.name,
      insertions: item.total,
    }))
  }, [data, days])

  const chartContent = !chartData || chartData.length === 0 ? (
    <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
      No data found for the last {days} days
    </div>
  ) : (
    <ShadcnChartContainer 
      config={chartConfig} 
      className="h-[400px] w-full" 
      key={`chart-${isDark}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical"
          key={`bar-chart-${isDark}`}
        >
          <XAxis
            type="number"
            tickLine={false}
            axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            tickMargin={8}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}k`
              }
              return value.toString()
            }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={150}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <RechartsTooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey="insertions"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorArray[index % colorArray.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ShadcnChartContainer>
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
