import React from 'react'
import { useEditMode } from './EditModeProvider'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const CHART_TYPES = {
  bar: 'Bar Chart',
  line: 'Line Chart',
  area: 'Area Chart',
  pie: 'Pie Chart',
  radial: 'Radial Chart'
}

const CHART_OPTIONS = {
  insertions: ['bar', 'line', 'area'],
  detachments: ['bar', 'line', 'area'],
  teams: ['pie', 'radial']
}

export function ChartTypeSelector({ chartKey, label }) {
  const { preferences, updatePreference, isEditMode } = useEditMode()

  if (!isEditMode) return null

  const currentType = preferences?.charts?.[chartKey] || 'bar'
  const availableTypes = CHART_OPTIONS[chartKey] || ['bar', 'line', 'area']

  const handleChange = async (value) => {
    await updatePreference(`charts.${chartKey}`, value)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`chart-type-${chartKey}`}>{label || `Chart Type for ${chartKey}`}</Label>
      <select
        id={`chart-type-${chartKey}`}
        value={currentType}
        onChange={(e) => handleChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {availableTypes.map((type) => (
          <option key={type} value={type}>
            {CHART_TYPES[type] || type}
          </option>
        ))}
      </select>
    </div>
  )
}
