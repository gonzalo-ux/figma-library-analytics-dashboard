import React, { useMemo } from "react"
import { ResponsiveContainer } from "recharts"
import { BarChart } from "./charts/BarChart"
import { ChartContainer as ShadcnChartContainer, ChartTooltipContent } from "./ui/chart-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useTheme } from "../lib/useTheme"

// SINGLE SOURCE OF TRUTH: Define bar colors here
// Can be a single CSS variable (all bars same color) or array (cycling colors)
const BAR_COLORS = "var(--chart-themed-3)" // Single color for all bars

const chartConfig = {
  detachments: {
    label: "Detachments",
    color: BAR_COLORS,
  },
}

export function DetachmentsChart({ data, days = 90, title, description, headerActions }) {
  const { isDark } = useTheme()
  
  // Use single color for all bars
  const barColor = Array.isArray(BAR_COLORS) ? BAR_COLORS[0] : BAR_COLORS

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
      if (!row.week || !row.detachments || !row.component_name) {
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
        const detachments = parseFloat(row.detachments) || 0

        if (componentMap.has(componentSetName)) {
          componentMap.set(componentSetName, componentMap.get(componentSetName) + detachments)
        } else {
          componentMap.set(componentSetName, detachments)
        }
      }
    })

    // Convert to array and sort by detachments (descending)
    const componentsArray = Array.from(componentMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Get top 10

    // Transform to Recharts format
    return componentsArray.map(item => ({
      name: item.name,
      detachments: item.total,
    }))
  }, [data, days])

  const chartContent = !chartData || chartData.length === 0 ? (
    <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
      No data found for the last {days} days
    </div>
  ) : (
    <ShadcnChartContainer 
      config={chartConfig} 
      className="h-[400px] w-full min-w-0" 
      key={`chart-${isDark}`}
      style={{ minWidth: 0, minHeight: 400 }}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={400}>
        <BarChart 
          data={chartData} 
          layout="vertical"
          key={`bar-chart-${isDark}`}
          barColor={barColor}
        />
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
