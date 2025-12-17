import React, { useState, useEffect, useCallback } from "react"
import Papa from "papaparse"
import { FileText } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { ChartContainer } from "./ChartContainer"
import { DetachmentsChart } from "./DetachmentsChart"
import { InsertionsLineChart } from "./InsertionsLineChart"
import { DataTable } from "./DataTable"
import { IconsTable } from "./IconsTable"
import { UsagesTable } from "./UsagesTable"
import { FileUsagesTable } from "./FileUsagesTable"
import { ChangelogTable } from "./ChangelogTable"
import { TeamsPieChart } from "./TeamsPieChart"
import { BranchesTable } from "./BranchesTable"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { Slider } from "./ui/slider"
import { Header } from "./Header"
import { useEditMode } from "./EditModeProvider"
import { EditableText } from "./EditableText"
import { ChartFactory } from "./charts/ChartFactory"
import { ChartTypeSelector } from "./ChartTypeSelector"
import { ThemeEditor } from "./ThemeEditor"
import { CustomThemeEditor } from "./CustomThemeEditor"
import { ChangelogConfig } from "./ChangelogConfig"
import { TypographyEditor } from "./TypographyEditor"
import { AdminSidebar } from "./AdminSidebar"
import { useAdminMode } from "./AdminModeProvider"
import { loadConfigSync } from "../lib/config"

const CSV_FILES = [
  { name: "actions_by_component.csv", label: "Components" },
  { name: "icons", label: "Icons" },
  { name: "variable_actions_by_variable.csv", label: "Variables" },
  { name: "branches", label: "Branches" },
]

