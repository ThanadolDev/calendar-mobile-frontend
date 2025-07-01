'use client'

import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Button, CircularProgress, Divider, List, ListItem, ListItemText, Paper } from '@mui/material'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'

import { clearUserInfo, getUserInfo } from '@/utils/userInfo'
import ModeDropdown from '../layout/shared/ModeDropdown'
import ReleasedVersion from '../ReleasedVersion'

const MoreComponent = () => {
  const [loading, setLoading] = useState(true)
  const userInfo = getUserInfo()
  const router = useRouter()
  const [isImplement, setImplement] = useState(false)

  const handleUserLogout = async () => {
    clearUserInfo()

    const currentUrl = `${window.location.origin}/handbookmanage/login-og`
    const redirectUrl = window.location.href // ใช้ href เพื่อให้ได้ URL เต็มที่เปิดอยู่

    console.log('currentUrl=', currentUrl)
    console.log('redirectUrl=', redirectUrl)

    router.replace(
      `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}&redirectWebsite=${redirectUrl}`
    )
  }

  const fetchData = async () => {
    setLoading(true)

    if (!userInfo?.id && !userInfo?.ORG_ID) {
      return
    }

    try {
      // กำหนดให้เเสดงเมนู admin tool
      setImplement(false)
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className='flex flex-col text-center justify-center items-center h-full'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 h-full pb-2'>
      <Paper className='p-2 shadow flex-grow'>
        <List dense={false}>
          <ListItem>
            <ListItemText primary={'Mode'} secondary={''} />
            <ModeDropdown />
          </ListItem>
          <Divider />
          <ReleasedVersion />
          <Divider />

          {isImplement && (
            <>
              <ListItem
                onClick={() => router.push('/admin-tool')}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                <ListItemText primary={'Admin Tool'} secondary={''} />
                <KeyboardArrowRightIcon />
              </ListItem>
              <Divider />
            </>
          )}
        </List>
      </Paper>
      <Button variant='contained' color='error' className='w-full' onClick={handleUserLogout}>
        ออกจากระบบ
      </Button>
    </div>
  )
}

export default MoreComponent
