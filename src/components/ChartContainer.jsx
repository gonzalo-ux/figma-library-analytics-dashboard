import React, { useMemo } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export function ChartContainer({ data, days = 90 }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
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

    // Extract labels and data
    const labels = componentsArray.map(item => item.name)
    const insertionsData = componentsArray.map(item => item.total)

    return {
      labels,
      datasets: [
        {
          label: "Insertions",
          data: insertionsData,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
        },
      ],
    }
  }, [data, days])

  const options = {
    indexAxis: 'y', // Make horizontal bar chart (component names on Y-axis)
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Insertions",
        },
      },
      y: {
        title: {
          display: true,
          text: "Component",
        },
      },
    },
  }

  if (chartData.datasets.length === 0 || chartData.labels.length === 0) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
        No data found for the last {days} days
      </div>
    )
  }

  return (
    <div className="h-[400px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  )
}

