import React, { useMemo } from "react"
import {
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { ChartContainer as ShadcnChartContainer, ChartTooltipContent } from "../ui/chart-container"
import { useTheme } from "../../lib/useTheme"
import { CHART_COLORS } from "../../lib/chartColors"

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
}

export function BarChart({ 
  data, 
  dataKey = "value",
  nameKey = "name",
  days = 90,
  title,
  description,
  headerActions,
  orientation = "vertical", // "vertical" or "horizontal"
  barColor // Optional: single color for all bars (CSS variable)
}) {
  const { isDark } = useTheme()
  
  // If barColor is provided, use it for all bars. Otherwise, cycle through colors
  const colorArray = barColor ? [barColor] : CHART_COLORS

  // Grid color - use border color from theme
  const gridColor = "hsl(var(--border))"

  const chartContent = !data || data.length === 0 ? (
    <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
      No data found
    </div>
  ) : (
    <ShadcnChartContainer 
      config={chartConfig} 
      className="h-[400px] w-full min-w-0" 
      key={`chart-${isDark}`}
      style={{ minWidth: 0, minHeight: 400 }}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={400}>
        <RechartsBarChart 
          data={data} 
          layout={orientation}
          key={`bar-chart-${isDark}`}
        >
          {orientation === "vertical" ? (
            <>
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
                dataKey={nameKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={150}
                tick={{ fill: "hsl(var(--card-foreground))", fontSize: 12 }}
              />
            </>
          ) : (
            <>
              <XAxis
                type="category"
                dataKey={nameKey}
                tickLine={false}
                axisLine={{ stroke: gridColor, strokeWidth: 1 }}
                tickMargin={8}
                tick={{ fill: "hsl(var(--card-foreground))", fontSize: 12 }}
              />
              <YAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "hsl(var(--card-foreground))", fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}k`
                  }
                  return value.toString()
                }}
              />
            </>
          )}
          <RechartsTooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey={dataKey}
            radius={orientation === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            fill={barColor || undefined}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={barColor || colorArray[index % colorArray.length]}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </ShadcnChartContainer>
  )

  return chartContent
}
