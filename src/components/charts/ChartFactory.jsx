import React, { useMemo } from 'react'
import { BarChart } from './BarChart'
import { LineChart } from './LineChart'
import { AreaChart } from './AreaChart'
import { PieChart } from './PieChart'
import { RadialChart } from './RadialChart'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export function ChartFactory({ 
  type = 'bar',
  data,
  dataKey = 'value',
  nameKey = 'name',
  days,
  title,
  description,
  headerActions,
  orientation = 'vertical',
  ...props
}) {
  // Process data for charts that need it (like BarChart with component data)
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    
    // If data is already in chart format, return as is
    if (data[0] && (data[0].name || data[0][nameKey])) {
      return data
    }
    
    // Otherwise, process component data similar to ChartContainer
    const today = new Date()
    const daysAgo = new Date(today)
    daysAgo.setDate(today.getDate() - (days || 90))
    
    const componentMap = new Map()
    
    data.forEach((row) => {
      if (!row.week || !row[dataKey] || !row.component_name) return
      
      const componentName = row.component_name || ""
      if (componentName.trim().startsWith("Icon -") || componentName.trim().toLowerCase().includes("icon -")) {
        return
      }
      
      const componentSetName = row.component_set_name || ""
      if (!componentSetName.trim()) return
      
      const weekDate = new Date(row.week)
      if (isNaN(weekDate.getTime())) return
      
      if (weekDate >= daysAgo) {
        const value = parseFloat(row[dataKey]) || 0
        if (componentMap.has(componentSetName)) {
          componentMap.set(componentSetName, componentMap.get(componentSetName) + value)
        } else {
          componentMap.set(componentSetName, value)
        }
      }
    })
    
    return Array.from(componentMap.entries())
      .map(([name, total]) => ({ [nameKey]: name, [dataKey]: total }))
      .sort((a, b) => b[dataKey] - a[dataKey])
      .slice(0, 10)
  }, [data, dataKey, nameKey, days])

  // Determine bar color based on dataKey for bar charts
  const barColor = type === 'bar' 
    ? (dataKey === 'insertions' ? 'var(--chart-themed-5)' : dataKey === 'detachments' ? 'var(--chart-themed-3)' : undefined)
    : undefined

  const chartProps = {
    data: processedData,
    dataKey,
    nameKey,
    days,
    title,
    description,
    headerActions,
    orientation,
    ...(barColor ? { barColor } : {}),
    ...props
  }

  let ChartComponent = null

  switch (type) {
    case 'bar':
      ChartComponent = <BarChart {...chartProps} />
      break
    case 'line':
      ChartComponent = <LineChart {...chartProps} />
      break
    case 'area':
      ChartComponent = <AreaChart {...chartProps} />
      break
    case 'pie':
      ChartComponent = <PieChart {...chartProps} />
      break
    case 'radial':
      ChartComponent = <RadialChart {...chartProps} />
      break
    default:
      ChartComponent = <BarChart {...chartProps} />
  }

  if (title || headerActions) {
    return (
      <Card>
        {(title || headerActions) && (
          <CardHeader>
            {headerActions ? (
              <div className="flex items-center justify-between">
                {title && <CardTitle>{title}</CardTitle>}
                {headerActions}
              </div>
            ) : (
              title && <CardTitle>{title}</CardTitle>
            )}
          </CardHeader>
        )}
        <CardContent>
          {ChartComponent}
        </CardContent>
      </Card>
    )
  }

  return ChartComponent
}
