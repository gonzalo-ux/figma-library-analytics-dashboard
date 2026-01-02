import React, { useState, useEffect, useCallback, useMemo } from "react"
import Papa from "papaparse"
import { FileText, Component, Bolt, Smile, Type } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { ChartContainer } from "./ChartContainer"
import { DetachmentsChart } from "./DetachmentsChart"
import { InsertionsLineChart } from "./InsertionsLineChart"
import { DataTable } from "./DataTable"
import { UsagesTable } from "./UsagesTable"
import { FileUsagesTable } from "./FileUsagesTable"
import { ChangelogTable } from "./ChangelogTable"
import { TeamsPieChart } from "./TeamsPieChart"
import { BranchesTable } from "./BranchesTable"
import { PublicationCalendar } from "./PublicationCalendar"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
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
import { DateRangePicker } from "./DateRangePicker"
import { getConfiguredPages, filterDataForPage, getLibraryForPage } from "../lib/dataFilter"

export function Dashboard() {
  const { preferences, updatePreference, isEditMode } = useEditMode()
  const { isAdminMode } = useAdminMode()
  const config = loadConfigSync()
  const [data, setData] = useState(null)
  const [fileUsageData, setFileUsageData] = useState(null)
  const [componentUsagesData, setComponentUsagesData] = useState(null)
  const [teamInsertionsData, setTeamInsertionsData] = useState(null)
  const [variableInsertionsData, setVariableInsertionsData] = useState(null)
  const [stylesData, setStylesData] = useState(null)
  const [versionHistoryData, setVersionHistoryData] = useState(null)
  const [fileName, setFileName] = useState("")
  const [selectedPageId, setSelectedPageId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Get configured pages from config, or use legacy defaults for backward compatibility
  const configuredPages = useMemo(() => {
    const pages = getConfiguredPages(config)
    if (pages.length > 0) {
      return pages
    }
    // Backward compatibility: use legacy structure
    return [
      { id: 'components', name: 'Components', type: 'components' },
      { id: 'variables', name: 'Variables', type: 'variables' },
      { id: 'branches', name: 'Branches', type: 'branches' }
    ]
  }, [config])
  // Initialize with 90 days ago to today
  const getInitialDateRange = () => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 90)
    startDate.setHours(0, 0, 0, 0)
    return { startDate, endDate: today }
  }
  const [dateRange, setDateRange] = useState(getInitialDateRange())

  // Calculate days from date range for backward compatibility
  const days = useMemo(() => {
    const diffTime = Math.abs(dateRange.endDate - dateRange.startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }, [dateRange])

  const handleDateRangeChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate })
  }

  // Helper function to get CSV path with library folder
  const getCsvPath = useCallback((fileName, pageId) => {
    if (!pageId || !config) {
      return `/csv/${fileName}`
    }
    
    const library = getLibraryForPage(config, pageId)
    if (!library || !library.name) {
      return `/csv/${fileName}`
    }
    
    // Sanitize library name to match server-side sanitization
    const sanitizeLibraryName = (name) => {
      if (!name || typeof name !== 'string') {
        return 'default'
      }
      // Replace invalid filesystem characters with underscores
      return name.replace(/[^a-zA-Z0-9_-]/g, '_').trim() || 'default'
    }
    
    const libraryFolder = sanitizeLibraryName(library.name)
    return `/csv/${libraryFolder}/${fileName}`
  }, [config])

  const handlePageSelect = useCallback(async (pageId) => {
    setLoading(true)
    setError("")
    setSelectedPageId(pageId)
    setFileUsageData(null)
    setComponentUsagesData(null)
    setTeamInsertionsData(null)
    setVariableInsertionsData(null)
    setStylesData(null)

    const page = configuredPages.find(p => p.id === pageId)
    if (!page) {
      setError('Page not found')
      setLoading(false)
      return
    }

    // Handle branches - no CSV file needed
    if (page.type === "branches") {
      setLoading(false)
      setData(null)
      setFileName("")
      return
    }

    // Determine CSV file based on page type
    let csvFileName = ""
    switch (page.type) {
      case 'components':
        csvFileName = 'actions_by_component.csv'
        setFileName(csvFileName)
        break
      case 'variables':
        csvFileName = 'variable_actions_by_variable.csv'
        setFileName(csvFileName)
        break
      case 'styles':
        csvFileName = 'styles_actions_by_style.csv'
        setFileName(csvFileName)
        break
      default:
        setError(`Unknown page type: ${page.type}`)
        setLoading(false)
        return
    }

    try {
      const csvPath = getCsvPath(csvFileName, pageId)
      const response = await fetch(csvPath)
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
          
          // Apply page-specific filters
          const filteredData = filterDataForPage(results.data, config, pageId)
          setData(filteredData)
          
          // Load additional data files for components pages
          if (page.type === 'components') {
            try {
              // Load usages_by_component.csv
              const usagesPath = getCsvPath('usages_by_component.csv', pageId)
              const usagesResponse = await fetch(usagesPath)
              if (usagesResponse.ok) {
                const usagesText = await usagesResponse.text()
                Papa.parse(usagesText, {
                  header: true,
                  skipEmptyLines: true,
                  complete: async (usagesResults) => {
                    if (usagesResults.errors.length === 0) {
                      setComponentUsagesData(usagesResults.data)
                      
                      // Load usages_by_file.csv
                      try {
                        const filePath = getCsvPath('usages_by_file.csv', pageId)
                        const fileResponse = await fetch(filePath)
                        if (fileResponse.ok) {
                          const fileText = await fileResponse.text()
                          Papa.parse(fileText, {
                            header: true,
                            skipEmptyLines: true,
                            complete: async (fileResults) => {
                              if (fileResults.errors.length === 0) {
                                setFileUsageData(fileResults.data)
                              }
                              
                              // Load actions_by_team.csv
                              try {
                                const teamPath = getCsvPath('actions_by_team.csv', pageId)
                                const teamResponse = await fetch(teamPath)
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
                                    error: () => setLoading(false)
                                  })
                                } else {
                                  setLoading(false)
                                }
                              } catch {
                                setLoading(false)
                              }
                            },
                            error: () => setLoading(false)
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
                  error: () => setLoading(false)
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
  }, [configuredPages, config, getCsvPath])
  // Load first page by default
  useEffect(() => {
    if (!selectedPageId && configuredPages.length > 0) {
      handlePageSelect(configuredPages[0].id)
    }
  }, [selectedPageId, configuredPages, handlePageSelect])

  // Load version history data
  useEffect(() => {
    const loadVersionHistory = async () => {
      try {
        // version_history.json is stored at the root csv folder (not library-specific)
        const response = await fetch('/csv/version_history.json')
        if (response.ok) {
          const data = await response.json()
          setVersionHistoryData(data)
        }
      } catch (error) {
        console.error('Failed to load version history:', error)
      }
    }
    
    loadVersionHistory()
  }, [])

  const selectedPage = selectedPageId ? configuredPages.find(p => p.id === selectedPageId) : null
  const selectedPageLabel = selectedPage?.name || "Select a page to visualize data"

  // Calculate total components (matching DataTable logic)
  const totalComponents = useMemo(() => {
    if (!data || data.length === 0 || selectedPage?.type !== "components") {
      return 0
    }

    // Filter and count unique component_set_name values, excluding icons
    const componentSetSet = new Set()

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

      // Only include rows with a component_set_name
      const componentSetName = row.component_set_name || ""
      if (!componentSetName.trim()) {
        return
      }

      // Parse the week date
      const weekDate = new Date(row.week)
      if (isNaN(weekDate.getTime())) {
        return
      }

      // Filter by date range
      if (weekDate >= dateRange.startDate && weekDate <= dateRange.endDate) {
        componentSetSet.add(componentSetName)
      }
    })

    return componentSetSet.size
  }, [data, dateRange, selectedPage])

  // Calculate total variables (from variableInsertionsData)
  const totalVariables = useMemo(() => {
    if (!variableInsertionsData || variableInsertionsData.length === 0 || selectedPage?.type !== "components") {
      return 0
    }

    // Filter and count unique variable_name values
    const variableSet = new Set()

    variableInsertionsData.forEach((row) => {
      // Check if row has required columns
      if (!row.week || !row.insertions) {
        return
      }

      // Get variable identifier (variable_name or variable_key)
      const variableName = row.variable_name || row.variable_key || ""
      if (!variableName.trim()) {
        return
      }

      // Parse the week date
      const weekDate = new Date(row.week)
      if (isNaN(weekDate.getTime())) {
        return
      }

      // Filter by date range
      if (weekDate >= dateRange.startDate && weekDate <= dateRange.endDate) {
        variableSet.add(variableName)
      }
    })

    return variableSet.size
  }, [variableInsertionsData, dateRange, selectedPage])

  // Calculate total icons (components whose names start with "Icon -")
  const totalIcons = useMemo(() => {
    if (!data || data.length === 0 || selectedPage?.type !== "components") {
      return 0
    }

    // Filter and count unique component_name values that are icons
    const iconSet = new Set()

    data.forEach((row) => {
      // Check if row has required columns
      if (!row.week || !row.insertions || !row.component_name) {
        return
      }

      // Only include icon components
      const componentName = row.component_name || ""
      if (!componentName.trim().startsWith("Icon -") && !componentName.trim().toLowerCase().includes("icon -")) {
        return
      }

      // Parse the week date
      const weekDate = new Date(row.week)
      if (isNaN(weekDate.getTime())) {
        return
      }

      // Filter by date range
      if (weekDate >= dateRange.startDate && weekDate <= dateRange.endDate) {
        iconSet.add(componentName)
      }
    })

    return iconSet.size
  }, [data, dateRange, selectedPage])

  // Calculate total text styles (styles with style_type === "TEXT")
  const totalTextStyles = useMemo(() => {
    if (!stylesData || stylesData.length === 0 || selectedPage?.type !== "components") {
      return 0
    }

    // Filter and count unique style_name values that are TEXT type
    const textStyleSet = new Set()

    stylesData.forEach((row) => {
      // Check if row has required columns
      if (!row.week || !row.insertions || !row.style_name || !row.style_type) {
        return
      }

      // Only include TEXT styles
      const styleType = (row.style_type || "").trim()
      if (styleType !== "TEXT") {
        return
      }

      // Parse the week date
      const weekDate = new Date(row.week)
      if (isNaN(weekDate.getTime())) {
        return
      }

      // Filter by date range
      if (weekDate >= dateRange.startDate && weekDate <= dateRange.endDate) {
        textStyleSet.add(row.style_name)
      }
    })

    return textStyleSet.size
  }, [stylesData, dateRange, selectedPage])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header selectedFileLabel={selectedPageLabel} />
      <AdminSidebar />
      <div className="border-b border-border">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between w-full">
            <Tabs 
              value={selectedPageId || (configuredPages.length > 0 ? configuredPages[0].id : "")} 
              onValueChange={(value) => handlePageSelect(value)} 
              className="flex-1"
            >
              <TabsList className="h-auto p-1 bg-transparent">
                {configuredPages.map((page) => (
                  <TabsTrigger
                    key={page.id}
                    value={page.id}
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm px-3 py-1.5 text-sm font-medium"
                  >
                    {page.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={handleDateRangeChange}
            />
          </div>
        </div>
      </div>
      <div className={`flex-1 p-4 md:p-8 transition-all duration-300 ${isAdminMode ? 'pr-[28rem]' : ''}`}>
        <div className="space-y-6">

          {loading && !data && selectedPage?.type !== "branches" && (
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

          {data && !loading && selectedPage?.type !== "branches" && (
            <>
            <div className="w-full space-y-6 mt-6">
                {selectedPage?.type === "components" ? (
                      <div className="grid grid-cols-3 gap-6">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                              <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Component className="h-6 w-6 text-primary" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Total Components</span>
                                    <span className="text-3xl font-bold text-primary">{totalComponents}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Bolt className="h-6 w-6 text-primary" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Total Variables</span>
                                    <span className="text-3xl font-bold text-primary">{totalVariables}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Smile className="h-6 w-6 text-primary" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Total Icons</span>
                                    <span className="text-3xl font-bold text-primary">{totalIcons}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Type className="h-6 w-6 text-primary" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Total Text Styles</span>
                                    <span className="text-3xl font-bold text-primary">{totalTextStyles}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
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
                              variableData={variableInsertionsData}
                              textStylesData={stylesData}
                              days={days}
                            />
                          </div>

                          {/* Publication Calendar */}
                          <div className="space-y-2">
                            <div>
                              <EditableText
                                value={config?.content?.titles?.publicationActivity || "Publication Activity"}
                                onChange={(value) => updatePreference('content.titles.publicationActivity', value)}
                                as="h2"
                                className="text-2xl font-semibold"
                              />
                              <EditableText
                                value={config?.content?.descriptions?.publicationActivity || "Library publication history over the last year"}
                                onChange={(value) => updatePreference('content.descriptions.publicationActivity', value)}
                                as="p"
                                className="text-sm text-muted-foreground mt-1"
                              />
                            </div>
                            <PublicationCalendar 
                              versionData={versionHistoryData}
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
                          {/* Changelog */}
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
            </>
          )}

          {selectedPage?.type === "branches" && (
            <div className="w-full space-y-6 mt-6">
              <BranchesTable />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

