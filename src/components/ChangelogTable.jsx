import React, { useState, useEffect } from "react"
import changelogData from "../data/changelog.json"
import { parseChangelogDescription } from "../lib/parseChangelogDescription"
import { createChangelogAdapter } from "../lib/changelog"
import { loadConfigSync } from "../lib/config"

// Fallback data if JSON file is not available
const FALLBACK_CHANGELOG_DATA = [
  {
    version: "7.7.6",
    date: "2025-11-14",
    description: (
      <>
        ❖ Buttons group in action sheet and dialog
        <ul className="list-disc ml-6 mt-1">
          <li>Change to primary button first order</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.7.5",
    date: "2025-11-12",
    description: (
      <>
        ❖ Logo
        <ul className="list-disc ml-6 mt-1">
          <li>Update brand logos</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.7.5",
    date: "2025-10-24",
    description: (
      <>
        ❖ Icon
        <ul className="list-disc ml-6 mt-1">
          <li>Avatar Add, Pin outlined, Pin filled</li>
        </ul>
        ♥ General
        <ul className="list-disc ml-6 mt-1">
          <li>Update r400 to #F8323C</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.7.4",
    date: "2025-09-19",
    description: (
      <>
        ❖ Icon
        <ul className="list-disc ml-6 mt-1">
          <li>Add modelSparkle</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.7.3",
    date: "2025-08-27",
    description: (
      <>
        ❖ Tab
        <ul className="list-disc ml-6 mt-1">
          <li>Remove vertical dividers</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.7.2",
    date: "2025-08-19",
    description: (
      <>
        ❖ Footer
        <ul className="list-disc ml-6 mt-1">
          <li>Change background to tertiary and add an additional divider</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.7.1",
    date: "2025-08-14",
    description: (
      <>
        ❖ Image ratio
        <ul className="list-disc ml-6 mt-1">
          <li>Fix layers order</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.7.0",
    date: "2025-08-11",
    description: (
      <>
        ❖ Scrim gradient
        <p className="mt-1">Scrim gradient added</p>
      </>
    ),
  },
  {
    version: "7.6.2",
    date: "2025-08-05",
    description: (
      <>
        ❖ Action Sheet
        <p className="mt-1">Drawer handle added</p>
      </>
    ),
  },
  {
    version: "7.6.1",
    date: "2025-07-31",
    description: (
      <>
        ♥ General
        <ul className="list-disc ml-6 mt-1">
          <li>Introduce r400 in the palette</li>
          <li>Update sale color tokens on Dark mode to fix contrast</li>
          <li>Update opacity.disabled token on Dark mode to 40%</li>
        </ul>
        <p className="mt-2">Pause Bars icon added</p>
        <ul className="list-disc ml-6 mt-1">
          <li>to be used in the new Icon Button - Video Control Overlay</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.5.2",
    date: "2025-07-24",
    description: (
      <>
        ♥ General
        <ul className="list-disc ml-6 mt-1">
          <li>Test product card tokens</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.5.1",
    date: "2025-07-24",
    description: (
      <>
        ♥ General
        <ul className="list-disc ml-6 mt-1">
          <li>Update opacity disabled token on DM to 40%</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.5.0",
    date: "2025-07-21",
    description: (
      <>
        <ul className="list-disc ml-6 mt-1">
          <li>Add hanger sparkle and view items</li>
        </ul>
      </>
    ),
  },
  {
    version: "7.4.0",
    date: "2025-07-17",
    description: (
      <>
        ❖ Flag
        <ul className="list-disc ml-6 mt-1">
          <li>Add text label properties</li>
        </ul>
      </>
    ),
  },
]

export function ChangelogTable({ data: propData }) {
  const [data, setData] = useState(propData || changelogData || FALLBACK_CHANGELOG_DATA)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If data is provided as prop, use it
    if (propData) {
      setData(propData)
      return
    }

    // Otherwise, try to load from configured source
    const loadChangelog = async () => {
      try {
        const config = loadConfigSync()
        const source = config?.changelog?.source || 'figma'
        
        if (source === 'figma') {
          // Use existing changelog.json
          setData(changelogData || FALLBACK_CHANGELOG_DATA)
          return
        }

        // Try to fetch from adapter
        setLoading(true)
        const adapter = createChangelogAdapter(source, config?.changelog?.config || {})
        const entries = await adapter.fetch()
        if (entries && entries.length > 0) {
          setData(entries)
        } else {
          setData(changelogData || FALLBACK_CHANGELOG_DATA)
        }
      } catch (error) {
        console.error('Failed to load changelog:', error)
        setData(changelogData || FALLBACK_CHANGELOG_DATA)
      } finally {
        setLoading(false)
      }
    }

    loadChangelog()
  }, [propData])

  if (loading) {
    return (
      <div className="w-full border border-border rounded-md overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          Loading changelog...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full border border-border rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-start border-b border-border bg-background min-h-[56px]">
        <div className="w-[96px] p-4 border-r border-border flex-shrink-0">
          <p className="text-base font-bold leading-6 text-foreground tracking-[-0.16px]">
            Version
          </p>
        </div>
        <div className="w-[141px] p-4 border-r border-border flex-shrink-0">
          <p className="text-base font-bold leading-6 text-foreground tracking-[-0.16px]">
            Date
          </p>
        </div>
        <div className="flex-1 min-w-0 p-4">
          <p className="text-base font-bold leading-6 text-foreground tracking-[-0.16px]">
            Description
          </p>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {data.map((entry, index) => (
          <div
            key={index}
            className="flex items-stretch border-b border-border last:border-b-0"
          >
            <div className="w-[96px] p-4 border-r border-border flex-shrink-0 flex items-start">
              <p className="text-base leading-6 text-foreground tracking-[-0.16px]">
                {entry.version}
              </p>
            </div>
            <div className="w-[141px] p-4 border-r border-border flex-shrink-0 flex items-start">
              <p className="text-base leading-6 text-foreground tracking-[-0.16px]">
                {entry.date}
              </p>
            </div>
            <div className="flex-1 min-w-0 p-4">
              <div className="text-base leading-6 text-foreground tracking-[-0.16px]">
                {typeof entry.description === "string" ? (
                  parseChangelogDescription(entry.description)
                ) : (
                  entry.description
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

