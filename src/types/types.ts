// Types.ts - Add these interfaces to your existing types file
export interface IDiecut {
  DIECUT_ID: string
  DIECUT_SN: string
  AGES: number
  USED: number
  REMAIN: number
  DIECUT_NEAR_EXP: number
  PRIORITY: string
  STATUS: string
  DIECUT_TYPE: string
  TL_STATUS: string
  LAST_MODIFY: string | null
  DUE_DATE: string
  MODIFY_TYPE: string
}

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
export interface IUserInfo {
  id: string
  ORG_ID: string
  role: 'manager' | 'user'
  token: string
  name: string
}
