import type { IUserInfo } from '../../types/types'

// In a real app, this would likely come from a context provider
// or fetch from an authentication service
export const getUserInfo = (): IUserInfo | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const userInfo = localStorage.getItem('userInfo')
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (!userInfo || !accessToken) {
      return null
    }

    const parsedUserInfo = JSON.parse(userInfo)

    // Make sure to return the latest tokens
    return {
      ...parsedUserInfo,
      accessToken,
      refreshToken: refreshToken || parsedUserInfo.refreshToken
    }
  } catch (error) {
    console.error('Error getting user info:', error)
    return null
  }
}

export const setUserInfo = (userInfo: IUserInfo): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Store tokens separately for easier access
    localStorage.setItem('accessToken', userInfo.accessToken)
    localStorage.setItem('refreshToken', userInfo.refreshToken)

    // Store user info without sensitive tokens
    const { accessToken, refreshToken, ...userInfoWithoutTokens } = userInfo
    localStorage.setItem('userInfo', JSON.stringify(userInfoWithoutTokens))
  } catch (error) {
    console.error('Error setting user info:', error)
  }
}

export const clearUserInfo = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  } catch (error) {
    console.error('Error clearing user info:', error)
  }
}

export const isTokenExpired = (token: string): boolean => {
  if (!token) return true

  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    const { exp } = JSON.parse(jsonPayload)

    // Return true if the token is expired
    return exp * 1000 < Date.now()
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true
  }
}
