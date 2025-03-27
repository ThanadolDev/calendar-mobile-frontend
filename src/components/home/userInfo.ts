import type { IUserInfo } from '../../types/types'

// In a real app, this would likely come from a context provider
// or fetch from an authentication service
export const getUserInfo = (): IUserInfo => {
  // For testing, you can toggle between these two roles
  const role = localStorage.getItem('userRole') || 'manager'

  return {
    id: 'USR001',
    ORG_ID: 'ORG123',
    role: role as 'manager' | 'user',
    token: 'mock-jwt-token',
    name: role === 'manager' ? 'Admin User' : 'Regular User'
  }
}

// Helper to toggle between roles for testing
export const toggleUserRole = (): void => {
  const currentRole = localStorage.getItem('userRole') || 'manager'
  const newRole = currentRole === 'manager' ? 'user' : 'manager'

  localStorage.setItem('userRole', newRole)
  window.location.reload()
}
