'use client'

import { useEffect, useState, useCallback } from 'react'

import { Box, useTheme, useMediaQuery, Alert, Snackbar, CircularProgress, Typography, Paper } from '@mui/material'

import { getUserInfo } from '@/utils/userInfo'
import type { IUserInfo, IDiecut } from '../../types/types'
import RequestTable from './RequestTable'
import DetailPanel from './DetailPanel'
import { api } from '../../services/api'

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
  const [selectedType, setSelectedType] = useState<string>('')

  const userInfo = getUserInfo() as IUserInfo | null
  const isManager = true

  const fetchData = useCallback(async () => {
    // if (!userInfo?.id && !userInfo?.ORG_ID) {
    //   setError('User information not found. Please log in again.')

    //   return
    // }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:2525/api/diecuts/status`)

      // setData(result.data || [])
      // const response = await api.get(`http://localhost:2525/api/diecuts/status`)

      const result = await response.json()

      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`)
      console.log(result.data.diecuts)
      setData(result.data.diecuts)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data. Please try again later.')
      setLoading(false)
    }
  }, [])

  const handleItemSelect = (item: IDiecut) => {
    // Reset editing state when selecting a new item
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

  const handleStatusChange = () => {
    if (selectedItem) {
      setSelectedItem({
        ...selectedItem
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
      setData(prev => prev.map(item => (item.DIECUT_ID === selectedItem.DIECUT_ID ? selectedItem : item)))

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
    // Reset editing state and revert to original data
    setIsEditing(false)

    // Reset to original data from server-side data
    if (selectedItem) {
      const originalItem = data.find(item => item.DIECUT_ID === selectedItem.DIECUT_ID)

      setSelectedItem(originalItem || null)
    }
  }

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  useEffect(() => {
    fetchData()
  }, [fetchData, selectedType])

  // Reset selected item when data changes
  useEffect(() => {
    if (selectedItem && data.length > 0) {
      const updatedItem = data.find(item => item.DIECUT_ID === selectedItem.DIECUT_ID)

      if (updatedItem) {
        setSelectedItem(updatedItem)
      }
    }
  }, [data])

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
          height: 'calc(100vh - 120px)' // Adjust based on navbar height
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
            <Button variant='text' color='inherit' size='small' onClick={fetchData}>
              Try Again
            </Button>
          </Alert>
        )}

        {/* Main content area */}

        <Paper
          sx={{
            p: 2,
            gridColumn: isMobile ? 'span 4' : 'span 3',
            overflow: 'hidden',
            backgroundColor: 'background.paper'
          }}
          className='shadow'
        >
          <RequestTable
            data={data}
            loading={loading}
            isManager={isManager}
            handleItemSelect={handleItemSelect}
            handleEditClick={handleEditClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedType={setSelectedType}
            selectedType={selectedType}
          />
        </Paper>

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
