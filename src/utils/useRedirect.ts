import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import type { AuthResponse } from '@/types/auth'

const useRedirect = (userData: AuthResponse | null) => {
  const router = useRouter()

  useEffect(() => {
    console.log('useEffect=', userData)

    if (!userData) {
      const currentUrl = window.location.origin + '/handbookmanage/login-og'
      const redirectUrl = window.location.href // ใช้ href เพื่อให้ได้ URL เต็มที่เปิดอยู่

      console.log('currentUrl=', currentUrl)
      console.log('redirectUrl=', redirectUrl)

      const urlAddress = `${process.env.REACT_APP_URLMAIN_LOGIN}/login?ogwebsite=${encodeURIComponent(currentUrl)}&redirectWebsite=${redirectUrl}`

      console.log('urlAddress=', urlAddress)

      // router.replace(urlAddress)
    } else {
      console.log('authenticate')
    }
  }, [userData, router])
}

export default useRedirect
