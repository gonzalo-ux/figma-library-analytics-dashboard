import React, { useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"

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
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>
                {column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedData.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column}>
                  {column === 'insertions' || column === 'detachments'
                    ? typeof row[column] === 'number' ? row[column].toLocaleString() : row[column] || "-"
                    : row[column] || "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 py-2 text-sm text-muted-foreground bg-muted">
        Showing {filteredAndSortedData.length} icon{filteredAndSortedData.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

