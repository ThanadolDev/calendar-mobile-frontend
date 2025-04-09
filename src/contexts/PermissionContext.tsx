// contexts/PermissionContext.tsx
'use client'

import type { ReactNode } from 'react'
import React, { createContext, useContext } from 'react'

import { getUserInfo } from '@/utils/userInfo'
import useRoleAccess from '../hooks/useRoleAccess'
import type { IUserInfo, UserRole } from '../types/types'

// Define the structure of our permission context
export interface PermissionContextType {
  isManager: boolean
  canModify: boolean
  canApprove: boolean
  canEditDates: boolean
  canRecordDetails: boolean
  canRequestChanges: boolean
  canCreateNew: boolean
  canSelect: boolean
  canView: boolean
  userRole: UserRole | null
}

// Create the context with default values
const PermissionContext = createContext<PermissionContextType>({
  isManager: false,
  canModify: false,
  canApprove: false,
  canEditDates: false,
  canRecordDetails: false,
  canRequestChanges: false,
  canCreateNew: false,
  canSelect: false,
  canView: true,
  userRole: null
})

// Provider component that wraps our app and makes permission values available
export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const userInfo = getUserInfo() as IUserInfo | null
  const userRole = userInfo?.role || null
  const permissions = useRoleAccess(userRole)

  // isManager is determined by canApprove permission
  const isManager = permissions.canApprove

  const value = {
    ...permissions,
    isManager,
    userRole
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

// Custom hook to use the permission context
export const usePermission = () => useContext(PermissionContext)

export default PermissionContext
