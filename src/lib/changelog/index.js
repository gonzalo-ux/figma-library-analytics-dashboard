/**
 * Changelog adapter interface
 * Provides a unified interface for different changelog sources
 */

import { ChangelogAdapter } from './base'
import { FigmaChangelogAdapter } from './figma'
import { GoogleDocsChangelogAdapter } from './google-docs'
import { NotionChangelogAdapter } from './notion'

// Re-export the base class for convenience
export { ChangelogAdapter }

/**
 * Factory function to create the appropriate changelog adapter
 */
export function createChangelogAdapter(source, config) {
  switch (source) {
    case 'figma':
      return new FigmaChangelogAdapter(config)
    case 'google-docs':
      return new GoogleDocsChangelogAdapter(config)
    case 'notion':
      return new NotionChangelogAdapter(config)
    default:
      throw new Error(`Unknown changelog source: ${source}`)
  }
}
