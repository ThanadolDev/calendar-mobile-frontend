'use client'

import type { ReactNode } from 'react'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { useRouter, usePathname } from 'next/navigation'

import { CircularProgress } from '@mui/material'

import { getVerifyToken, getRefreshToken } from '@/services/apiService'
import { clearUserInfo, getUserInfo, setUserInfo } from '@/utils/userInfo'

interface AuthContextType {
  isAuthenticated: boolean
  user: any | null
  loading: boolean
  logout: () => Promise<void>
  refreshTokens: () => Promise<boolean>
  checkAccess: (requiredRole?: string) => boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  logout: async () => {},
  refreshTokens: async () => false,
  checkAccess: () => false
})

export const useAuth = () => useContext(AuthContext)

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login-og', '/public', '/unauthorized']

// Configure route-based role requirements
const roleRequirements: Record<string, string[]> = {
  '/admin': ['Manager'],
  '/reports': ['Manager', 'User'],
  '/settings': ['Manager']

  // Add more routes with their required roles
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()
  const pathname = usePathname()

  const currentUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/handbook/login-og`
  const redirectUrl = typeof window !== 'undefined' ? window.location.href : ''

  const logout = async () => {
    clearUserInfo()
    setIsAuthenticated(false)
    setUser(null)

    if (typeof window !== 'undefined') {
      console.log('typeof window')
      
      // Only redirect to external logout if URL is configured
      if (process.env.REACT_APP_URLMAIN_LOGIN) {
        router.replace(
          `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}&redirectWebsite=${redirectUrl}`
        )
      } else {
        // Fallback: redirect to login page
        router.replace('/login-og')
      }
    }
  }

  const refreshTokens = async (): Promise<boolean> => {
    const userInfo = getUserInfo()

    console.log('inlogout1')

    if (!userInfo?.sessionId || !userInfo?.accessToken) {
      await logout()
      console.log('inlogout')

      return false
    }

    try {
      // First try to verify with current token
      const verifyResult = await getVerifyToken(userInfo.accessToken)

      console.log('verify')

      if (typeof verifyResult !== 'number') {
        // Token is still valid
        return true
      }

      if (verifyResult === 401) {
        // Token expired, try to refresh it
        // const tokenUserData = await getTokenBySessionIdAndUserId(userInfo.sessionId, userInfo.id)

        // if (!tokenUserData) {
        //   console.error('Failed to get token data')
        //   await logout()
        //   return false
        // }

        // // Verify that the stored token matches the session token
        // if (userInfo.accessToken !== tokenUserData.ACCESS_TOKEN) {
        //   console.error('Token mismatch between local storage and session')
        //   await logout()
        //   return false
        // }

        // Try to get a new token using refresh token
        const refreshResult = await getRefreshToken(localStorage.getItem('refreshToken') || '')

        if (typeof refreshResult === 'object') {
          // Update tokens in localStorage
          const updatedUserInfo = {
            ...userInfo,
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken
          }

          setUserInfo(updatedUserInfo)
          setUser(updatedUserInfo)

          return true
        } else {
          console.error('Failed to refresh token')
          await logout()

          return false
        }
      }

      if (verifyResult === 403) {
        console.error('Invalid token signature')
        await logout()

        return false
      }

      return false
    } catch (error) {
      console.error('Error during token refresh:', error)
      await logout()

      return false
    }
  }

  // Check if user has access to the current route based on their role
  const checkAccess = (requiredRole?: string): boolean => {
    // If no role required or user has the required role, grant access
    if (!requiredRole || (user?.role && requiredRole === user.role)) {
      return true
    }

    // If route has role requirements, check if user's role is in the allowed roles
    if (pathname && roleRequirements[pathname]) {
      return user?.role && roleRequirements[pathname].includes(user.role)
    }

    // Default to true if no specific requirements
    return true
  }

  // Authentication check and route protection
  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthContext: Checking authentication for pathname:', pathname)
      const userInfo = getUserInfo()
      console.log('AuthContext: UserInfo from storage:', userInfo)

      if (!userInfo) {
        console.log('AuthContext: No user info found')
        setIsAuthenticated(false)
        setUser(null)
        setLoading(false)

        // If not on a public route, redirect to login
        if (pathname && !publicRoutes.some(route => pathname.includes(route))) {
          console.log('AuthContext: Not on public route, redirecting to login. Pathname:', pathname)
          
          // Only redirect if login URL is properly configured
          if (process.env.REACT_APP_URLMAIN_LOGIN) {
            console.log('AuthContext: Using external login URL')
            router.replace(
              `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}&redirectWebsite=${redirectUrl}`
            )
          } else {
            // Fallback: redirect to login page instead of external service
            console.log('AuthContext: Redirecting to /login-og')
            router.replace('/login-og')
          }
        }

        return
      }

      const refreshSuccessful = await refreshTokens()

      if (refreshSuccessful) {
        setIsAuthenticated(true)
        setUser(userInfo)

        // Check if user has access to this route
        if (
          pathname &&
          roleRequirements[pathname] &&
          (!(userInfo as any).role || !roleRequirements[pathname].includes((userInfo as any).role))
        ) {
          router.replace('/unauthorized')
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)

        // Redirect to login if not on a public route
        if (pathname && !publicRoutes.some(route => pathname.includes(route))) {
          console.log('Redirect to login if not on a public route')
          
          // Only redirect if login URL is properly configured
          if (process.env.REACT_APP_URLMAIN_LOGIN) {
            router.replace(
              `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}&redirectWebsite=${redirectUrl}`
            )
          } else {
            // Fallback: redirect to login page instead of external service
            router.replace('/login-og')
          }
        }
      }

      setLoading(false)
    }

    checkAuth()
  }, [pathname])

  // Set up a periodic token refresh
  useEffect(() => {
    if (!isAuthenticated) return

    // Refresh token every 4 minutes to prevent 5-minute expiration
    const refreshInterval = setInterval(
      () => {
        refreshTokens().catch(error => {
          console.error('Periodic token refresh failed:', error)
        })
      },
      4 * 60 * 1000
    ) // 4 minutes

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        logout,
        refreshTokens,
        checkAccess
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
