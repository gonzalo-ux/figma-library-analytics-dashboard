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
  orientation = "vertical" // "vertical" or "horizontal"
}) {
  const isDark = useTheme()
  
  const getColorArray = (baseHue, baseSaturation, isDarkMode) => {
    if (isDarkMode) {
      return [
        `hsl(${baseHue}, ${baseSaturation}%, 35%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 40%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 45%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 50%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 55%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 60%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 65%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 70%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 75%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 80%)`,
      ]
    } else {
      return [
        `hsl(${baseHue}, ${baseSaturation}%, 45%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 50%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 55%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 60%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 61%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 65%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 70%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 75%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 80%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 85%)`,
      ]
    }
  }

  const colorArray = isDark 
    ? getColorArray(220, 70, true)
    : getColorArray(12, 76, false)

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
                dataKey={nameKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={150}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
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
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                type="number"
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
            </>
          )}
          <RechartsTooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey={dataKey}
            radius={orientation === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorArray[index % colorArray.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </ShadcnChartContainer>
  )

  return chartContent
}
