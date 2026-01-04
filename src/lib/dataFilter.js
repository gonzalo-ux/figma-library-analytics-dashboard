/**
 * Filters data based on library inclusion filters
 * @param {Array} data - Array of data objects
 * @param {Object} filters - Filter configuration with include criteria
 * @param {string} nameField - Field name to check (e.g., 'component_name', 'variable_name', 'style_name')
 * @returns {Array} Filtered data
 */
export function applyIncludeFilters(data, filters, nameField = 'component_name') {
  if (!data || !Array.isArray(data)) {
    return []
  }

  if (!filters || !filters.include) {
    return data
  }

  const { prefix, suffix, contains } = filters.include

  // If no include filters are set, include all
  if (!prefix && !suffix && !contains) {
    return data
  }

  return data.filter(item => {
    // For components: check component_set_name first, fallback to component_name if empty
    // For variables: check both variable_name and variable_key
    // For styles: use style_name
    let name = ''
    if (nameField === 'component_name') {
      // For components: prefer component_set_name, fallback to component_name
      name = (item.component_set_name && item.component_set_name.trim()) || item.component_name || ''
    } else if (nameField === 'variable_name') {
      name = item.variable_name || item.variable_key || ''
    } else {
      name = item[nameField] || ''
    }
    const trimmedName = name.trim()

    // Check inclusion filters - item must match at least one to be included
    let shouldInclude = false

    if (prefix && trimmedName.toLowerCase().startsWith(prefix.toLowerCase())) {
      shouldInclude = true
    }

    if (suffix && trimmedName.toLowerCase().endsWith(suffix.toLowerCase())) {
      shouldInclude = true
    }

    if (contains && trimmedName.toLowerCase().includes(contains.toLowerCase())) {
      shouldInclude = true
    }

    return shouldInclude
  })
}

/**
 * Filters data based on library exclusion filters
 * @param {Array} data - Array of data objects
 * @param {Object} filters - Filter configuration
 * @param {string} nameField - Field name to check (e.g., 'component_name', 'variable_name', 'style_name')
 * @returns {Array} Filtered data
 */
export function applyLibraryFilters(data, filters, nameField = 'component_name') {
  if (!data || !Array.isArray(data)) {
    return []
  }

  if (!filters || !filters.exclude) {
    return data
  }

  const { prefix, suffix, contains } = filters.exclude

  return data.filter(item => {
    // For components: check component_set_name first, fallback to component_name if empty
    // For variables: check both variable_name and variable_key
    // For styles: use style_name
    let name = ''
    if (nameField === 'component_name') {
      // For components: prefer component_set_name, fallback to component_name
      name = (item.component_set_name && item.component_set_name.trim()) || item.component_name || ''
    } else if (nameField === 'variable_name') {
      name = item.variable_name || item.variable_key || ''
    } else {
      name = item[nameField] || ''
    }
    const trimmedName = name.trim()

    // If no filters are set, include all
    if (!prefix && !suffix && !contains) {
      return true
    }

    // Check exclusion filters
    let shouldExclude = false

    if (prefix && trimmedName.toLowerCase().startsWith(prefix.toLowerCase())) {
      shouldExclude = true
    }

    if (suffix && trimmedName.toLowerCase().endsWith(suffix.toLowerCase())) {
      shouldExclude = true
    }

    if (contains && trimmedName.toLowerCase().includes(contains.toLowerCase())) {
      shouldExclude = true
    }

    return !shouldExclude
  })
}

/**
 * Get the library configuration for a given page
 * @param {Object} config - Application configuration
 * @param {string} pageId - Page ID
 * @returns {Object|null} Library configuration or null if not found
 */
export function getLibraryForPage(config, pageId) {
  if (!config?.pages || !config?.figma?.libraries) {
    return null
  }

  const page = config.pages.find(p => p.id === pageId)
  if (!page) {
    return null
  }

  return config.figma.libraries.find(lib => lib.id === page.libraryId) || null
}

/**
 * Get page configuration by ID
 * @param {Object} config - Application configuration
 * @param {string} pageId - Page ID
 * @returns {Object|null} Page configuration or null if not found
 */
export function getPageConfig(config, pageId) {
  if (!config?.pages) {
    return null
  }

  return config.pages.find(p => p.id === pageId) || null
}

/**
 * Get all pages configured in the application
 * @param {Object} config - Application configuration
 * @returns {Array} Array of page configurations
 */
export function getConfiguredPages(config) {
  return config?.pages || []
}

/**
 * Get page configuration by type (for backward compatibility)
 * @param {Object} config - Application configuration
 * @param {string} type - Page type (components, icons, variables, styles)
 * @returns {Object|null} Page configuration or null if not found
 */
export function getPageByType(config, type) {
  if (!config?.pages) {
    return null
  }

  return config.pages.find(p => p.type === type) || null
}

/**
 * Filter component data based on page configuration
 * This applies page filters (if enabled) - include filters first, then exclude filters
 * @param {Array} data - Raw component data
 * @param {Object} config - Application configuration
 * @param {string} pageId - Page ID
 * @returns {Array} Filtered data
 */
export function filterDataForPage(data, config, pageId) {
  if (!data || !Array.isArray(data)) {
    return []
  }

  const page = getPageConfig(config, pageId)
  if (!page) {
    return data
  }

  let filtered = data

  // Apply page filters if enabled
  if (page.useFilters && page.filters) {
    // Determine the correct name field based on page type
    let nameField = 'component_name' // default
    if (page.type === 'variables') {
      // For variables, check which field exists in the data
      // Prefer variable_name, fallback to variable_key
      if (filtered.length > 0 && filtered[0].variable_name) {
        nameField = 'variable_name'
      } else if (filtered.length > 0 && filtered[0].variable_key) {
        nameField = 'variable_key'
      } else {
        nameField = 'variable_name' // default to variable_name
      }
    } else if (page.type === 'styles') {
      nameField = 'style_name'
    }
    // For components and icons, use component_name (default)
    
    // Step 1: Apply include filters (if any are set)
    // This narrows down to only items matching the include criteria
    const hasIncludeFilters = page.filters.include && 
      (page.filters.include.prefix || page.filters.include.suffix || page.filters.include.contains)
    
    if (hasIncludeFilters) {
      filtered = applyIncludeFilters(filtered, page.filters, nameField)
    }
    
    // Step 2: Apply exclude filters (if any are set)
    // This removes unwanted items from the included set
    const hasExcludeFilters = page.filters.exclude &&
      (page.filters.exclude.prefix || page.filters.exclude.suffix || page.filters.exclude.contains)
    
    if (hasExcludeFilters) {
      filtered = applyLibraryFilters(filtered, page.filters, nameField)
    }
  }

  // No automatic type-specific filtering - users handle it with custom filters
  // Components, variables, and styles all show their respective data without additional filtering

  return filtered
}

