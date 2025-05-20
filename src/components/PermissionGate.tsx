'use client'

import type { ReactNode } from 'react'
import React from 'react'

import { usePermission } from '../contexts/PermissionContext'

type Permission =
  | 'isManager'
  | 'canModify'
  | 'canApprove'
  | 'canEditDates'
  | 'canRecordDetails'
  | 'canRequestChanges'
  | 'canCreateNew'
  | 'canSelect'
  | 'canView'

interface PermissionGateProps {
  children: ReactNode
  requiredPermission: Permission | Permission[]
  fallback?: ReactNode
}

/**
 * PermissionGate - A component to conditionally render content based on user permissions
 *
 * @param children - Content to render if user has permission
 * @param requiredPermission - Permission or array of permissions required to view the content
 * @param fallback - Optional content to render if user doesn't have permission
 */
const PermissionGate: React.FC<PermissionGateProps> = ({ children, requiredPermission, fallback = null }) => {
  const permissions = usePermission()

  // Check if user has all required permissions
  const hasPermission = () => {
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.every(perm => permissions[perm] === true)
    }

    return permissions[requiredPermission] === true
  }

  // If the user has permission, render the children, otherwise render fallback or null
  return hasPermission() ? <>{children}</> : <>{fallback}</>
}

export default PermissionGate
