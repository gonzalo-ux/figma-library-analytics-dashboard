import { ChangelogAdapter } from './base'
import changelogData from '../../data/changelog.json'

/**
 * Figma changelog adapter
 * Uses the existing changelog.json file synced from Figma
 */
export class FigmaChangelogAdapter extends ChangelogAdapter {
  async fetch() {
    // Return the existing changelog data
    // In a real implementation, this could fetch from Figma API
    // For now, we use the pre-synced JSON file
    try {
      return changelogData || []
    } catch (error) {
      console.error('Failed to load Figma changelog:', error)
      return []
    }
  }
}
