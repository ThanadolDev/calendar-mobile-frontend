'use client'

// Component Imports
import { useEffect, useState } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import { BottomNavigation, BottomNavigationAction, Paper, useMediaQuery, useTheme } from '@mui/material'

// import FooterContent from './FooterContent'
import HomeIcon from '@mui/icons-material/Home'
import AppsIcon from '@mui/icons-material/Apps'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import LayoutFooter from '@layouts/components/vertical/Footer'

const Footer = () => {
  const theme = useTheme()
  const [value, setValue] = useState(0)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // ตรวจสอบว่าหน้าจอเป็น mobile หรือไม่
  const router = useRouter()
  const pathname = usePathname()

  // เส้นทางสำหรับแต่ละปุ่ม
  const routes = ['/home', '/apps', '/more']

  // Set default value based on the pathname
  useEffect(() => {
    const currentIndex = routes.indexOf(pathname)

    if (currentIndex !== -1) {
      setValue(currentIndex) // Set the initial value based on current route
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Run effect when pathname changes

  const handleNavigation = (newValue: number) => {
    setValue(newValue) // Update BottomNavigation value
    router.push(routes[newValue]) // Navigate to the specified route
  }

  return (
    <LayoutFooter>
      {isMobile && ( // แสดง Paper เฉพาะเมื่อหน้าจอ mobile
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
          <BottomNavigation showLabels value={value} onChange={(event, newValue) => handleNavigation(newValue)}>
            <BottomNavigationAction label='หน้าหลัก' icon={<HomeIcon />} />
            <BottomNavigationAction label='Apps' icon={<AppsIcon />} />
            <BottomNavigationAction label='อื่นๆ' icon={<MoreHorizIcon />} />
          </BottomNavigation>
        </Paper>
      )}
    </LayoutFooter>
  )
}

export default Footer
