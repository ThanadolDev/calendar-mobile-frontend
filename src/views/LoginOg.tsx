'use client'

// React Imports
import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { CircularProgress } from '@mui/material'

import axios from 'axios'

import type { SystemMode } from '@core/types'

// Auth Context
import { useAuth } from '@/contexts/AuthContext' // Update this path

// Hook Imports
import { setUserInfo } from '@/utils/userInfo'
import type { AuthResponse } from '@/types/auth'
import { getPermissionsByPositionId } from '@/utils/permissionMapping'

// import { getCheckAuth } from '@/services/apiService'

const LoginOg = ({}: { mode: SystemMode }) => {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)

  // Use auth context for authentication state and functions
  const { refreshTokens, logout } = useAuth()

  interface Profile {
    ORG_ID: string
    EMP_ID: string
    EMP_FNAME: string
    EMP_LNAME: string
    POS_ID: string
    ROLE_ID: number
  }

  interface DecodedJWT {
    profile: Profile
    usr: string
    iat: number
    exp: number
  }

  function decodeJWT(token: string): DecodedJWT {
    const parts = token.split('.')
    const payload = parts[1]

    // Convert base64url to base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')

    // Decode base64
    const decodedPayload = decodeURIComponent(escape(atob(padded)))
    const parsedPayload: DecodedJWT = JSON.parse(decodedPayload)

    if (Array.isArray(parsedPayload.profile) && parsedPayload.profile.length === 1) {
      parsedPayload.profile = parsedPayload.profile[0]
    }

    return parsedPayload
  }

  // Function to map role ID to role name
  // const mapRoleFromId = (roleId: number): 'Manager' | 'User' | 'Mod' | 'View' => {
  //   switch (roleId) {
  //     case 1:
  //       return 'Manager'
  //     case 2:
  //       return 'User'
  //     case 3:
  //       return 'Mod'
  //     default:
  //       return 'View'
  //   }
  // }

  const checkAuthentication = async () => {
    try {
      setIsProcessing(true)

      // Development mode: Create mock user session if no external auth URL is configured
      if (!process.env.REACT_APP_URLMAIN_LOGIN) {
        console.log('Development mode: Creating mock user session')

        const mockUser: AuthResponse = {
          id: 'DEV001',
          name: 'Development User',
          email: 'dev@handbook.com',
          image_id: '',
          ORG_ID: 'ORG001',
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          sessionId: 'mock-session-id',
          role: 'Manager',
          positionId: 'POS001'
        }

        setUserInfo(mockUser)
        router.replace('/home')

        return
      }

      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('accessToken')
      const urlTokenRe = params.get('refreshToken')
      const sessionId = params.get('SESSION_ID')

      // const redirectWebsite = params.get('redirectWebsite')
      const currentUrl = window.location.origin + '/handbookmanage/login-og'

      // console.log(urlToken && urlTokenRe && sessionId)
      // window.alert(urlToken)

      // Case 1: New login with tokens in URL
      if (urlToken && urlTokenRe && sessionId) {
        // window.alert(true)
        const decoded = decodeJWT(urlToken)

        const positionId = decoded.profile.POS_ID

        const roleResponse = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/auth/getUserRole', {
          posId: decoded.profile.POS_ID,
          empId: decoded.profile.EMP_ID
        })

        // window.alert(JSON.stringify(roleResponse.data))

        // if (!roleResponse.data?.data?.roles?.[0]?.ROLE) {
        //   window.alert('Yes!' + JSON.stringify(roleResponse.data))
        //   throw new Error('Invalid role response structure')
        // }
        let data

        if (!roleResponse.data || Object.keys(roleResponse.data).length === 0) {
          data = null
        } else {
          try {
            data = roleResponse.data.data.roles[0].ROLE
          } catch (error) {
            data = 1100
          }
        }

        // Get role from backend response
        // const userRole = roleResponse.data.data.roles[0].ROLE

        // Get role from position ID using the shared permission function
        const permissions = getPermissionsByPositionId(data)

        // window.alert(permissions + ' 1')

        // const userRole = permissions.userRole

        console.log('Token decoded:', decoded)

        // Create user data object from token
        const newData: AuthResponse = {
          id: decoded.profile.EMP_ID,
          name: `${decoded.profile.EMP_FNAME} ${decoded.profile.EMP_LNAME}`,
          email: decoded.profile.EMP_ID,
          image_id: decoded.profile.EMP_ID,
          ORG_ID: decoded.profile.ORG_ID,
          accessToken: urlToken,
          refreshToken: urlTokenRe,
          sessionId: sessionId,
          role: permissions.userRole,
          positionId: positionId
        }

        // Set user info and refresh auth context
        // console.log(newData)

        setUserInfo(newData)
        await refreshTokens()

        // Redirect to the specified page or home
        router.replace('/home')
      }

      // Case 2: Already authenticated, attempt to refresh token
      else if (localStorage.getItem('accessToken')) {
        console.log('Already authenticated, redirecting to home')

        // await refreshTokens()
        router.replace('/home')
      }

      // Case 3: Not authenticated, redirect to login
      else {
        console.log('Not authenticated, redirecting to login page')

        // Only redirect to external login if URL is configured
        if (process.env.REACT_APP_URLMAIN_LOGIN) {
          router.replace(
            `${process.env.REACT_APP_URLMAIN_LOGIN}/login?ogwebsite=${encodeURIComponent(currentUrl)}&redirectWebsite=${process.env.NEXT_PUBLIC_HOME_BASE_URL || window.location.href}`
          )
        } else {
          // In development mode without external auth, show login form
          setIsProcessing(false)
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      await logout()

      // Only redirect to external logout if URL is configured
      if (process.env.REACT_APP_URLMAIN_LOGIN) {
        const currentUrl = window.location.origin + '/handbookmanage/login-og'

        router.replace(
          `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}&redirectWebsite=${process.env.NEXT_PUBLIC_HOME_BASE_URL}`
        )
      }

      // If no external auth, just stay on login page
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    checkAuthentication()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDevLogin = () => {
    console.log('Development login clicked')

    const mockUser: AuthResponse = {
      id: 'DEV001',
      name: 'Development User',
      email: 'dev@handbook.com',
      image_id: '',
      ORG_ID: 'ORG001',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      sessionId: 'mock-session-id',
      role: 'Manager',
      positionId: 'POS001'
    }

    setUserInfo(mockUser)
    router.replace('/home')
  }

  return (
    <div className='flex justify-center items-center h-screen'>
      {isProcessing ? (
        <div className='flex flex-col items-center'>
          <CircularProgress />
          <p className='mt-4'>Authenticating...</p>
        </div>
      ) : (
        !process.env.REACT_APP_URLMAIN_LOGIN && (
          <div className='flex flex-col items-center space-y-4'>
            <h1 className='text-2xl font-bold'>Handbook Development Login</h1>
            <p className='text-gray-600'>Development mode - External authentication not configured</p>
            <button
              onClick={handleDevLogin}
              className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Login as Development User
            </button>
          </div>
        )
      )}
    </div>
  )
}

export default LoginOg
