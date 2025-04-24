'use client'

// Third-party Imports
import { useEffect, useState } from 'react'

import classnames from 'classnames'

// Component Imports
import { Box, Tooltip } from '@mui/material'

import NavToggle from './NavToggle'

import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import { getUserInfo } from '@/utils/userInfo'

const NavbarContent = () => {
  const userInfo = getUserInfo()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)

    if (userInfo) {
      console.log('have userInfo===', userInfo)
    } else {
      console.log('not have userInfo===', userInfo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wait for hydration to finish before rendering
  if (!hydrated) return null

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-2 is-full')}>
      <NavToggle />
      {/* <div className='flex items-center gap-4'>
        <ModeDropdown />
      </div> */}
      <div className='flex items-center'>
        <Tooltip title={userInfo?.name} arrow>
          <Box
            mt={1}
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '150px', // Adjust this value as needed
              fontSize: '1.2rem', // Adjust this value for your desired text size
              lineHeight: '1.5' // Optional: Adjust line height for better spacing
            }}
          >
            Tooling
          </Box>
        </Tooltip>
      </div>
      <div className='flex items-center'>
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
