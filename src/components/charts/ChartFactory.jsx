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
  pageType,
  ...props
}) {
  // Process data for charts that need it (like BarChart with component data)
  // Data is already filtered by filterDataForPage based on wizard configuration
  // We just need to aggregate and display it
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    
    // If data is already in chart format, return as is
    if (data[0] && (data[0].name || data[0][nameKey])) {
      return data
    }
    
    // Otherwise, process data based on what fields are available
    // Data is already filtered by the wizard, so we just aggregate it
    const today = new Date()
    const daysAgo = new Date(today)
    daysAgo.setDate(today.getDate() - (days || 90))
    
    const itemMap = new Map()
    
    data.forEach((row) => {
      if (!row.week || !row[dataKey]) return
      
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
      if (isNaN(weekDate.getTime())) return
      
      if (weekDate >= daysAgo) {
        const value = parseFloat(row[dataKey]) || 0
        if (itemMap.has(itemName)) {
          itemMap.set(itemName, itemMap.get(itemName) + value)
        } else {
          itemMap.set(itemName, value)
        }
      }
    })
    
    return Array.from(itemMap.entries())
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
