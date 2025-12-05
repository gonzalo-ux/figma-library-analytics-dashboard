import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import branchesData from "../data/branches.json"

export function BranchesTable() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadBranches() {
      try {
        // Load branches from JSON file (synced via npm run sync-branches)
        setBranches(branchesData || [])
        setLoading(false)
      } catch (err) {
        setError(err.message || "Failed to load branches data. Please run 'npm run sync-branches' to fetch branches from Figma.")
        setLoading(false)
      }
    }

    loadBranches()
  }, [])

  // Group branches by status
  const activeBranches = branches.filter((b) => b.status === "active")
  const archivedBranches = branches.filter((b) => b.status === "archived")
  const mergedBranches = branches.filter((b) => b.status === "merged")

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            Loading branches...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-destructive text-center">{error}</p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Note: To fetch branches from Figma, you need to configure the Figma API token
            and ensure you have access to the project containing this file.
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderBranchTable = (branchList, title) => {
    if (branchList.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No {title.toLowerCase()} branches</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {title === "Active" 
              ? "Branches currently in development or review"
              : title === "Archived"
              ? "Branches that have been archived"
              : "Branches that have been merged"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  {title === "Active" && <TableHead>Review Status</TableHead>}
                  <TableHead>Created</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchList.map((branch) => (
                  <TableRow key={branch.key}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    {title === "Active" && (
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            branch.review_status === "approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : branch.review_status === "in_review"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {branch.review_status === "approved"
                            ? "Approved"
                            : branch.review_status === "in_review"
                            ? "In Review"
                            : "Pending"}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>{branch.created_at || branch.lastModified || "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {branch.created_by || "Unknown"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {renderBranchTable(activeBranches, "Active")}
      {renderBranchTable(archivedBranches, "Archived")}
      {renderBranchTable(mergedBranches, "Merged")}
    </div>
  )
}
