import React, { useMemo } from "react"

export function IconsTable({ data, days = 90, minInsertions = 0, maxInsertions = null }) {
  const filteredAndSortedData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    // Calculate date N days ago
    const today = new Date()
    const daysAgo = new Date(today)
    daysAgo.setDate(today.getDate() - days)

    // Filter for icon components only
    const processedData = data
      .filter((row) => {
        // Check if row has required columns
        if (!row.week || !row.insertions || !row.component_name) {
          return false
        }

        // Only include icon components
        const componentName = row.component_name || ""
        if (!componentName.trim().startsWith("Icon -") && !componentName.trim().toLowerCase().includes("icon -")) {
          return false
        }

        // Parse the week date
        const weekDate = new Date(row.week)
        if (isNaN(weekDate.getTime())) {
          return false
        }

        // Filter by last N days
        return weekDate >= daysAgo
      })
      .map((row) => ({
        insertions: parseFloat(row.insertions) || 0,
        detachments: parseFloat(row.detachments) || 0,
        component_name: row.component_name || "",
      }))
      .filter((row) => {
        // Filter by minimum insertions
        if (row.insertions < minInsertions) return false
        // If maxInsertions is set, filter by maximum insertions (for showing only 0 insertions)
        if (maxInsertions !== null && row.insertions > maxInsertions) return false
        return true
      })
      .sort((a, b) => b.insertions - a.insertions) // Sort by insertions descending

    return processedData
  }, [data, days, minInsertions, maxInsertions])

  if (filteredAndSortedData.length === 0) {
    return <div className="text-muted-foreground">No icon data to display for the last {days} days</div>
  }

  const columns = ['component_name', 'insertions', 'detachments']

  return (
    <div className="rounded-md border overflow-auto max-h-[600px]">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-4 py-3 text-left text-sm font-medium text-foreground border-b"
              >
                {column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedData.map((row, index) => (
            <tr
              key={index}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column}
                  className="px-4 py-3 text-sm text-foreground"
                >
                  {row[column] || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 text-sm text-muted-foreground bg-muted">
        Showing {filteredAndSortedData.length} icon{filteredAndSortedData.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

