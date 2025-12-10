import React from "react"
import {
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { ChartContainer as ShadcnChartContainer, ChartTooltipContent } from "../ui/chart-container"
import { useTheme } from "../../lib/useTheme"

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
}

export function LineChart({ 
  data, 
  dataKey = "value",
  nameKey = "name",
  days = 90,
  title,
  description,
  headerActions
}) {
  const isDark = useTheme()
  
  const gridColor = isDark 
    ? "hsl(0, 0%, 25%)"
    : "hsl(0, 0%, 85%)"

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
        <RechartsLineChart 
          data={data} 
          key={`line-chart-${isDark}`}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey={nameKey}
            tickLine={false}
            axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            tickMargin={8}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}k`
              }
              return value.toString()
            }}
          />
          <RechartsTooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ShadcnChartContainer>
  )

  return chartContent
}
