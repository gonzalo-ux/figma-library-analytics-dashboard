import { ChangelogAdapter } from './base'

/**
 * Notion changelog adapter
 * Fetches changelog from a Notion database
 */
export class NotionChangelogAdapter extends ChangelogAdapter {
  async fetch() {
    const { databaseId, apiKey } = this.config

    if (!databaseId || !apiKey) {
      throw new Error('Notion database ID and API key are required')
    }

    try {
      // Use Notion API to fetch database entries
      const url = `https://api.notion.com/v1/databases/${databaseId}/query`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sorts: [
            {
              property: 'Date',
              direction: 'descending'
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Notion API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Parse Notion results to changelog entries
      return this.parseNotionResults(data.results || [])
    } catch (error) {
      console.error('Failed to fetch Notion changelog:', error)
      return []
    }
  }

  parseNotionResults(results) {
    return results.map(page => {
      const props = page.properties || {}
      
      // Extract version, date, and description from Notion page properties
      // Adjust property names based on your Notion database schema
      const version = props.Version?.title?.[0]?.plain_text || ''
      const date = props.Date?.date?.start || ''
      const description = props.Description?.rich_text?.[0]?.plain_text || ''

      return {
        version,
        date,
        description
      }
    }).filter(entry => entry.version && entry.date)
  }
}
