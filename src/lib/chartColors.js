/**
 * Chart color utilities for consistent color usage across all charts.
 * 
 * SVG fill/stroke attributes can accept CSS variables directly, supporting both:
 * - HSL colors: `hsl(var(--chart-*))` where --chart-* contains HSL values
 * - LAB colors: `var(--chart-themed-*)` where --chart-themed-* contains complete LAB color functions
 * 
 * This utility provides both regular and themed color arrays that work universally.
 */

/**
 * Regular chart colors using HSL format.
 * Use these when you need HSL colors wrapped in hsl() function.
 * These work with --chart-1 through --chart-5 CSS variables.
 */
export const CHART_COLORS_HSL = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

/**
 * Themed chart colors using CSS variables directly.
 * Use these for SVG fill/stroke attributes - they work with both HSL and LAB color formats.
 * These work with --chart-themed-1 through --chart-themed-5 CSS variables.
 * 
 * SVG attributes can accept CSS variables directly, so this works for:
 * - LAB colors (from --chart-themed-* which reference --color-blue-* or --color-green-*)
 * - Any other color format defined in CSS variables
 */
export const CHART_COLORS_THEMED = [
  "var(--chart-themed-1)",
  "var(--chart-themed-2)",
  "var(--chart-themed-3)",
  "var(--chart-themed-4)",
  "var(--chart-themed-5)",
]

/**
 * Default chart colors - uses themed colors by default.
 * For SVG fill/stroke attributes, use CSS variables directly to support both HSL and LAB formats.
 * 
 * This is the recommended default for new charts as it works universally.
 */
export const CHART_COLORS = CHART_COLORS_THEMED

/**
 * Get a chart color by index, cycling through available colors.
 * @param {number} index - The index of the color to retrieve
 * @param {string[]} colors - Optional color array to use (defaults to CHART_COLORS)
 * @returns {string} The color value
 */
export function getChartColor(index, colors = CHART_COLORS) {
  return colors[index % colors.length]
}

/**
 * Get multiple chart colors starting from a given index.
 * @param {number} count - Number of colors to retrieve
 * @param {number} startIndex - Starting index (default: 0)
 * @param {string[]} colors - Optional color array to use (defaults to CHART_COLORS)
 * @returns {string[]} Array of color values
 */
export function getChartColors(count, startIndex = 0, colors = CHART_COLORS) {
  return Array.from({ length: count }, (_, i) => getChartColor(startIndex + i, colors))
}

