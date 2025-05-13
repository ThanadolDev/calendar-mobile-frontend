'use client'

// React Imports
import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { CircularProgress } from '@mui/material'

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
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('accessToken')
      const urlTokenRe = params.get('refreshToken')
      const sessionId = params.get('SESSION_ID')

      // const redirectWebsite = params.get('redirectWebsite')
      const currentUrl = window.location.origin + '/toolingmanage/login-og'

      console.log(urlToken && urlTokenRe && sessionId)

      // Case 1: New login with tokens in URL
      if (urlToken && urlTokenRe && sessionId) {
        const decoded = decodeJWT(urlToken)

        const positionId = decoded.profile.POS_ID

        // Get role from position ID using the shared permission function
        const permissions = getPermissionsByPositionId(positionId)
        const userRole = permissions.userRole

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
          role: userRole,
          positionId: positionId
        }

        // Set user info and refresh auth context
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

        router.replace(
          `${process.env.REACT_APP_URLMAIN_LOGIN}/login?ogwebsite=${encodeURIComponent(currentUrl)}&redirectWebsite=${process.env.NEXT_PUBLIC_HOME_BASE_URL || window.location.href}`
        )
      }
    } catch (error) {
      console.error('Authentication error:', error)
      await logout()

      // const params = new URLSearchParams(window.location.search)

      // const redirectWebsite = params.get('redirectWebsite')
      const currentUrl = window.location.origin + '/toolingmanage/login-og'

      router.replace(
        `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}&redirectWebsite=${process.env.NEXT_PUBLIC_HOME_BASE_URL}`
      )
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    checkAuthentication()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='flex justify-center items-center h-screen'>
      {isProcessing && (
        <div className='flex flex-col items-center'>
          <CircularProgress />
          <p className='mt-4'>Authenticating...</p>
        </div>
      )}
    </div>
  )
}

export default LoginOg
