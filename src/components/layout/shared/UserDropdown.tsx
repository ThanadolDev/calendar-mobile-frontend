'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
// import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import { clearUserInfo, getUserInfo } from '@/utils/userInfo'

import useRedirect from '@/utils/useRedirect'

// Styled component for badge content
// const BadgeContentSpan = styled('span')({
//   width: 8,
//   height: 8,
//   borderRadius: '50%',
//   cursor: 'pointer',
//   backgroundColor: 'var(--mui-palette-success-main)',
//   boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
// })

const UserDropdown = () => {
  // Hydration state
  const [hydrated, setHydrated] = useState(false)
  const [open, setOpen] = useState(false)
  const [imageTxt, setImageTxt] = useState('')
  const userInfo = getUserInfo()
  const router = useRouter()

  const { settings } = useSettings()

  const anchorRef = useRef<HTMLDivElement>(null)
  const currentUrl = `${window.location.origin}/handbookmanage/login-og`
  const redirectUrl = window.location.href // ใช้ href เพื่อให้ได้ URL เต็มที่เปิดอยู่

  const handleDropdownOpen = () => {
    setOpen(prev => !prev)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) router.push(url)

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleUserLogout = async () => {
    clearUserInfo()

    console.log('currentUrl=', currentUrl)
    console.log('redirectUrl=', redirectUrl)

    router.replace(
      `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}&redirectWebsite=${redirectUrl}`
    )
  }

  // Check for user redirection
  useRedirect(userInfo)

  useEffect(() => {
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userInfo?.id) {
      setImageTxt(`https://api.nitisakc.dev/avatar/${userInfo?.id}`)
    }
  }, [userInfo?.id])

  // Wait for hydration to finish before rendering
  if (!hydrated) return null

  return (
    <Badge
      ref={anchorRef}

      // overlap='circular'
      // badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
      // anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      // className='mis-2'
    >
      {userInfo?.id ? (
        <Avatar
          alt={userInfo?.name}
          src={imageTxt}
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        />
      ) : (
        ''
      )}

      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-6 gap-2' tabIndex={-1}>
                    <Avatar alt={userInfo?.name} src={`https://api.nitisakc.dev/avatar/${userInfo?.id}`} />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {userInfo?.name}
                      </Typography>
                      <Typography variant='caption'>{userInfo?.email}</Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <div className='flex items-center plb-2 pli-3'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='tabler-logout' />}
                      onClick={handleUserLogout}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
                    >
                      ออกจากระบบ
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </Badge>
  )
}

export default UserDropdown
