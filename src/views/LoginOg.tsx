'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

import { CircularProgress } from '@mui/material'

import type { SystemMode } from '@core/types'

// Hook Imports
import { clearUserInfo, getUserInfo, setUserInfo } from '@/utils/userInfo'
import type { AuthResponse } from '@/types/auth'
import { getCheckAuth, LogoutAuthSSO } from '@/services/apiService'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LoginOg = ({ mode }: { mode: SystemMode }) => {
  // Hooks
  const router = useRouter()

  const userSession = getUserInfo()

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

    // ถอดรหัส payload จาก base64
    const decodedPayload = decodeURIComponent(escape(atob(payload)))

    // แปลงข้อมูลที่ถอดรหัสแล้วเป็น JSON
    const parsedPayload: DecodedJWT = JSON.parse(decodedPayload)

    // หากมี profile เป็น array ที่มีแค่หนึ่ง object ให้ปรับเป็น object เดียว
    if (Array.isArray(parsedPayload.profile) && parsedPayload.profile.length === 1) {
      parsedPayload.profile = parsedPayload.profile[0]
    }

    return parsedPayload
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkAuthentication = async () => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('accessToken')
    const sessionId = params.get('SESSION_ID')
    const localToken = localStorage.getItem('accessToken')
    const redirectWebsite = params.get('redirectWebsite')

    // console.log('useEffect', params);
    // console.log('useEffect', urlToken);
    // console.log('useEffect', localToken);
    console.log('sessionId', sessionId)

    checkAuth()

    // const currentUrl = window.location.origin + "/login-og";
    const currentUrl = window.location.origin + '/tooling/login-og'

    // const currentUrl = window.location.href // ใช้ href เพื่อให้ได้ URL เต็มที่เปิดอยู่

    console.log('page login currentUrl', currentUrl)

    if (urlToken) {
      // console.log('case 1');

      const decoded = decodeJWT(urlToken)

      console.log('case 1 decoded==', decoded)

      const newData: AuthResponse = {
        id: decoded.profile.EMP_ID,
        name: `${decoded.profile.EMP_FNAME} ${decoded.profile.EMP_LNAME}`,
        email: decoded.profile.EMP_ID,
        image_id: decoded.profile.EMP_ID,
        ORG_ID: decoded.profile.ORG_ID,
        accessToken: urlToken,
        refreshToken: 'refreshToken_login_og',
        sessionId: sessionId || ''
      }

      setUserInfo(newData)

      // params.delete('accessToken');

      // const newUrl = `${window.location.origin}${window.location.pathname}`;

      // console.log('newUrl', newUrl);

      // window.location.href = newUrl;
      // router.replace('/home') // Redirect on successful login

      console.log('test login og to home redirectWebsite', redirectWebsite)
      router.replace(redirectWebsite || '/home')
    } else if (localToken) {
      console.log('case 2', localToken)
      router.replace('/home') // Redirect on successful login
    } else {
      console.log('case 3')
      console.log('redirect to web login main')

      // window.location.href = `${process.env.REACT_APP_URLMAIN_LOGIN}/login?ogwebsite=${encodeURIComponent(currentUrl)}`;
      router.replace(
        `${process.env.REACT_APP_URLMAIN_LOGIN}/login?ogwebsite=${encodeURIComponent(currentUrl)}&redirectWebsite=${redirectWebsite}`
      ) // Redirect on logout
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const defaultAuth = async () => {
    const newData: AuthResponse = {
      id: '370004',
      name: `บุญชู ลิ่มอติบูลย์`,
      email: '370004',
      image_id: '370004',
      ORG_ID: 'KPR',
      accessToken: 'accessToken_login_og',
      refreshToken: 'refreshToken_login_og',
      sessionId: '370004'
    }

    setUserInfo(newData)
    router.replace('/home')
  }

  useEffect(() => {
    checkAuthentication() // เรียกฟังก์ชัน async ที่สร้างขึ้น
    // defaultAuth(); // เรียกฟังก์ชัน async ที่สร้างขึ้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkAuth() {
    if (userSession?.id) {
      const res = await getCheckAuth(userSession?.id)

      console.log('checkAuth===', res.data)

      if (res?.data?.isLoggedIn === false) {
        Logout()
      }
    }
  }

  const Logout = async () => {
    clearUserInfo()
    const currentUrl = window.location.origin + window.location.pathname

    if (userSession?.id) {
      await LogoutAuthSSO(userSession?.id)
      router.replace(`${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}`)
    }
  }

  return (
    <div className='flex flex-col text-center justify-center items-center h-full'>
      <CircularProgress />
    </div>
  )
}

export default LoginOg
