/**
 * Base changelog adapter class
 * Provides a unified interface for different changelog sources
 */

export class ChangelogAdapter {
  constructor(config) {
    this.config = config
  }

  /**
   * Fetch changelog entries
   * @returns {Promise<Array>} Array of changelog entries with {version, date, description}
   */
  async fetch() {
    throw new Error('fetch() must be implemented by subclass')
  }
}
