import React, { useMemo } from "react"

export function UsagesTable({ data }) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    // Process and aggregate data by component_name
    // If the same component_name appears multiple times (different variants),
    // we aggregate instances and take the max of teams/files
    const componentMap = new Map()

    data.forEach((row) => {
      const componentName = row.component_name || ""
      const numInstances = parseInt(row.num_instances) || 0
      const numTeams = parseInt(row.num_teams_using) || 0
      const numFiles = parseInt(row.num_files_using) || 0

      if (!componentName.trim()) {
        return
      }

      if (componentMap.has(componentName)) {
        const existing = componentMap.get(componentName)
        existing.num_instances += numInstances
        // Take the maximum since these represent unique teams/files per variant
        existing.num_teams_using = Math.max(existing.num_teams_using, numTeams)
        existing.num_files_using = Math.max(existing.num_files_using, numFiles)
      } else {
        componentMap.set(componentName, {
          component_name: componentName,
          num_instances: numInstances,
          num_teams_using: numTeams,
          num_files_using: numFiles,
        })
      }
    })

    // Convert map to array and sort by number of instances (descending)
    return Array.from(componentMap.values()).sort(
      (a, b) => b.num_instances - a.num_instances
    )
  }, [data])

  if (processedData.length === 0) {
    return <div className="text-muted-foreground">No data to display</div>
  }

  const columns = [
    { key: "component_name", label: "Component Name" },
    { key: "num_files_using", label: "Files Using" },
    { key: "num_teams_using", label: "Teams Using" },
    { key: "num_instances", label: "Total Instances" },
  ]

  return (
    <div className="rounded-md border overflow-auto max-h-[600px]">
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
          {processedData.map((row, index) => (
            <tr
              key={index}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-sm text-foreground"
                >
                  {column.key === "num_instances" ||
                  column.key === "num_files_using" ||
                  column.key === "num_teams_using"
                    ? row[column.key].toLocaleString()
                    : row[column.key] || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {processedData.length > 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground bg-muted">
          Showing {processedData.length} component{processedData.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}

