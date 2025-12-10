import React, { useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"

export function UsagesTable({ data }) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    // Process and aggregate data by component_name
    // CSV format: component_name, component_set_name, file_name, instances
    // We need to aggregate instances and count unique files per component
    const componentMap = new Map()

    data.forEach((row) => {
      const componentName = row.component_name || ""
      // Support both 'instances' (from CSV) and 'num_instances' (legacy format)
      const numInstances = parseInt(row.num_instances || row.instances) || 0
      const fileName = row.file_name || ""

      if (!componentName.trim()) {
        return
      }

      if (componentMap.has(componentName)) {
        const existing = componentMap.get(componentName)
        existing.num_instances += numInstances
        // Track unique files
        if (fileName) {
          existing.files.add(fileName)
        }
        // Support legacy format with explicit team/file counts
        if (row.num_teams_using) {
          existing.num_teams_using = Math.max(existing.num_teams_using, parseInt(row.num_teams_using) || 0)
        }
        if (row.num_files_using) {
          existing.num_files_using = Math.max(existing.num_files_using, parseInt(row.num_files_using) || 0)
        }
      } else {
        const files = new Set()
        if (fileName) {
          files.add(fileName)
        }
        componentMap.set(componentName, {
          component_name: componentName,
          num_instances: numInstances,
          num_teams_using: parseInt(row.num_teams_using) || 0,
          num_files_using: parseInt(row.num_files_using) || files.size,
          files: files,
        })
      }
    })

    // Convert file sets to counts
    componentMap.forEach((value) => {
      if (value.files) {
        value.num_files_using = value.files.size
        delete value.files
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
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedData.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.key === "num_instances" ||
                  column.key === "num_files_using" ||
                  column.key === "num_teams_using"
                    ? row[column.key].toLocaleString()
                    : row[column.key] || "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {processedData.length > 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground bg-muted">
          Showing {processedData.length} component{processedData.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}

