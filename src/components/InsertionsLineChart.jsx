import React, { useMemo } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

export function InsertionsLineChart({ data, days = 90 }) {
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

    // Filter data from last N days, exclude icons, and group by week
    const weekMap = new Map()

    data.forEach((row) => {
      // Check if row has required columns
      if (!row.week || !row.insertions || !row.component_name) {
        return
      }

      // Skip icon components
      const componentName = row.component_name || ""
      if (componentName.trim().startsWith("Icon -") || componentName.trim().toLowerCase().includes("icon -")) {
        return
      }

      // Only include rows with a component_set_name (not empty)
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
        const weekKey = row.week // Use week as key
        const insertions = parseFloat(row.insertions) || 0

        if (weekMap.has(weekKey)) {
          weekMap.set(weekKey, weekMap.get(weekKey) + insertions)
        } else {
          weekMap.set(weekKey, insertions)
        }
      }
    })

    // Convert to array and sort by week (ascending)
    const weeksArray = Array.from(weekMap.entries())
      .map(([week, total]) => ({ week, total }))
      .sort((a, b) => new Date(a.week) - new Date(b.week))

    // Extract labels and data
    const labels = weeksArray.map(item => {
      const date = new Date(item.week)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
    const insertionsData = weeksArray.map(item => item.total)

    return {
      labels,
      datasets: [
        {
          label: "Total Insertions",
          data: insertionsData,
          borderColor: "rgba(16, 185, 129, 1)",
          backgroundColor: "rgba(16, 185, 129, 0.4)",
          borderWidth: 2,
          fill: 'origin',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "rgba(255, 255, 255, 1)",
          pointBorderColor: "rgba(16, 185, 129, 1)",
          pointBorderWidth: 2,
        },
      ],
    }
  }, [data, days])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        title: {
          display: true,
          text: "Total Insertions",
        },
        grid: {
          display: true,
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
        grid: {
          display: true,
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  }

  if (chartData.datasets.length === 0 || chartData.labels.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        No data found for the last {days} days
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}

