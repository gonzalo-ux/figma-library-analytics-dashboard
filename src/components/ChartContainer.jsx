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
import { CHART_COLORS } from "../lib/chartColors"

const chartConfig = {
  insertions: {
    label: "Insertions",
    color: "hsl(var(--chart-1))",
  },
}

export function ChartContainer({ data, days = 90, title, description, headerActions }) {
  const { isDark } = useTheme()
  
  // Use shared chart colors (supports both --chart-* and --chart-themed-* variables)
  const colorArray = CHART_COLORS

  // Grid color - use border color from theme
  const gridColor = "hsl(var(--border))"

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
      className="h-[400px] w-full min-w-0" 
      key={`chart-${isDark}`}
      style={{ minWidth: 0, minHeight: 400 }}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={400}>
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
            tick={{ fill: "hsl(var(--card-foreground))", fontSize: 12 }}
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
            tick={{ fill: "hsl(var(--card-foreground))", fontSize: 12 }}
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
