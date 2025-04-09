// utils/formatters.ts
import appConfig from '../configs/appConfig'

/**
 * Formats a number with commas as thousands separators if the feature is enabled
 * @param value The value to format (number or string)
 * @param decimals Number of decimal places (default: 0)
 * @returns Formatted string with commas or original value as string
 */
export const formatNumber = (value: number | string | null | undefined, decimals = 0): string => {
  // Return empty string for null/undefined values
  if (value === null || value === undefined || value === '') {
    return ''
  }

  // Convert to number if it's a string
  const num = typeof value === 'string' ? parseFloat(value) : value

  // Check if it's a valid number
  if (isNaN(num)) {
    return ''
  }

  // If formatting is disabled, just convert to string with fixed decimals
  if (!appConfig.features.enableNumberFormatting) {
    return decimals > 0 ? num.toFixed(decimals) : String(num)
  }

  // Format with commas and specified decimal places
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Determines if a column value should be treated as numeric for styling
 * @param key The column accessor key
 * @returns Boolean indicating if the column is numeric
 */
export const isNumericColumn = (key: string): boolean => {
  const numericColumns = ['DIECUT_ID', 'AGES', 'USED', 'REMAIN', 'TOOLING_AGE', 'DIECUT_AGE']

  return numericColumns.includes(key)
}
