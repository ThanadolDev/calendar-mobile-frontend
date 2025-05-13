// utils/permissionMapping.ts
import type { UserRole } from '../types/types'

// Permission interface - all possible permissions
export interface PermissionSet {
  isManager: boolean
  canModify: boolean
  canApprove: boolean
  canEditDates: boolean
  canRecordDetails: boolean
  canRequestChanges: boolean
  canCreateNew: boolean
  canSelect: boolean
  canView: boolean
  userRole: UserRole
}

// Single source of truth for mapping position IDs to permissions
export function getPermissionsByPositionId(posId: string | null): PermissionSet {
  // Default minimal permissions
  const defaultPermissions: PermissionSet = {
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

  if (!posId) return defaultPermissions

  // Map specific position IDs to comprehensive permission sets
  switch (posId) {
    // หัวหน้าห้องแบบ แผนกปั๊ม (manager)
    case 'DIECUT_STAMPING_MANAGER_POS':
      return {
        isManager: true,
        canModify: true,
        canApprove: true,
        canEditDates: true,
        canRecordDetails: true,
        canRequestChanges: true,
        canCreateNew: true,
        canSelect: true,
        canView: true,
        userRole: 'Manager'
      }

    // จนท ห้องแบบ แผนกปั๊ม
    case 'DIECUT_STAMPING_MANAGER_UID':
      return {
        isManager: false,
        canModify: false,
        canApprove: false,
        canEditDates: false,
        canRecordDetails: true,
        canRequestChanges: true,
        canCreateNew: false,
        canSelect: false,
        canView: true,
        userRole: 'User'
      }

    // วางแผน
    case 'DIECUT_PLANNING_POS':
      return {
        isManager: false,
        canModify: true,
        canApprove: false,
        canEditDates: true,
        canRecordDetails: false,
        canRequestChanges: false,
        canCreateNew: true,
        canSelect: true,
        canView: true,
        userRole: 'Mod'
      }

    // Default for unrecognized position IDs
    default:
      return defaultPermissions
  }
}
