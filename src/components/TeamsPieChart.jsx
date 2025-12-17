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

const chartConfig = {
  instances: {
    label: "Instances",
    color: "var(--chart-themed-1)",
  },
}

export function TeamsPieChart({ data, days = 90 }) {
  const { isDark } = useTheme()

  // Use chart-themed colors (10-1, darker to lighter) for top 10 teams, plus muted-foreground for "Other"
  const colorArray = useMemo(() => {
    return [
      "var(--chart-themed-10)",
      "var(--chart-themed-9)",
      "var(--chart-themed-8)",
      "var(--chart-themed-7)",
      "var(--chart-themed-6)",
      "var(--chart-themed-5)",
      "var(--chart-themed-4)",
      "var(--chart-themed-3)",
      "var(--chart-themed-2)",
      "var(--chart-themed-1)",
      "hsl(var(--muted-foreground))", // Gray for "Other"
    ]
  }, [])

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    // Filter by days period if week column exists (for insertions data)
    const today = new Date()
    const daysAgo = new Date(today)
    daysAgo.setDate(today.getDate() - days)

    // Check if this is insertions data (has week and insertions columns) or instances data (has num_instances)
    const isInsertionsData = data[0]?.week !== undefined && data[0]?.insertions !== undefined

    // Aggregate by team_name, ignoring "<Drafts>"
    const teamMap = new Map()

    data.forEach((row) => {
      const teamName = (row.team_name || "").trim()
      
      // Ignore "<Drafts>" team
      if (teamName === "<Drafts>" || teamName === "") {
        return
      }

      // Filter by date if this is insertions data
      if (isInsertionsData) {
        if (row.week) {
          const weekDate = new Date(row.week)
          if (isNaN(weekDate.getTime()) || weekDate < daysAgo) {
            return
          }
        }
        const insertions = parseInt(row.insertions) || 0
        if (teamMap.has(teamName)) {
          teamMap.set(teamName, teamMap.get(teamName) + insertions)
        } else {
          teamMap.set(teamName, insertions)
        }
      } else {
        // Legacy instances data
        const numInstances = parseInt(row.num_instances) || 0
        if (teamMap.has(teamName)) {
          teamMap.set(teamName, teamMap.get(teamName) + numInstances)
        } else {
          teamMap.set(teamName, numInstances)
        }
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
  }, [data, days])

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
          className="h-[400px] w-full min-w-0"
          style={{ minWidth: 0, minHeight: 400 }}
        >
          <ResponsiveContainer width="100%" height="100%" minHeight={400}>
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
