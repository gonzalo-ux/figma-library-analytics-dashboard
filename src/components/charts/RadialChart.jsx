import React from "react"
import {
  RadialBar,
  RadialBarChart as RechartsRadialBarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
import { ChartContainer as ShadcnChartContainer, ChartTooltipContent } from "../ui/chart-container"
import { useTheme } from "../../lib/useTheme"

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function RadialChart({ 
  data, 
  dataKey = "value",
  nameKey = "name",
  days = 90,
  title,
  description,
  headerActions
}) {
  const isDark = useTheme()

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
        <RechartsRadialBarChart 
          innerRadius="20%" 
          outerRadius="80%" 
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            minAngle={15}
            label={{ position: "insideStart", fill: "#fff" }}
            background
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </RadialBar>
          <RechartsTooltip content={<ChartTooltipContent />} />
          <Legend />
        </RechartsRadialBarChart>
      </ResponsiveContainer>
    </ShadcnChartContainer>
  )

  return chartContent
}
