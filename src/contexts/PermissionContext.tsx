// contexts/PermissionContext.tsx
'use client'

import type { ReactNode } from 'react'
import React, { createContext, useContext, useMemo } from 'react'

import { getUserInfo } from '@/utils/userInfo'
import { getPermissionsByPositionId, type PermissionSet } from '@/utils/permissionMapping'
import useRoleAccess from '../hooks/useRoleAccess'
import type { IUserInfo, UserRole } from '../types/types'

// Extend PermissionSet to include position ID
export interface PermissionContextType extends PermissionSet {
  positionId: string | null
}

// Default permissions with positionId
const defaultPermissions: PermissionContextType = {
  isManager: false,
  canModify: false,
  canApprove: false,
  canEditDates: false,
  canRecordDetails: false,
  canRequestChanges: false,
  canCreateNew: false,
  canSelect: false,
  canView: true,
  userRole: 'View',
  positionId: null
}

// Create the context
const PermissionContext = createContext<PermissionContextType>(defaultPermissions)

// Provider component
export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const userInfo = getUserInfo() as IUserInfo | null
  const userRole = (userInfo?.role as UserRole) || null
  const positionId = userInfo?.positionId || null

  // Get role-based permissions (fallback)
  const rolePermissions = useRoleAccess(userRole)

  // Compute final permissions
  const value = useMemo(() => {
    // If position ID exists, use position-based permissions
    if (positionId) {
      const positionPermissions = getPermissionsByPositionId(positionId)

      return {
        ...positionPermissions,
        positionId
      }
    }

    // Fallback to role-based permissions
    return {
      ...defaultPermissions,
      ...rolePermissions,
      isManager: rolePermissions.canApprove || false,
      userRole: userRole || 'View',
      positionId
    }
  }, [positionId, rolePermissions, userRole])

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

// Custom hook
export const usePermission = () => useContext(PermissionContext)

export default PermissionContext