export function Dashboard() {
  const { preferences, updatePreference, isEditMode } = useEditMode()
  const { isAdminMode } = useAdminMode()
  const config = loadConfigSync()
  const [data, setData] = useState(null)
  const [fileUsageData, setFileUsageData] = useState(null)
  const [componentUsagesData, setComponentUsagesData] = useState(null)
  const [teamInsertionsData, setTeamInsertionsData] = useState(null)
  const [fileName, setFileName] = useState("")
  const [selectedFile, setSelectedFile] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(90)
  const [sliderValue, setSliderValue] = useState(0) // Will be set to maxInsertions when data loads

  const handleFileSelect = useCallback(async (csvFileName) => {
    setLoading(true)
    setError("")
    setSelectedFile(csvFileName)
    setFileName(csvFileName)
    setFileUsageData(null) // Reset file usage data when switching files
    setComponentUsagesData(null) // Reset component usages data when switching files
    setTeamInsertionsData(null) // Reset team insertions data when switching files

    // Handle branches - no CSV file needed
    if (csvFileName === "branches") {
      setLoading(false)
      setData(null) // Clear CSV data
      return
    }

    // Handle icons - use actions_by_component.csv but mark as icons
    const actualFileName = csvFileName === "icons" ? "actions_by_component.csv" : csvFileName

    try {
      const response = await fetch(`/csv/${actualFileName}`)
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`)
      }

      const text = await response.text()
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors.length > 0) {
            setError("Error parsing CSV: " + results.errors.map(e => e.message).join(", "))
            setLoading(false)
            return
          }
          setData(results.data)
          
          // If loading actions_by_component.csv (and not icons), also load usages_by_component.csv and usages_by_file.csv
          if (csvFileName === "actions_by_component.csv") {
            try {
              // Load usages_by_component.csv
              const usagesResponse = await fetch(`/csv/usages_by_component.csv`)
              if (usagesResponse.ok) {
                const usagesText = await usagesResponse.text()
                Papa.parse(usagesText, {
                  header: true,
                  skipEmptyLines: true,
                  complete: async (usagesResults) => {
                    if (usagesResults.errors.length === 0) {
                      setComponentUsagesData(usagesResults.data)
                      
                      // Also load usages_by_file.csv
                      try {
                        const fileResponse = await fetch(`/csv/usages_by_file.csv`)
                        if (fileResponse.ok) {
                          const fileText = await fileResponse.text()
                          Papa.parse(fileText, {
                            header: true,
                            skipEmptyLines: true,
                            complete: async (fileResults) => {
                              if (fileResults.errors.length === 0) {
                                setFileUsageData(fileResults.data)
                              }
                              
                              // Also load actions_by_team.csv for team insertions
                              try {
                                const teamResponse = await fetch(`/csv/actions_by_team.csv`)
                                if (teamResponse.ok) {
                                  const teamText = await teamResponse.text()
                                  Papa.parse(teamText, {
                                    header: true,
                                    skipEmptyLines: true,
                                    complete: (teamResults) => {
                                      if (teamResults.errors.length === 0) {
                                        setTeamInsertionsData(teamResults.data)
                                      }
                                      setLoading(false)
                                    },
                                    error: () => {
                                      setLoading(false)
                                    }
                                  })
                                } else {
                                  setLoading(false)
                                }
                              } catch {
                                setLoading(false)
                              }
                            },
                            error: () => {
                              setLoading(false)
                            }
                          })
                        } else {
                          // If usages_by_file.csv fails, still try to load actions_by_team.csv
                          try {
                            const teamResponse = await fetch(`/csv/actions_by_team.csv`)
                            if (teamResponse.ok) {
                              const teamText = await teamResponse.text()
                              Papa.parse(teamText, {
                                header: true,
                                skipEmptyLines: true,
                                complete: (teamResults) => {
                                  if (teamResults.errors.length === 0) {
                                    setTeamInsertionsData(teamResults.data)
                                  }
                                  setLoading(false)
                                },
                                error: () => {
                                  setLoading(false)
                                }
                              })
                            } else {
                              setLoading(false)
                            }
                          } catch {
                            setLoading(false)
                          }
                        }
                      } catch {
                        setLoading(false)
                      }
                    } else {
                      setLoading(false)
                    }
                  },
                  error: () => {
                    setLoading(false)
                  }
                })
              } else {
                setLoading(false)
              }
            } catch {
              setLoading(false)
            }
          } else {
            setLoading(false)
          }
        },
        error: (error) => {
          setError("Error reading file: " + error.message)
          setLoading(false)
        }
      })
    } catch (error) {
      setError("Error loading file: " + error.message)
      setLoading(false)
    }
  }, [])

  // Load first file by default
  useEffect(() => {
    if (!selectedFile && CSV_FILES.length > 0) {
      handleFileSelect(CSV_FILES[0].name)
    }
  }, [selectedFile, handleFileSelect])

  // Calculate max insertions for icons to set slider max
  const maxInsertions = React.useMemo(() => {
    if (!data || data.length === 0) return 0

    const today = new Date()
    const daysAgo = new Date(today)
    daysAgo.setDate(today.getDate() - days)

    const iconData = data
      .filter((row) => {
        if (!row.week || !row.insertions || !row.component_name) return false
        const componentName = row.component_name || ""
        if (!componentName.trim().startsWith("Icon -") && !componentName.trim().toLowerCase().includes("icon -")) {
          return false
        }
        const weekDate = new Date(row.week)
        if (isNaN(weekDate.getTime())) return false
        return weekDate >= daysAgo
      })
      .map((row) => parseFloat(row.insertions) || 0)

    return Math.max(...iconData, 0)
  }, [data, days])

  // Reset slider to max when days changes or data loads
  React.useEffect(() => {
    if (maxInsertions > 0) {
      setSliderValue(maxInsertions)
    }
  }, [days, maxInsertions])

  // Slider filters by maximum insertions
  // When sliderValue = maxInsertions (left): show all icons (no max filter)
  // When sliderValue is between max and 0: show icons with insertions <= sliderValue
  // When sliderValue = 0 (right): show only icons with 0 insertions
  const minInsertionsFilter = 0
  const maxInsertionsFilter = sliderValue === maxInsertions ? null : sliderValue

  const selectedFileLabel = selectedFile ? CSV_FILES.find(f => f.name === selectedFile)?.label : "Select a CSV file to visualize data"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header selectedFileLabel={selectedFileLabel} />
      <AdminSidebar />
      <div className="border-b border-border">
        <div className="px-4 md:px-8">
          <Tabs 
            value={selectedFile || "actions_by_component.csv"} 
            onValueChange={(value) => handleFileSelect(value)} 
            className="w-full"
          >
            <TabsList className="h-auto p-1 bg-transparent">
              {CSV_FILES.map((file) => (
                <TabsTrigger
                  key={file.name}
                  value={file.name}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm px-3 py-1.5 text-sm font-medium"
                >
                  {file.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className={`flex-1 p-4 md:p-8 transition-all duration-300 ${isAdminMode ? 'pr-[28rem]' : ''}`}>
        <div className="space-y-6">

          {loading && !data && selectedFile !== "branches" && (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground text-center">
                  Loading file...
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-destructive text-center">{error}</p>
              </CardContent>
            </Card>
          )}

          {data && !loading && selectedFile !== "branches" && (
            <>
            {selectedFile === "icons" ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle>Icons</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground mr-2">Period:</span>
                      <div className="inline-flex rounded-md border border-input" role="group">
                        <Button
                          variant={days === 30 ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setDays(30)}
                          className="rounded-r-none border-r border-input"
                        >
                          30 days
                        </Button>
                        <Button
                          variant={days === 60 ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setDays(60)}
                          className="rounded-none border-r border-input"
                        >
                          60 days
                        </Button>
                        <Button
                          variant={days === 90 ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setDays(90)}
                          className="rounded-l-none"
                        >
                          90 days
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardDescription>All inserted icons sorted by insertions (top to bottom)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Filter: {maxInsertionsFilter === null ? "All icons" : maxInsertionsFilter === 0 ? "Only 0 insertions" : `Insertions ≤ ${sliderValue.toLocaleString()}`}
                        </label>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{maxInsertions.toLocaleString()}</span>
                          <span className="text-xs">→</span>
                          <span>0</span>
                        </div>
                      </div>
                      <Slider
                        value={sliderValue}
                        onChange={setSliderValue}
                        min={0}
                        max={maxInsertions}
                        step={Math.max(1, Math.floor(maxInsertions / 100))}
                      />
                    </div>
                    <IconsTable data={data} days={days} minInsertions={minInsertionsFilter} maxInsertions={maxInsertionsFilter} />
                  </div>
                </CardContent>
              </Card>
            ) : (
            <div className="w-full space-y-6 mt-6">
                {fileName === "actions_by_component.csv" ? (
                      <div className="grid grid-cols-3 gap-6">
                        {/* Period control at the top */}
                        <div className="col-span-3 mb-4">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-sm text-muted-foreground mr-2">Period:</span>
                            <div className="inline-flex rounded-md border border-input" role="group">
                              <Button
                                variant={days === 30 ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setDays(30)}
                                className="rounded-r-none border-r border-input"
                              >
                                30 days
                              </Button>
                              <Button
                                variant={days === 60 ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setDays(60)}
                                className="rounded-none border-r border-input"
                              >
                                60 days
                              </Button>
                              <Button
                                variant={days === 90 ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setDays(90)}
                                className="rounded-l-none"
                              >
                                90 days
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Left side - 2/3 width */}
                        <div className="col-span-2 space-y-6">
                          {isEditMode && (
                            <div className="space-y-4">
                              <TypographyEditor />
                              <ThemeEditor />
                              <CustomThemeEditor />
                              <ChangelogConfig />
                            </div>
                          )}
                          <div className="space-y-2">
                            <div>
                              <EditableText
                                value={config?.content?.titles?.totalInsertions || "Total Insertions Over Time"}
                                onChange={(value) => updatePreference('content.titles.totalInsertions', value)}
                                as="h2"
                                className="text-2xl font-semibold"
                              />
                              <EditableText
                                value={config?.content?.descriptions?.totalInsertions || "Total insertions by component sets over time (excluding icons)"}
                                onChange={(value) => updatePreference('content.descriptions.totalInsertions', value)}
                                as="p"
                                className="text-sm text-muted-foreground mt-1"
                              />
                            </div>
                            <InsertionsLineChart 
                              data={data} 
                              days={days}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div>
                                <EditableText
                                  value={config?.content?.titles?.topInsertions || "Top 10 Components by Insertions"}
                                  onChange={(value) => updatePreference('content.titles.topInsertions', value)}
                                  as="h2"
                                  className="text-2xl font-semibold"
                                />
                                <EditableText
                                  value={(config?.content?.descriptions?.topInsertions || "Components with the most insertions in the last {days} days (excluding icons)").replace('{days}', days)}
                                  onChange={(value) => updatePreference('content.descriptions.topInsertions', value)}
                                  as="p"
                                  className="text-sm text-muted-foreground mt-1"
                                />
                              </div>
                              <Card>
                                <CardContent>
                                  {isEditMode && (
                                    <div className="mb-4">
                                      <ChartTypeSelector chartKey="insertions" label="Chart Type for Insertions" />
                                    </div>
                                  )}
                                  <ChartFactory
                                    type={preferences?.charts?.insertions || 'bar'}
                                    data={data}
                                    dataKey="insertions"
                                    nameKey="name"
                                    days={days}
                                  />
                                </CardContent>
                              </Card>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <EditableText
                                  value={config?.content?.titles?.topDetachments || "Top 10 Components by Detachments"}
                                  onChange={(value) => updatePreference('content.titles.topDetachments', value)}
                                  as="h2"
                                  className="text-2xl font-semibold"
                                />
                                <EditableText
                                  value={(config?.content?.descriptions?.topDetachments || "Components with the most detachments in the last {days} days (excluding icons)").replace('{days}', days)}
                                  onChange={(value) => updatePreference('content.descriptions.topDetachments', value)}
                                  as="p"
                                  className="text-sm text-muted-foreground mt-1"
                                />
                              </div>
                              <Card>
                                <CardContent>
                                  {isEditMode && (
                                    <div className="mb-4">
                                      <ChartTypeSelector chartKey="detachments" label="Chart Type for Detachments" />
                                    </div>
                                  )}
                                  <ChartFactory
                                    type={preferences?.charts?.detachments || 'bar'}
                                    data={data}
                                    dataKey="detachments"
                                    nameKey="name"
                                    days={days}
                                  />
                                </CardContent>
                              </Card>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <EditableText
                                value={config?.content?.titles?.componentsList || "List of Components and Variants"}
                                onChange={(value) => updatePreference('content.titles.componentsList', value)}
                                as="h2"
                                className="text-2xl font-semibold"
                              />
                              <EditableText
                                value={config?.content?.descriptions?.componentsList || "View and explore your data in tabular format (sorted by insertions, excluding icons)"}
                                onChange={(value) => updatePreference('content.descriptions.componentsList', value)}
                                as="p"
                                className="text-sm text-muted-foreground mt-1"
                              />
                            </div>
                            <Card>
                              <CardContent>
                                <DataTable data={data} days={days} />
                              </CardContent>
                            </Card>
                          </div>

                          {componentUsagesData && (
                            <>
                              {teamInsertionsData && (
                                <div className="space-y-2">
                                  {isEditMode && (
                                    <ChartTypeSelector chartKey="teams" label="Chart Type for Teams" />
                                  )}
                                  <div>
                                    <EditableText
                                      value={config?.content?.titles?.teamInstances || "Team Instances Distribution"}
                                      onChange={(value) => updatePreference('content.titles.teamInstances', value)}
                                      as="h2"
                                      className="text-2xl font-semibold"
                                    />
                                    <EditableText
                                      value={(config?.content?.descriptions?.teamInstances || "Component insertions by team in the last {days} days (top 10 teams shown, rest grouped as Other)").replace('{days}', days)}
                                      onChange={(value) => updatePreference('content.descriptions.teamInstances', value)}
                                      as="p"
                                      className="text-sm text-muted-foreground mt-1"
                                    />
                                  </div>
                                  <Card>
                                    <CardContent className="pt-6">
                                      {preferences?.charts?.teams === 'radial' ? (
                                        <ChartFactory
                                          type="radial"
                                          data={teamInsertionsData}
                                          dataKey="value"
                                          nameKey="name"
                                          days={days}
                                        />
                                      ) : (
                                        <TeamsPieChart data={teamInsertionsData} days={days} />
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                              {fileUsageData && (
                                <div className="grid grid-cols-2 gap-6">
                                  <Card>
                                    <CardHeader>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        <CardTitle>Component Usages</CardTitle>
                                      </div>
                                      <CardDescription>
                                        Overview of component usage across files, teams, and total instances
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <UsagesTable data={componentUsagesData} />
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        <CardTitle>File Usages</CardTitle>
                                      </div>
                                      <CardDescription>
                                        All files using the library with team names and total instances per file
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      {fileUsageData ? (
                                        <FileUsagesTable data={fileUsageData} />
                                      ) : (
                                        <div className="text-muted-foreground">Loading file usage data...</div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Right side - 1/3 width */}
                        <div className="col-span-1">
                          <div className="space-y-2">
                            <div>
                              <EditableText
                                value={config?.content?.titles?.changelog || "Changelog"}
                                onChange={(value) => updatePreference('content.titles.changelog', value)}
                                as="h2"
                                className="text-2xl font-semibold"
                              />
                              <EditableText
                                value={config?.content?.descriptions?.changelog || "Component library version history and updates"}
                                onChange={(value) => updatePreference('content.descriptions.changelog', value)}
                                as="p"
                                className="text-sm text-muted-foreground mt-1"
                              />
                            </div>
                            <Card>
                              <CardContent>
                                <ChangelogTable />
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Period control at the top */}
                        <div className="mb-4">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-sm text-muted-foreground mr-2">Period:</span>
                            <div className="inline-flex rounded-md border border-input" role="group">
                              <Button
                                variant={days === 30 ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setDays(30)}
                                className="rounded-r-none border-r border-input"
                              >
                                30 days
                              </Button>
                              <Button
                                variant={days === 60 ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setDays(60)}
                                className="rounded-none border-r border-input"
                              >
                                60 days
                              </Button>
                              <Button
                                variant={days === 90 ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setDays(90)}
                                className="rounded-l-none"
                              >
                                90 days
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div>
                              <EditableText
                                value={config?.content?.titles?.topInsertions || "Top 10 Components by Insertions"}
                                onChange={(value) => updatePreference('content.titles.topInsertions', value)}
                                as="h2"
                                className="text-2xl font-semibold"
                              />
                              <EditableText
                                value={(config?.content?.descriptions?.topInsertions || "Components with the most insertions in the last {days} days (excluding icons)").replace('{days}', days)}
                                onChange={(value) => updatePreference('content.descriptions.topInsertions', value)}
                                as="p"
                                className="text-sm text-muted-foreground mt-1"
                              />
                            </div>
                            <Card>
                              <CardContent>
                                {isEditMode && (
                                  <div className="mb-4">
                                    <ChartTypeSelector chartKey="insertions" label="Chart Type for Insertions" />
                                  </div>
                                )}
                                <ChartFactory
                                  type={preferences?.charts?.insertions || 'bar'}
                                  data={data}
                                  dataKey="insertions"
                                  nameKey="name"
                                  days={days}
                                />
                              </CardContent>
                            </Card>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <EditableText
                                value={config?.content?.titles?.topDetachments || "Top 10 Components by Detachments"}
                                onChange={(value) => updatePreference('content.titles.topDetachments', value)}
                                as="h2"
                                className="text-2xl font-semibold"
                              />
                              <EditableText
                                value={(config?.content?.descriptions?.topDetachments || "Components with the most detachments in the last {days} days (excluding icons)").replace('{days}', days)}
                                onChange={(value) => updatePreference('content.descriptions.topDetachments', value)}
                                as="p"
                                className="text-sm text-muted-foreground mt-1"
                              />
                            </div>
                            <Card>
                              <CardContent>
                                {isEditMode && (
                                  <div className="mb-4">
                                    <ChartTypeSelector chartKey="detachments" label="Chart Type for Detachments" />
                                  </div>
                                )}
                                <ChartFactory
                                  type={preferences?.charts?.detachments || 'bar'}
                                  data={data}
                                  dataKey="detachments"
                                  nameKey="name"
                                  days={days}
                                />
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <EditableText
                              value={config?.content?.titles?.componentsList || "List of Components and Variants"}
                              onChange={(value) => updatePreference('content.titles.componentsList', value)}
                              as="h2"
                              className="text-2xl font-semibold"
                            />
                            <EditableText
                              value={config?.content?.descriptions?.componentsList || "View and explore your data in tabular format (sorted by insertions, excluding icons)"}
                              onChange={(value) => updatePreference('content.descriptions.componentsList', value)}
                              as="p"
                              className="text-sm text-muted-foreground mt-1"
                            />
                          </div>
                          <Card>
                            <CardContent>
                              <DataTable data={data} days={days} />
                            </CardContent>
                          </Card>
                        </div>
                      </>
                    )}
            </div>
            )}
            </>
          )}

          {selectedFile === "branches" && (
            <div className="w-full space-y-6 mt-6">
              <BranchesTable />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

