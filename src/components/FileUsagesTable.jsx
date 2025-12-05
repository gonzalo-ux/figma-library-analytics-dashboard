import React, { useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"

export function FileUsagesTable({ data }) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    // Aggregate data by team_name and file_name combination
    const fileMap = new Map()

    data.forEach((row) => {
      const teamName = row.team_name || ""
      const fileName = row.file_name || ""
      const workspaceName = row.workspace_name || ""
      const numInstances = parseInt(row.num_instances) || 0

      // Create a unique key for team + file combination
      const key = `${teamName}|||${fileName}`

      if (fileMap.has(key)) {
        const existing = fileMap.get(key)
        existing.num_instances += numInstances
      } else {
        fileMap.set(key, {
          team_name: teamName,
          workspace_name: workspaceName,
          file_name: fileName,
          num_instances: numInstances,
        })
      }
    })

    // Convert map to array and sort by number of instances (descending)
    return Array.from(fileMap.values()).sort(
      (a, b) => b.num_instances - a.num_instances
    )
  }, [data])

  // Calculate total instances for "File not visible" files
  const invisibleFilesTotal = useMemo(() => {
    return processedData
      .filter((row) => row.file_name === "File not visible")
      .reduce((sum, row) => sum + row.num_instances, 0)
  }, [processedData])

  if (processedData.length === 0) {
    return <div className="text-muted-foreground">No data to display</div>
  }

  const columns = [
    { key: "team_name", label: "Team Name" },
    { key: "workspace_name", label: "Workspace Name" },
    { key: "file_name", label: "File Name" },
    { key: "num_instances", label: "Total Instances" },
  ]

  return (
    <div className="space-y-4">
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
                    {column.key === "num_instances"
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
            Showing {processedData.length} file{processedData.length !== 1 ? "s" : ""}
            {invisibleFilesTotal > 0 && (
              <span className="ml-2">
                • {invisibleFilesTotal.toLocaleString()} total instances in files not visible
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

