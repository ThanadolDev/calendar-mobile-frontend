import type { AuthResponse } from '@/types/auth'

// Function to set user information in localStorage
export const setUserInfo = (userInfo: AuthResponse) => {
  localStorage.setItem('id', userInfo.id)
  localStorage.setItem('name', userInfo.name)
  localStorage.setItem('email', userInfo.email)
  localStorage.setItem('image_id', userInfo.image_id)
  localStorage.setItem('ORG_ID', userInfo.ORG_ID)
  localStorage.setItem('accessToken', userInfo.accessToken)
  localStorage.setItem('refreshToken', userInfo.refreshToken)
  localStorage.setItem('SESSION_ID', userInfo.sessionId)
  localStorage.setItem('role', userInfo.role)

  if (userInfo.positionId) {
    localStorage.setItem('positionId', userInfo.positionId)
  }
}

// Function to get user information from localStorage
export const getUserInfo = (): AuthResponse | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  const id = localStorage.getItem('id')
  const name = localStorage.getItem('name')
  const email = localStorage.getItem('email')
  const image_id = localStorage.getItem('image_id')
  const ORG_ID = localStorage.getItem('ORG_ID')
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  const sessionId = localStorage.getItem('SESSION_ID')
  const role = localStorage.getItem('role')
  const positionId = localStorage.getItem('positionId') || undefined

  if (!id || !name || !email || !image_id || !ORG_ID || !accessToken || !refreshToken || !sessionId || !role) {
    return null // Return null if any of the user information is missing
  }

  return {
    id,
    name,
    email,
    image_id,
    ORG_ID,
    accessToken,
    refreshToken,
    sessionId,
    role,
    positionId
  }
}

// Function to clear user information from localStorage
export const clearUserInfo = () => {
  localStorage.removeItem('id')
  localStorage.removeItem('name')
  localStorage.removeItem('email')
  localStorage.removeItem('image_id')
  localStorage.removeItem('ORG_ID')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('SESSION_ID')
  localStorage.removeItem('role')
  localStorage.removeItem('positionId')
}
