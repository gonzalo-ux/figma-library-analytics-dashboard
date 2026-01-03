import React, { useState } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Plus, Trash2 } from 'lucide-react'

/**
 * LibraryConfig component allows users to configure multiple Figma libraries
 * Each library can have filters to exclude certain components/variables
 */
export function LibraryConfig({ libraries, onChange }) {
  const [localLibraries, setLocalLibraries] = useState(libraries || [])

  const handleAddLibrary = () => {
    const newLibrary = {
      id: Date.now().toString(),
      url: '',
      name: ''
    }
    const updated = [...localLibraries, newLibrary]
    setLocalLibraries(updated)
    onChange(updated)
  }

  const handleRemoveLibrary = (id) => {
    const updated = localLibraries.filter(lib => lib.id !== id)
    setLocalLibraries(updated)
    onChange(updated)
  }

  const handleLibraryChange = (id, field, value) => {
    const updated = localLibraries.map(lib => {
      if (lib.id === id) {
        return { ...lib, [field]: value }
      }
      return lib
    })
    setLocalLibraries(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Figma Libraries</h3>
          <p className="text-sm text-muted-foreground">
            Add one or more Figma libraries to track. You can apply filters per page later.
          </p>
        </div>
        <Button onClick={handleAddLibrary} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Library
        </Button>
      </div>

      {localLibraries.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">
              No libraries configured yet. Click "Add Library" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localLibraries.map((library, index) => (
            <Card key={library.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Library {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLibrary(library.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`library-url-${library.id}`}>Library URL</Label>
                  <input
                    id={`library-url-${library.id}`}
                    type="url"
                    value={library.url}
                    onChange={(e) => handleLibraryChange(library.id, 'url', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="https://www.figma.com/file/ABC123XYZ/Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`library-name-${library.id}`}>Library Display Name</Label>
                  <input
                    id={`library-name-${library.id}`}
                    type="text"
                    value={library.name}
                    onChange={(e) => handleLibraryChange(library.id, 'name', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g., Components, Icons, Design Tokens"
                  />
                  <p className="text-xs text-muted-foreground">
                    This name helps you identify the library. Configure filters per page below.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

