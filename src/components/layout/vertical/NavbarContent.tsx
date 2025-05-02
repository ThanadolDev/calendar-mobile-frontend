'use client'

// Third-party Imports
import { useEffect, useState } from 'react'

// import { useRouter } from 'next/navigation'

import classnames from 'classnames'

// Component Imports
import { Box, Tooltip, Typography, IconButton } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'

import NavToggle from './NavToggle'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import { getUserInfo } from '@/utils/userInfo'

const NavbarContent = () => {
  // const router = useRouter()
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

  const handleInfoClick = () => {
    // Fetch data or simply navigate to the info page
    // You can replace this with an actual API call if needed
    // router.push('/info-page')
  }

  // Wait for hydration to finish before rendering
  if (!hydrated) return null

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-2 is-full')}>
      <NavToggle />
      {/* <div className='flex items-center gap-4'>
        <ModeDropdown />
      </div> */}
      <div className='flex items-center'>
        <Box
          mt={1}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px', // Slightly increased to accommodate the icon
            fontSize: '1.2rem',
            lineHeight: '1.5'
          }}
        >
          <Tooltip title='Click for more information'>
            <IconButton
              onClick={handleInfoClick}
              size='small'
              sx={{
                mr: 1,
                color: 'primary.main',
                height: '36px',
                width: '36px',
                padding: '0'
              }}
            >
              <InfoIcon
                sx={{
                  fontSize: '50px',
                  maxHeight: '100%'
                }}
              />
            </IconButton>
          </Tooltip>
          Tooling
        </Box>
      </div>
      <div className='flex items-center gap-4'>
        <Typography>{userInfo?.name}</Typography>
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
