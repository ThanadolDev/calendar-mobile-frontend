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

// import { getCheckAuth } from '@/services/apiService'

const LoginOg = ({}: { mode: SystemMode }) => {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)

  // Use auth context for authentication state and functions
  const { isAuthenticated, refreshTokens, logout } = useAuth()

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

    // Decode payload from base64
    const decodedPayload = decodeURIComponent(escape(atob(payload)))

    // Parse the decoded payload to JSON
    const parsedPayload: DecodedJWT = JSON.parse(decodedPayload)

    // If profile is an array with a single object, convert it to a single object
    if (Array.isArray(parsedPayload.profile) && parsedPayload.profile.length === 1) {
      parsedPayload.profile = parsedPayload.profile[0]
    }

    return parsedPayload
  }

  // Function to map role ID to role name
  const mapRoleFromId = (roleId: number): 'Manager' | 'User' | 'Mod' | 'View' => {
    switch (roleId) {
      case 1:
        return 'Manager'
      case 2:
        return 'User'
      case 3:
        return 'Mod'
      default:
        return 'View'
    }
  }

  const checkAuthentication = async () => {
    try {
      setIsProcessing(true)

      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('accessToken')
      const urlTokenRe = params.get('refreshToken')
      const sessionId = params.get('SESSION_ID')
      const redirectWebsite = params.get('redirectWebsite')
      const currentUrl = window.location.origin + '/tooling/login-og'

      // Check current user session
      // await checkCurrentSession()

      // Case 1: New login with tokens in URL
      if (urlToken && urlTokenRe && sessionId) {
        const decoded = decodeJWT(urlToken)

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
          role: mapRoleFromId(decoded.profile.ROLE_ID) // Add role mapping
        }

        // Set user info and refresh auth context
        setUserInfo(newData)
        await refreshTokens()

        // Redirect to the specified page or home
        router.replace(redirectWebsite || '/home')
      }

      // Case 2: Already authenticated
      else if (isAuthenticated) {
        console.log('Already authenticated, redirecting to home')
        router.replace('/home')
      }

      // Case 3: Not authenticated, redirect to login
      else {
        console.log('Not authenticated, redirecting to login page')
        router.replace(
          `${process.env.REACT_APP_URLMAIN_LOGIN}/login?ogwebsite=${encodeURIComponent(currentUrl)}&redirectWebsite=${redirectWebsite || window.location.href}`
        )
      }
    } catch (error) {
      console.error('Authentication error:', error)
      await logout()
    } finally {
      setIsProcessing(false)
    }
  }

  // Check if current session is still valid
  // const checkCurrentSession = async () => {
  //   const userInfo = getUserInfo()

  //   if (userInfo?.id) {
  //     try {
  //       // const res = await getCheckAuth(userInfo.id)
  //       // console.log('Session check result:', res.data)

  //       // if (res?.data?.isLoggedIn === false) {
  //       //   console.log('Session invalid, logging out')
  //       //   await logout()
  //       //   return false
  //       // }
  //       return true
  //     } catch (error) {
  //       console.error('Error checking session:', error)
  //       await logout()

  //       return false
  //     }
  //   }

  //   return false
  // }

  useEffect(() => {
    checkAuthentication()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='flex flex-col text-center justify-center items-center h-full'>
      <CircularProgress />
      {isProcessing && <p className='mt-4 text-gray-600'>Authenticating...</p>}
    </div>
  )
}

export default LoginOg
