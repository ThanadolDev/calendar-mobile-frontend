'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useState, useEffect } from 'react'

import { getPermissionsByPositionId, type PermissionSet } from '../utils/permissionMapping'
import { getUserInfo } from '../utils/userInfo'
import type { UserRole } from '../types/types'

interface PermissionContextType extends PermissionSet {
  overrideRole: string | null
  setOverrideRole: (role: string | null) => void
  isRoleOverrideActive: boolean
  setRoleOverrideActive: (mode: boolean) => void
  resetPermissions: () => void
  actualRole: UserRole
  actualPermissions: PermissionSet
}

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
  userRole: 'View',
  overrideRole: null,
  setOverrideRole: () => {},
  isRoleOverrideActive: false,
  setRoleOverrideActive: () => {},
  resetPermissions: () => {},
  actualRole: 'View',
  actualPermissions: {
    isManager: false,
    canModify: false,
    canApprove: false,
    canEditDates: false,
    canRecordDetails: false,
    canRequestChanges: false,
    canCreateNew: false,
    canSelect: false,
    canView: true,
    userRole: 'View'
  }
})

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const [isRoleOverrideActive, setRoleOverrideActive] = useState(false)
  const [overrideRole, setOverrideRole] = useState<string | null>(null)

  const getUserPermissions = (): PermissionSet => {
    const userInfo = getUserInfo()

    return getPermissionsByPositionId(userInfo?.positionId || null)
  }

  const actualPermissions = getUserPermissions()
  const actualRole = actualPermissions.userRole

  const effectivePermissions: PermissionSet =
    isRoleOverrideActive && overrideRole !== null ? getPermissionsByPositionId(overrideRole) : actualPermissions

  useEffect(() => {
    const savedRoleOverride = localStorage.getItem('roleOverrideActive') === 'true'
    const savedRole = localStorage.getItem('overrideRole')

    if (savedRoleOverride && savedRole) {
      setRoleOverrideActive(true)
      setOverrideRole(savedRole)
    }
  }, [])

  const resetPermissions = () => {
    setRoleOverrideActive(false)
    setOverrideRole(null)
    localStorage.removeItem('roleOverrideActive')
    localStorage.removeItem('overrideRole')
  }

  const contextValue: PermissionContextType = {
    ...effectivePermissions,
    overrideRole,
    setOverrideRole,
    isRoleOverrideActive,
    setRoleOverrideActive,
    resetPermissions,
    actualRole,
    actualPermissions
  }

  return <PermissionContext.Provider value={contextValue}>{children}</PermissionContext.Provider>
}

export const usePermission = () => useContext(PermissionContext)
