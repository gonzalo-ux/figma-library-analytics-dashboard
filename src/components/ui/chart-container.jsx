import React, { useEffect, useRef } from "react"
import { cn } from "../../lib/utils"

export function ChartContainer({
  config,
  children,
  className,
  ...props
}) {
  const chartRef = useRef(null)

  const updateColors = () => {
    if (!chartRef.current || !config) return

    const element = chartRef.current
    const keys = Object.keys(config)
    
    keys.forEach((key) => {
      const configItem = config[key]
      if (configItem?.color) {
        // Resolve CSS variables if needed
        let colorValue = configItem.color
        if (colorValue.includes('var(')) {
          // Extract the CSS variable name (handles both var(--name) and hsl(var(--name)))
          const varMatch = colorValue.match(/var\(([^)]+)\)/)
          if (varMatch) {
            const varName = varMatch[1].trim()
            const resolved = getComputedStyle(document.documentElement)
              .getPropertyValue(varName)
              .trim()
            if (resolved) {
              // If the value is already a complete color function, use it directly
              // Otherwise, if it's HSL values, wrap them in hsl()
              if (resolved.startsWith('hsl(') || resolved.startsWith('rgb(') || resolved.startsWith('#')) {
                colorValue = resolved
              } else {
                // Convert HSL values to HSL string format
                const hslValues = resolved.split(' ').map(v => v.trim()).filter(v => v)
                if (hslValues.length === 3) {
                  colorValue = `hsl(${hslValues[0]} ${hslValues[1]} ${hslValues[2]})`
                } else {
                  colorValue = resolved
                }
              }
            }
          }
        }
        element.style.setProperty(`--color-${key}`, colorValue)
      }
    })
  }

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated after theme changes
    requestAnimationFrame(() => {
      updateColors()
    })
  }, [config])

  // Watch for theme changes by observing the document
  useEffect(() => {
    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => {
        updateColors()
      })
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [config])

  return (
    <div
      ref={chartRef}
      className={cn(
        "w-full h-full min-w-0 min-h-0",
        className
      )}
      style={{ minWidth: 0, minHeight: 0 }}
      {...props}
    >
      {children}
    </div>
  )
}

export function ChartTooltip({ active, payload, label, content }) {
  if (active && payload && payload.length) {
    if (content) {
      return content({ active, payload, label })
    }
    return (
      <div className="rounded-lg border bg-popover p-2 shadow-md">
        <div className="grid gap-2">
          <div className="font-medium">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">
                {entry.name}: <span className="font-medium text-foreground">
                  {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function ChartTooltipContent({ active, payload, label, labelFormatter, indicator = "line" }) {
  if (!active || !payload || payload.length === 0) return null

  const formattedLabel = labelFormatter ? labelFormatter(label) : label

  return (
    <div className="rounded-lg border bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/60 p-2 shadow-md">
      <div className="grid gap-2">
        <div className="font-medium text-popover-foreground">{formattedLabel}</div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            {indicator === "dot" && (
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            )}
            {indicator === "line" && (
              <div
                className="h-0.5 w-4"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-sm text-muted-foreground">
              {entry.name}: <span className="font-medium text-popover-foreground">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartLegend({ payload, content }) {
  if (!payload || payload.length === 0) return null

  if (content) {
    return content({ payload })
  }

  return (
    <div className="flex items-center justify-center gap-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function ChartLegendContent({ payload }) {
  if (!payload || payload.length === 0) return null

  return (
    <div className="flex items-center justify-center gap-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

