'use client'

import { useEffect, useState, useCallback } from 'react'

import { Box, useTheme, useMediaQuery, Alert, Snackbar, CircularProgress, Typography } from '@mui/material'

import { getUserInfo } from '@/utils/userInfo'
import type { IRequest, IUserInfo, IDiecut } from '../../types/types'
import { mockRequests } from './mockData'
import RequestTable from './RequestTable'
import DetailPanel from './DetailPanel'

const HomeComponent = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<IDiecut[]>([])
  const [selectedItem, setSelectedItem] = useState<IDiecut | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const })
  const [searchQuery, setSearchQuery] = useState('')

  const userInfo = getUserInfo() as IUserInfo | null
  const isManager = userInfo?.role === 'manager'

  const fetchData = useCallback(async () => {
    // if (!userInfo?.id && !userInfo?.ORG_ID) {
    //   setError('User information not found. Please log in again.')

    //   return
    // }

    setLoading(true)
    setError(null)

    try {
      // In a real app, you would fetch from API
      // const response = await fetch(`/api/requests?userId=${userInfo.id}&orgId=${userInfo.ORG_ID}`)
      // if (!response.ok) throw new Error(`Server responded with status: ${response.status}`)
      // const result = await response.json()
      // setData(result.data || [])

      // Using mock data
      setTimeout(() => {
        setData(mockRequests)
        setLoading(false)
      }, 800) // Simulate network delay
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data. Please try again later.')
      setLoading(false)
    }
  }, [userInfo])

  const handleItemSelect = (item: IDiecut) => {
    setSelectedItem(item)
    setIsEditing(false)
  }

  const handleEditClick = (item: IDiecut) => {
    setSelectedItem(item)
    setIsEditing(true)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleStatusChange = (status: 'Pending' | 'Approved' | 'Rejected') => {
    if (selectedItem) {
      setSelectedItem({
        ...selectedItem,
        status
      })
    }
  }

  const handleSave = async () => {
    if (!isManager || !selectedItem) return

    setLoading(true)

    try {
      // Mock API call - replace with actual implementation
      // const response = await fetch(`/api/requests/${selectedItem.id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${userInfo?.token}`
      //   },
      //   body: JSON.stringify(selectedItem)
      // })

      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update local data
      setData(prev => prev.map(item => (item.id === selectedItem.id ? selectedItem : item)))

      setIsEditing(false)
      setSnackbar({
        open: true,
        message: 'Changes saved successfully',
        severity: 'success'
      })
    } catch (error) {
      console.error('Error saving changes:', error)
      setSnackbar({
        open: true,
        message: `Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)

    // Reset to original data
    setSelectedItem(data.find(item => item.id === selectedItem?.id) || null)
  }

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading && !data.length) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 110px)'
        }}
      >
        <CircularProgress sx={{ color: '#98867B' }} />
        <Typography variant='body2' sx={{ mt: 2 }}>
          Loading data...
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gridTemplateRows: isMobile ? 'auto auto auto' : '1fr',
          height: 'calc(100vh - 110px)' // Adjust based on navbar height
        }}
      >
        {error && (
          <Alert
            severity='error'
            sx={{
              gridColumn: 'span 4',
              mb: 2
            }}
          >
            {error}
            {/* <Button variant='text' color='inherit' size='small' onClick={fetchData}>
              Try Again
            </Button> */}
          </Alert>
        )}

        {/* Main content area */}
        <Box
          sx={{
            p: 2,
            gridColumn: isMobile ? 'span 4' : 'span 3',
            overflow: 'hidden',
            backgroundColor: 'background.paper'
          }}
        >
          <RequestTable
            data={data}
            loading={loading}
            isManager={isManager}
            handleItemSelect={handleItemSelect}
            handleEditClick={handleEditClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </Box>

        {/* Right sidebar panel */}
        <Box
          sx={{
            gridColumn: isMobile ? 'span 4' : 'span 1',
            display: 'grid',
            gap: 2,
            gridTemplateRows: '1fr'
          }}
        >
          <DetailPanel
            selectedItem={selectedItem}
            isEditing={isEditing}
            isManager={isManager}
            loading={loading}
            handleEdit={handleEdit}
            handleSave={handleSave}
            handleCancel={handleCancel}
            handleStatusChange={handleStatusChange}
          />
        </Box>
      </Box>

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant='filled'>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default HomeComponent
