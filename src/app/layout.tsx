// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import { Noto_Sans_Thai } from 'next/font/google'

import type { ChildrenType } from '@core/types'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

import { PermissionProvider } from '../contexts/PermissionContext'
import { ToastProvider } from '../components/ui/Toast'

// ตั้งค่า Sarabun
const sarabun = Noto_Sans_Thai({
  weight: ['400', '700'], // กำหนดน้ำหนักของฟอนต์ที่ต้องการใช้ เช่น 400 (normal) และ 700 (bold)
  subsets: ['thai', 'latin'], // เลือก subsets ให้รองรับภาษาไทยและภาษาอื่น ๆ
  variable: '--font-noto-sans-thai' // ตั้งชื่อ CSS Variable สำหรับเรียกใช้ใน CSS
})

// const modeTitle = process.env.MODE_TITLE

export const metadata = {
  title: `Handbook Management`,
  description: 'Handbook Management WEB'
}

const RootLayout = ({ children }: ChildrenType) => {
  // Vars
  const direction = 'ltr'

  return (
    <PermissionProvider>
      <html id='__next' lang='en' dir={direction}>
        <body className={`flex is-full min-bs-full flex-auto flex-col ${sarabun.variable} antialiased`}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </PermissionProvider>
  )
}

export default RootLayout
