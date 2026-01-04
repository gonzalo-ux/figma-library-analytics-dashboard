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

export function DetachmentsChart({ data, days = 90, title, description, headerActions, pageType }) {
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

    // Data is already filtered by filterDataForPage based on wizard configuration
    // We just need to aggregate and display it
    const itemMap = new Map()

    data.forEach((row) => {
      // Check if row has required columns
      if (!row.week || !row.detachments) {
        return
      }

      // Determine the item name based on available fields
      // Data is already filtered, so we just need to aggregate
      let itemName = ""
      
      if (row.component_set_name && row.component_set_name.trim()) {
        // Components: use component_set_name for grouping
        itemName = row.component_set_name.trim()
      } else if (row.component_name && row.component_name.trim()) {
        // Icons or components without set: use component_name
        itemName = row.component_name.trim()
      } else if (row.variable_name && row.variable_name.trim()) {
        // Variables: use variable_name
        itemName = row.variable_name.trim()
      } else if (row.variable_key && row.variable_key.trim()) {
        // Variables: fallback to variable_key
        itemName = row.variable_key.trim()
      } else if (row.style_name && row.style_name.trim()) {
        // Styles: use style_name
        itemName = row.style_name.trim()
      }
      
      if (!itemName) return

      const weekDate = new Date(row.week)
      if (isNaN(weekDate.getTime())) {
        return
      }

      if (weekDate >= daysAgo) {
        const detachments = parseFloat(row.detachments) || 0
        if (itemMap.has(itemName)) {
          itemMap.set(itemName, itemMap.get(itemName) + detachments)
        } else {
          itemMap.set(itemName, detachments)
        }
      }
    })

    // Convert to array and sort by detachments (descending)
    const itemsArray = Array.from(itemMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Get top 10

    // Transform to Recharts format
    return itemsArray.map(item => ({
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
