'use client'

// Hook Imports
import { useMediaQuery, useTheme } from '@mui/material'

import useVerticalNav from '@menu/hooks/useVerticalNav'

const NavToggle = () => {
  // Hooks
  const { toggleVerticalNav, isBreakpointReached } = useVerticalNav()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // ตรวจสอบว่าหน้าจอเป็น mobile หรือไม่

  const handleClick = () => {
    toggleVerticalNav()
  }

  return (
    <>
      {/* <i className='tabler-menu-2 cursor-pointer' onClick={handleClick} /> */}
      {/* Comment following code and uncomment above code in order to toggle menu on desktop screens as well */}
      {!isMobile && isBreakpointReached && <i className='tabler-menu-2 cursor-pointer' onClick={handleClick} />}
    </>
  )
}

export default NavToggle
