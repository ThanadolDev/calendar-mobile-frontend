'use client'

import { useEffect, useState, useCallback } from 'react'

import {
  Box,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  CircularProgress,
  Typography,
  Paper,
  Button,
  Chip
} from '@mui/material'

import { getUserInfo } from '@/utils/userInfo'
import type { IUserInfo, IDiecut } from '../../types/types'
import RequestTable from './RequestTable'
import DetailPanel from './DetailPanel'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import appConfig from '../../configs/appConfig'
import { usePermission } from '../../contexts/PermissionContext'

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
  const [selectedType, setSelectedType] = useState<string>('DC')
  const [diecutTypes, setDiecutTypes] = useState<string[]>([])
  const [typesLoading, setTypesLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // Use permissions from role access hook instead of static isManager flag
  const { isManager, canModify, canRecordDetails, canApprove } = usePermission()
  const canEdit = canModify || canRecordDetails

  // Fetch diecut types from the API
  const fetchDiecutTypes = useCallback(async () => {
    setTypesLoading(true)

    try {
      const response = await fetch(`${appConfig.api.baseUrl}/diecuts/types`)

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const types = result.data.diecutType.map(item => item.DIECUT_TYPE).filter(type => type !== null)

        setDiecutTypes(types)
      } else {
        console.error('Failed to fetch diecut types:', result.message)
      }
    } catch (error) {
      console.error('Error fetching diecut types:', error)
    } finally {
      setTypesLoading(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // If selectedType has a value, include it in the API call
      const url = selectedType
        ? `${appConfig.api.baseUrl}/diecuts/status?diecutType=${encodeURIComponent(selectedType)}`
        : `${appConfig.api.baseUrl}/diecuts/status`

      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`)
      console.log(result.data.diecuts)
      setData(result.data.diecuts)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [selectedType])

  // Handle type change
  const handleTypeChange = event => {
    setSelectedType(event.target.value)
  }

  const handleItemSelect = (item: IDiecut) => {
    // Show loading state
    setDetailLoading(true)

    // Reset editing state when selecting a new item
    setSelectedItem(item)
    setIsEditing(false)

    // Simulate delay or use actual data loading time
    setTimeout(() => {
      setDetailLoading(false)
    }, 800) // Adjust timing based on your actual data loading performance
  }

  const handleEditClick = (item: IDiecut) => {
    // Only allow edit if user has permission
    if (roleAccess.canModify) {
      setSelectedItem(item)
      setIsEditing(true)
    } else {
      setSnackbar({
        open: true,
        message: 'You do not have permission to edit requests',
        severity: 'warning'
      })
    }
  }

  const handleEdit = () => {
    // Only allow edit if user has permission
    if (roleAccess.canModify) {
      setIsEditing(true)
    } else {
      setSnackbar({
        open: true,
        message: 'You do not have permission to edit requests',
        severity: 'warning'
      })
    }
  }

  const handleStatusChange = (status: 'Pending' | 'Pass' | 'Rejected') => {
    // Only allow status change if user has permission to approve
    if (!roleAccess.canApprove) {
      setSnackbar({
        open: true,
        message: 'You do not have permission to change status',
        severity: 'warning'
      })

      return
    }

    if (selectedItem) {
      setSelectedItem({
        ...selectedItem,
        STATUS: status
      })
    }
  }

  const handleSave = async () => {
    if (!roleAccess.canModify || !selectedItem) return

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

  // Fetch diecut types when the component mounts
  useEffect(() => {
    fetchDiecutTypes()
  }, [fetchDiecutTypes])

  // Fetch data when the component mounts or when selectedType changes
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
      {/* Display user role and feature toggles in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* <Chip label={`User: ${userRole || 'Not logged in'}`} size='small' color='primary' />
          <Chip
            label={`RBAC: ${appConfig.features.enableRoleBasedAccess ? 'ON' : 'OFF'}`}
            size='small'
            color={appConfig.features.enableRoleBasedAccess ? 'success' : 'default'}
          />
          <Chip
            label={`Formatting: ${appConfig.features.enableNumberFormatting ? 'ON' : 'OFF'}`}
            size='small'
            color={appConfig.features.enableNumberFormatting ? 'success' : 'default'}
          />
          {!appConfig.features.enableRoleBasedAccess && (
            <Chip label={`Default Role: ${appConfig.defaultRole}`} size='small' color='info' />
          )} */}
        </Box>
      )}

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
            diecutTypes={diecutTypes}
            typesLoading={typesLoading}
            handleTypeChange={handleTypeChange}
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
            detailLoading={detailLoading} // Add this new prop
            handleEdit={handleEdit}
            handleSave={handleSave}
            handleCancel={handleCancel}
            handleStatusChange={handleStatusChange}
            canEdit={canEdit}
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
