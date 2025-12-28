import React, { useState } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Switch } from './ui/switch'

/**
 * PageConfig component allows users to configure dashboard pages/tabs
 * Each page can be linked to a specific library
 */
export function PageConfig({ pages, libraries, onChange }) {
  const [localPages, setLocalPages] = useState(pages || [])
  const [expandedPages, setExpandedPages] = useState({}) // Track which pages have filters expanded

  const handleAddPage = () => {
    const newPage = {
      id: Date.now().toString(),
      name: '',
      libraryId: libraries?.[0]?.id || '',
      type: 'components',
      useFilters: false,
      filters: {
        include: {
          prefix: '',
          suffix: '',
          contains: ''
        },
        exclude: {
          prefix: '',
          suffix: '',
          contains: ''
        }
      }
    }
    const updated = [...localPages, newPage]
    setLocalPages(updated)
    onChange(updated)
  }

  const handleRemovePage = (id) => {
    const updated = localPages.filter(page => page.id !== id)
    setLocalPages(updated)
    onChange(updated)
  }

  const handlePageChange = (id, field, value) => {
    const updated = localPages.map(page => {
      if (page.id === id) {
        if (field.startsWith('filters.include.') || field.startsWith('filters.exclude.')) {
          const parts = field.split('.')
          const filterType = parts[1] // 'include' or 'exclude'
          const filterField = parts[2] // 'prefix', 'suffix', or 'contains'
          return {
            ...page,
            filters: {
              ...page.filters,
              [filterType]: {
                ...page.filters[filterType],
                [filterField]: value
              }
            }
          }
        }
        return { ...page, [field]: value }
      }
      return page
    })
    setLocalPages(updated)
    onChange(updated)
  }

  const toggleFiltersExpanded = (pageId) => {
    setExpandedPages(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dashboard Pages</h3>
          <p className="text-sm text-muted-foreground">
            Configure the tabs/pages in your dashboard. Each page shows data from one library and can have optional filters.
          </p>
        </div>
        <Button onClick={handleAddPage} size="sm" disabled={!libraries || libraries.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Add Page
        </Button>
      </div>

      {!libraries || libraries.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">
              Please add at least one library first before configuring pages.
            </p>
          </CardContent>
        </Card>
      ) : localPages.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">
              No pages configured yet. Click "Add Page" to create your first dashboard page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {localPages.map((page, index) => (
            <Card key={page.id}>
              <CardContent className="py-4">
                <div className="space-y-4">
                  {/* Main page configuration */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor={`page-name-${page.id}`} className="text-xs">
                          Page Name
                        </Label>
                        <input
                          id={`page-name-${page.id}`}
                          type="text"
                          value={page.name}
                          onChange={(e) => handlePageChange(page.id, 'name', e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                          placeholder="e.g., Components, Icons"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`page-library-${page.id}`} className="text-xs">
                          Library Source
                        </Label>
                        <select
                          id={`page-library-${page.id}`}
                          value={page.libraryId}
                          onChange={(e) => handlePageChange(page.id, 'libraryId', e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                          {libraries.map(lib => (
                            <option key={lib.id} value={lib.id}>
                              {lib.name || lib.url || 'Unnamed Library'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`page-type-${page.id}`} className="text-xs">
                          Data Type
                        </Label>
                        <select
                          id={`page-type-${page.id}`}
                          value={page.type}
                          onChange={(e) => handlePageChange(page.id, 'type', e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                          <option value="components">Components</option>
                          <option value="variables">Variables</option>
                          <option value="styles">Styles</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePage(page.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Filters section */}
                  <div className="border-t pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`use-filters-${page.id}`}
                          checked={page.useFilters || false}
                          onCheckedChange={(checked) => {
                            handlePageChange(page.id, 'useFilters', checked)
                            if (checked) {
                              setExpandedPages(prev => ({ ...prev, [page.id]: true }))
                            }
                          }}
                        />
                        <Label htmlFor={`use-filters-${page.id}`} className="text-sm font-medium cursor-pointer">
                          Use Filters
                        </Label>
                      </div>
                      
                      {page.useFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFiltersExpanded(page.id)}
                          className="h-8 px-2"
                        >
                          {expandedPages[page.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {page.useFilters && expandedPages[page.id] && (
                      <div className="space-y-3 pl-6">
                        {/* Include Filters */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Include Only (Optional)</Label>
                          <p className="text-xs text-muted-foreground">
                            Show only items matching these criteria. Leave empty to include all.
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor={`filter-include-prefix-${page.id}`} className="text-xs">
                                Starts with
                              </Label>
                              <input
                                id={`filter-include-prefix-${page.id}`}
                                type="text"
                                value={page.filters?.include?.prefix || ''}
                                onChange={(e) => handlePageChange(page.id, 'filters.include.prefix', e.target.value)}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                placeholder="e.g., Button"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`filter-include-suffix-${page.id}`} className="text-xs">
                                Ends with
                              </Label>
                              <input
                                id={`filter-include-suffix-${page.id}`}
                                type="text"
                                value={page.filters?.include?.suffix || ''}
                                onChange={(e) => handlePageChange(page.id, 'filters.include.suffix', e.target.value)}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                placeholder="e.g., /Large"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`filter-include-contains-${page.id}`} className="text-xs">
                                Contains
                              </Label>
                              <input
                                id={`filter-include-contains-${page.id}`}
                                type="text"
                                value={page.filters?.include?.contains || ''}
                                onChange={(e) => handlePageChange(page.id, 'filters.include.contains', e.target.value)}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                placeholder="e.g., icon"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Exclude Filters */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Exclude (Optional)</Label>
                          <p className="text-xs text-muted-foreground">
                            Remove items matching these criteria from the results.
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor={`filter-exclude-prefix-${page.id}`} className="text-xs">
                                Starts with
                              </Label>
                              <input
                                id={`filter-exclude-prefix-${page.id}`}
                                type="text"
                                value={page.filters?.exclude?.prefix || ''}
                                onChange={(e) => handlePageChange(page.id, 'filters.exclude.prefix', e.target.value)}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                placeholder="e.g., _draft"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`filter-exclude-suffix-${page.id}`} className="text-xs">
                                Ends with
                              </Label>
                              <input
                                id={`filter-exclude-suffix-${page.id}`}
                                type="text"
                                value={page.filters?.exclude?.suffix || ''}
                                onChange={(e) => handlePageChange(page.id, 'filters.exclude.suffix', e.target.value)}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                placeholder="e.g., /old"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`filter-exclude-contains-${page.id}`} className="text-xs">
                                Contains
                              </Label>
                              <input
                                id={`filter-exclude-contains-${page.id}`}
                                type="text"
                                value={page.filters?.exclude?.contains || ''}
                                onChange={(e) => handlePageChange(page.id, 'filters.exclude.contains', e.target.value)}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                placeholder="e.g., deprecated"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

