// components/PermissionGate.tsx
import type { ReactNode } from 'react'
import React from 'react'

import { usePermission } from '../contexts/PermissionContext'

interface PermissionGateProps {
  children: ReactNode
  permissions?: Array<keyof Omit<ReturnType<typeof usePermission>, 'userRole'>>
  requiredPermission?: keyof Omit<ReturnType<typeof usePermission>, 'userRole'>
  fallback?: ReactNode
}

/**
 * Component that conditionally renders children based on user permissions
 *
 * @param children Content to render if user has permission
 * @param permissions Array of permissions, at least one of which is required (OR logic)
 * @param requiredPermission Single permission that is required
 * @param fallback Optional content to render if user lacks permission
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions = [],
  requiredPermission,
  fallback = null
}) => {
  const userPermissions = usePermission()

  // If a single required permission is specified
  if (requiredPermission) {
    return userPermissions[requiredPermission] ? <>{children}</> : <>{fallback}</>
  }

  // If array of permissions is specified (OR logic)
  if (permissions.length > 0) {
    const hasPermission = permissions.some(permission => userPermissions[permission])

    return hasPermission ? <>{children}</> : <>{fallback}</>
  }

  // Default to rendering children if no specific permissions are required
  return <>{children}</>
}

export default PermissionGate
