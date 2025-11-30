import React, { useMemo, useState } from "react"

export function DataTable({ data, days = 90 }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedComponentSet, setSelectedComponentSet] = useState(null)

  const filteredAndSortedData = useMemo(() => {
    if (!data || data.length === 0) {
      return { processedData: [], rawDataByComponentSet: new Map() }
    }

    // Calculate date N days ago
    const today = new Date()
    const daysAgo = new Date(today)
    daysAgo.setDate(today.getDate() - days)

    // Filter and process data, then aggregate by component_set_name
    const componentSetMap = new Map()
    const rawDataByComponentSet = new Map() // Store raw data for variant details

    const filteredRows = data.filter((row) => {
      // Check if row has required columns
      if (!row.week || !row.insertions || !row.component_name) {
        return false
      }

      // Skip icon components
      const componentName = row.component_name || ""
      if (componentName.trim().startsWith("Icon -") || componentName.trim().toLowerCase().includes("icon -")) {
        return false
      }

      // Only include rows with a component_set_name
      const componentSetName = row.component_set_name || ""
      if (!componentSetName.trim()) {
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

    filteredRows.forEach((row) => {
      const componentSetName = row.component_set_name || ""
      const componentName = row.component_name || ""
      const insertions = parseFloat(row.insertions) || 0
      const detachments = parseFloat(row.detachments) || 0

      // Store raw data for variant details
      if (!rawDataByComponentSet.has(componentSetName)) {
        rawDataByComponentSet.set(componentSetName, [])
      }
      rawDataByComponentSet.get(componentSetName).push({
        component_name: componentName,
        insertions,
        detachments,
      })

      if (componentSetMap.has(componentSetName)) {
        const existing = componentSetMap.get(componentSetName)
        existing.insertions += insertions
        existing.components.add(componentName)
      } else {
        componentSetMap.set(componentSetName, {
          insertions,
          components: new Set([componentName]),
        })
      }
    })

    // Convert map to array and sort by insertions descending
    const processedData = Array.from(componentSetMap.entries())
      .map(([component_set_name, { insertions, components }]) => ({
        component_set_name,
        insertions,
        variants: components.size,
      }))
      .sort((a, b) => b.insertions - a.insertions)

    // Filter by search term if provided
    let filteredData = processedData
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filteredData = processedData.filter((row) =>
        row.component_set_name.toLowerCase().includes(lowerSearchTerm)
      )
    }

    return { processedData: filteredData, rawDataByComponentSet }
  }, [data, days, searchTerm])

  // Get variant details for selected component set
  const variantDetails = useMemo(() => {
    if (!selectedComponentSet || !filteredAndSortedData?.rawDataByComponentSet) {
      return []
    }

    const rawData = filteredAndSortedData.rawDataByComponentSet.get(selectedComponentSet) || []
    const variantMap = new Map()

    rawData.forEach((row) => {
      const componentName = row.component_name || ""
      const insertions = row.insertions || 0
      const detachments = row.detachments || 0

      if (variantMap.has(componentName)) {
        const existing = variantMap.get(componentName)
        existing.insertions += insertions
        existing.detachments += detachments
      } else {
        variantMap.set(componentName, {
          component_name: componentName,
          insertions,
          detachments,
        })
      }
    })

    return Array.from(variantMap.values()).sort((a, b) => b.insertions - a.insertions)
  }, [selectedComponentSet, filteredAndSortedData])

  const processedData = filteredAndSortedData?.processedData || []

  if (processedData.length === 0) {
    return <div className="text-muted-foreground">No data to display for the last {days} days</div>
  }

  const columns = [
    { key: 'component_set_name', label: 'Component' },
    { key: 'insertions', label: 'Insertions' },
    { key: 'variants', label: 'Variants' },
  ]

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by component name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="rounded-md border overflow-auto max-h-[500px]">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-sm font-medium text-foreground border-b"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedData.slice(0, 100).map((row, index) => (
                  <tr
                    key={index}
                    onClick={() => setSelectedComponentSet(
                      selectedComponentSet === row.component_set_name ? null : row.component_set_name
                    )}
                    className={`border-b transition-colors cursor-pointer ${
                      selectedComponentSet === row.component_set_name
                        ? "bg-primary/10 hover:bg-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm text-foreground"
                      >
                        {column.key === 'insertions' 
                          ? row[column.key].toLocaleString()
                          : column.key === 'variants'
                          ? row[column.key] === 0
                            ? "No variants"
                            : row[column.key].toLocaleString()
                          : row[column.key] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {processedData.length > 100 && (
            <div className="px-4 py-2 text-sm text-muted-foreground bg-muted rounded-md">
              Showing first 100 rows of {processedData.length} total rows
            </div>
          )}
        </div>
        
        {selectedComponentSet && variantDetails.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Variants for: {selectedComponentSet}
              </h3>
              <button
                onClick={() => setSelectedComponentSet(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground border-b">
                      Variant Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground border-b">
                      Insertions
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground border-b">
                      Detachments
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variantDetails.map((variant, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-foreground">
                        {variant.component_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {variant.insertions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {variant.detachments.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

