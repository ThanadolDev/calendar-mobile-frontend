export interface IRequest {
  id: string
  title: string
  status: 'Pending' | 'Approved' | 'Rejected'
  requestDate: string
  worktype: string
  description?: string
  requestBy?: string
  priority?: 'Low' | 'Medium' | 'High'
}

export interface IUserInfo {
  id: string
  ORG_ID: string
  role: 'manager' | 'user'
  token: string
  name: string
}
