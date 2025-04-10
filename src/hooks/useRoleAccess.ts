// hooks/useRoleAccess.ts
import { useMemo, useEffect, useState } from 'react'

import type { UserRole } from '../types/types'
import appConfig from '../configs/appConfig'

interface RolePermissions {
  canModify: boolean
  canApprove: boolean
  canEditDates: boolean
  canRecordDetails: boolean
  canRequestChanges: boolean
  canCreateNew: boolean
  canSelect: boolean
  canView: boolean
}

// Define permissions by role
const rolePermissionsMap: Record<UserRole, RolePermissions> = {
  Manager: {
    // หัวหน้าห้องแบบ
    canModify: true,
    canApprove: true,
    canEditDates: true,
    canRecordDetails: true,
    canRequestChanges: true,
    canCreateNew: true,
    canSelect: true,
    canView: true
  },
  User: {
    // จนท ห้องแบบ
    canModify: false,
    canApprove: false,
    canEditDates: false,
    canRecordDetails: true,
    canRequestChanges: true,
    canCreateNew: false,
    canSelect: false,
    canView: true
  },
  Mod: {
    // ฝ่ายผลิต, วางแผน, PD
    canModify: true,
    canApprove: false,
    canEditDates: true,
    canRecordDetails: false,
    canRequestChanges: false,
    canCreateNew: true,
    canSelect: true,
    canView: true
  },
  View: {
    // View only
    canModify: false,
    canApprove: false,
    canEditDates: false,
    canRecordDetails: false,
    canRequestChanges: false,
    canCreateNew: false,
    canSelect: false,
    canView: true
  }
}

/**
 * Hook for managing role-based permissions
 * @param role User role
 * @returns Object with permission flags
 */
const useRoleAccess = (role: UserRole | null) => {
  // Add a default state
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If you fetch roles asynchronously
    setIsLoading(false)
  }, [role])

  // Handle invalid roles
  const validRole = role && ['Manager', 'User', 'Mod', 'View'].includes(role)
    ? role
    : appConfig.defaultRole;

  // Get the permissions from the map based on role
  return useMemo(() => {
    const defaultPermissions: RolePermissions = {
      canModify: false,
      canApprove: false,
      canEditDates: false,
      canRecordDetails: false,
      canRequestChanges: false,
      canCreateNew: false,
      canSelect: false,
      canView: true // Everyone should at least be able to view
    };

    // If role-based access is disabled, use default role
    if (!appConfig.features.enableRoleBasedAccess) {
      return {
        ...rolePermissionsMap[appConfig.defaultRole],
        isLoading: false
      };
    }

    // If loading or no valid role, return default permissions with loading state
    if (isLoading || !validRole) {
      return {
        ...defaultPermissions,
        isLoading
      };
    }

    // Return permissions for the valid role
    return {
      ...rolePermissionsMap[validRole],
      isLoading: false
    };
  }, [validRole, isLoading]);
}

export default useRoleAccess
