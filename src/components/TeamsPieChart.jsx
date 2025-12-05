import React, { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { ChartContainer as ShadcnChartContainer, ChartTooltipContent } from "./ui/chart-container"
import { useTheme } from "../lib/useTheme"
import { getCSSVariable } from "../lib/utils"

const chartConfig = {
  instances: {
    label: "Instances",
    color: "hsl(var(--chart-1))",
  },
}

export function TeamsPieChart({ data }) {
  const isDark = useTheme()

  // Create color array using blue theme from CSS variables - same approach as ChartContainer
  // Use variations of the blue color (--chart-1) with different lightness values
  const colorArray = useMemo(() => {
    // Get base color from CSS variable
    const baseColor = getCSSVariable('--chart-1')
    
    // Extract hue and saturation from the base color
    const hslMatch = baseColor.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/)
    if (!hslMatch) {
      // Fallback if parsing fails
      const baseHue = isDark ? 220 : 12
      const baseSaturation = isDark ? 70 : 76
      
      if (isDark) {
        // Dark mode: variations of blue (hue 220, saturation 70)
        return [
          `hsl(${baseHue}, ${baseSaturation}%, 35%)`,  // Darkest
          `hsl(${baseHue}, ${baseSaturation}%, 40%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 45%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 50%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 55%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 60%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 65%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 70%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 75%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 80%)`,  // Lightest
          getCSSVariable('--muted-foreground'), // Gray for "Other"
        ]
      } else {
        // Light mode: variations of orange/red (hue 12, saturation 76)
        return [
          `hsl(${baseHue}, ${baseSaturation}%, 45%)`,  // Darkest
          `hsl(${baseHue}, ${baseSaturation}%, 50%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 55%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 60%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 61%)`,  // Base color
          `hsl(${baseHue}, ${baseSaturation}%, 65%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 70%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 75%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 80%)`,
          `hsl(${baseHue}, ${baseSaturation}%, 85%)`,  // Lightest
          getCSSVariable('--muted-foreground'), // Gray for "Other"
        ]
      }
    }
    
    const baseHue = parseFloat(hslMatch[1])
    const baseSaturation = parseFloat(hslMatch[2])
    
    if (isDark) {
      // Dark mode: variations of blue with different lightness
      return [
        `hsl(${baseHue}, ${baseSaturation}%, 35%)`,  // Darkest
        `hsl(${baseHue}, ${baseSaturation}%, 40%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 45%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 50%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 55%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 60%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 65%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 70%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 75%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 80%)`,  // Lightest
        getCSSVariable('--muted-foreground'), // Gray for "Other"
      ]
    } else {
      // Light mode: variations with different lightness
      return [
        `hsl(${baseHue}, ${baseSaturation}%, 45%)`,  // Darkest
        `hsl(${baseHue}, ${baseSaturation}%, 50%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 55%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 60%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 61%)`,  // Base color
        `hsl(${baseHue}, ${baseSaturation}%, 65%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 70%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 75%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 80%)`,
        `hsl(${baseHue}, ${baseSaturation}%, 85%)`,  // Lightest
        getCSSVariable('--muted-foreground'), // Gray for "Other"
      ]
    }
  }, [isDark])

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    // Aggregate instances by team_name, ignoring "<Drafts>"
    const teamMap = new Map()

    data.forEach((row) => {
      const teamName = (row.team_name || "").trim()
      const numInstances = parseInt(row.num_instances) || 0

      // Ignore "<Drafts>" team
      if (teamName === "<Drafts>" || teamName === "") {
        return
      }

      if (teamMap.has(teamName)) {
        teamMap.set(teamName, teamMap.get(teamName) + numInstances)
      } else {
        teamMap.set(teamName, numInstances)
      }
    })

    // Convert to array and sort by instances (descending)
    const teamsArray = Array.from(teamMap.entries())
      .map(([name, total]) => ({ name, value: total }))
      .sort((a, b) => b.value - a.value)

    if (teamsArray.length === 0) {
      return []
    }

    // Get top 10 teams
    const topTeams = teamsArray.slice(0, 10)
    
    // Calculate "Other" total from remaining teams
    const otherTeams = teamsArray.slice(10)
    const otherTotal = otherTeams.reduce((sum, team) => sum + team.value, 0)
    const otherTeamCount = otherTeams.length

    // Combine top 10 with "Other" if there are more teams
    const result = [...topTeams]
    if (otherTotal > 0) {
      result.push({ 
        name: "Other", 
        value: otherTotal,
        teamCount: otherTeamCount 
      })
    }

    // Calculate total for percentage calculation
    const total = result.reduce((sum, item) => sum + item.value, 0)

    // Add percentage to each item and clean display name
    return result.map(item => ({
      ...item,
      percent: total > 0 ? (item.value / total) * 100 : 0,
      displayName: item.name === "Other" && item.teamCount 
        ? `Other (${item.teamCount} team${item.teamCount !== 1 ? 's' : ''})`
        : item.name.replace(/^\d+_/, '') // Remove leading numbers and underscore
    }))
  }, [data])

  const chartContent = !chartData || chartData.length === 0 ? (
    <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
      No data to display
    </div>
  ) : (
    <div className="flex items-center gap-6">
      {/* Custom Legend with percentages - Left side */}
      <div className="flex flex-col gap-3 min-w-[200px]">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorArray[index % colorArray.length] }}
            />
            <span className="text-sm text-foreground">
              {entry.displayName}: <span className="font-medium">{entry.percent.toFixed(1)}%</span>
            </span>
          </div>
        ))}
      </div>
      
      {/* Pie Chart - Right side */}
      <div className="flex-1">
        <ShadcnChartContainer 
          config={chartConfig} 
          className="h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={`pie-chart-${isDark}`}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="displayName"
                cx="50%"
                cy="50%"
                outerRadius={140}
                stroke="transparent"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => {
                  const fillColor = colorArray[index % colorArray.length]
                  return (
                    <Cell 
                      key={`cell-${index}-${fillColor}`} 
                      fill={fillColor}
                      stroke="transparent"
                      strokeWidth={0}
                    />
                  )
                })}
              </Pie>
              <RechartsTooltip 
                content={<ChartTooltipContent indicator="dot" />}
                cursor={{ fill: "transparent" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ShadcnChartContainer>
      </div>
    </div>
  )

  return chartContent
}
