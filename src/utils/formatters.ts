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

/**
 * Formats a date string or Date object to Thai locale format
 * @param dateInput The date to format (string, Date, or null/undefined)
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return ''
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    
    // Check if the date is valid
    if (isNaN(date.getTime())) return ''
    
    // Format to Thai locale (dd/mm/yyyy)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    return ''
  }
}

/**
 * Formats a time string or Date object to display time only
 * @param dateInput The date/time to format (string, Date, or null/undefined)
 * @returns Formatted time string (HH:MM) or empty string if invalid
 */
export const formatTime = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return ''
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    
    // Check if the date is valid
    if (isNaN(date.getTime())) return ''
    
    // Format to HH:MM
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    return ''
  }
}
