import React from "react"

/**
 * Parses a plain text changelog description into React components
 * Handles:
 * - ❖ and ♥ prefixes for categories
 * - Bullet points (lines starting with "-")
 * - Multiple paragraphs
 */
export function parseChangelogDescription(description) {
  if (!description) return null

  const lines = description.split('\n').filter(line => line.trim())
  const elements = []
  let currentList = []
  let currentCategory = null

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc ml-6 mt-1">
          {currentList.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )
      currentList = []
    }
  }

  const flushCategory = () => {
    if (currentCategory) {
      elements.push(
        <p key={elements.length} className={elements.length > 0 ? "mt-2" : ""}>
          {currentCategory}
        </p>
      )
      currentCategory = null
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    // Check for category markers
    if (trimmed.startsWith('❖') || trimmed.startsWith('♥')) {
      flushList()
      flushCategory()
      currentCategory = trimmed
      return
    }

    // Check for bullet points
    if (trimmed.startsWith('-')) {
      flushCategory()
      currentList.push(trimmed.substring(1).trim())
      return
    }

    // Regular paragraph
    if (trimmed) {
      flushList()
      flushCategory()
      elements.push(
        <p key={idx} className={elements.length > 0 ? "mt-1" : ""}>
          {trimmed}
        </p>
      )
    }
  })

  // Flush any remaining items
  flushList()
  flushCategory()

  return <>{elements}</>
}

