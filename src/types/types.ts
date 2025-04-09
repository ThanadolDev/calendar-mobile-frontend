// Types.ts - Add these interfaces to your existing types file
export interface IUserInfo {
  id: string
  name: string
  email: string
  role: 'Manager' | 'User' | 'Mod' | 'View'
  token?: string
}

export interface IDiecut {
  DIECUT_ID: number | string
  DIECUT_SN: string
  DIECUT_NEAR_EXP?: string
  DIECUT_TYPE?: string
  BLADE_TYPE?: string
  STATUS?: string
  TL_STATUS?: string
  PRIORITY?: 'High' | 'Medium' | 'Low'
  AGES?: number
  USED?: number
  REMAIN?: number
  LAST_MODIFY?: string
  DUE_DATE?: string
  MODIFY_TYPE?: string
  START_TIME?: Date | string
  END_TIME?: Date | string
  PRODUCTION_ISSUE?: string
  TOOLING_AGE?: number
  FIX_DETAILS?: string
  BLADE_SIZE?: string
  MULTI_BLADE_REASON?: string
  MULTI_BLADE_REMARK?: string
}

export type UserRole = 'Manager' | 'User' | 'Mod' | 'View'

export interface IDiecutResponseData {
  count: number
  diecuts: IDiecut[]
}

export interface IDiecutResponse {
  success: boolean
  message: string
  data: IDiecutResponseData
}

// Add this to your existing IRequest interface
export interface IRequest {
  id: string
  title: string
  status: string
  requestDate: string
  worktype: string
  description: string
  requestBy: string
  priority: string
  department?: string
}

// Add this to your existing IUserInfo interface
