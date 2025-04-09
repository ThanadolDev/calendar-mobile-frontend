// config/appConfig.ts

/**
 * Application configuration controlled by environment variables
 */
const appConfig = {
  // Feature toggles
  features: {
    // Enable/disable role-based access control (default: true)
    enableRoleBasedAccess: process.env.NEXT_PUBLIC_ENABLE_RBAC !== 'false',

    // Enable/disable number formatting with commas (default: true)
    enableNumberFormatting: process.env.NEXT_PUBLIC_ENABLE_NUMBER_FORMATTING !== 'false'
  },

  // Default role to use when role-based access is disabled
  defaultRole: process.env.NEXT_PUBLIC_DEFAULT_ROLE || 'Manager',

  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2525/api'
  }
}

export default appConfig
