import React, { useState } from 'react'
import { useEditMode } from './EditModeProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Button } from './ui/button'

const CHANGELOG_SOURCES = [
  { value: 'figma', label: 'Figma Library' },
  { value: 'google-docs', label: 'Google Docs' },
  { value: 'notion', label: 'Notion' }
]

export function ChangelogConfig() {
  const { preferences, updatePreference, isEditMode } = useEditMode()
  const [source, setSource] = useState(preferences?.changelog?.source || 'figma')
  const [config, setConfig] = useState(preferences?.changelog?.config || {})

  if (!isEditMode) return null

  const handleSourceChange = async (newSource) => {
    setSource(newSource)
    await updatePreference('changelog.source', newSource)
  }

  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    updatePreference('changelog.config', newConfig)
  }

  const renderSourceConfig = () => {
    switch (source) {
      case 'google-docs':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-docs-id">Google Docs Document ID</Label>
              <input
                id="google-docs-id"
                type="text"
                value={config.documentId || ''}
                onChange={(e) => handleConfigChange('documentId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter document ID from URL"
              />
              <p className="text-xs text-muted-foreground">
                Extract the document ID from the Google Docs URL
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-api-key">Google API Key (Optional)</Label>
              <input
                id="google-api-key"
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter API key if needed"
              />
            </div>
          </div>
        )
      case 'notion':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notion-database-id">Notion Database ID</Label>
              <input
                id="notion-database-id"
                type="text"
                value={config.databaseId || ''}
                onChange={(e) => handleConfigChange('databaseId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter database ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notion-api-key">Notion API Key</Label>
              <input
                id="notion-api-key"
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter Notion integration token"
              />
              <p className="text-xs text-muted-foreground">
                Create an integration at notion.so/my-integrations
              </p>
            </div>
          </div>
        )
      default:
        return (
          <p className="text-sm text-muted-foreground">
            Changelog will be synced from Figma library using the sync-changelog script.
          </p>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changelog Source</CardTitle>
        <CardDescription>Configure where to fetch changelog data from</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="changelog-source">Source</Label>
            <select
              id="changelog-source"
              value={source}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CHANGELOG_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {renderSourceConfig()}
        </div>
      </CardContent>
    </Card>
  )
}
