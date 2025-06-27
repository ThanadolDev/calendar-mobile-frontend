'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// This component handles the root route and redirects to /home
const RootPage = () => {
  const router = useRouter()

  useEffect(() => {
    // Redirect to /home immediately when accessing root path
    router.replace('/home')
  }, [router])

  // Show a brief loading message while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  )
}

export default RootPage