'use client'

import { useEffect, useState, useCallback } from 'react'

import { Box, useTheme, useMediaQuery, Alert, CircularProgress, Typography, Paper, Button } from '@mui/material'

import OrderModal from '../OrderModal'

// import { getUserInfo } from '@/utils/userInfo'
import type { IDiecut } from '../../types/types'
import RequestTable from './RequestTable'
import DetailPanel from './DetailPanel'
import RoleSwitcher from './RoleSwitcher'

// import useRoleAccess from '../../hooks/useRoleAccess'
// import appConfig from '../../configs/appConfig'
import { usePermission } from '../../contexts/PermissionContext'
import apiClient from '../../services/apiClient'

const HomeComponent = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<IDiecut[]>([])
  const [selectedItem, setSelectedItem] = useState<IDiecut | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string[]>(['DC'])
  const [diecutTypes, setDiecutTypes] = useState<string[]>([])
  const [typesLoading, setTypesLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderItem, setOrderItem] = useState<IDiecut | null>(null)

  // Use permissions from role access hook instead of static isManager flag
  const { isManager, canModify, canRecordDetails } = usePermission()
  const canEdit = canModify || canRecordDetails

  const fetchDiecutTypes = useCallback(async () => {
    setTypesLoading(true)

    try {
      const result: any = await apiClient.get('/api/diecuts/types')

      if (result.success) {
        // Update to use PTC_TYPE and PTC_DESC from the API response
        const types = result.data.diecutType.filter((item: any) => item.PTC_TYPE !== null)

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

  // Handle type change
  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log(selectedType)

      // If selectedType has a value, include it in the API call
      const url = selectedType ? `/api/diecuts/status?diecutType=${selectedType}` : `/api/diecuts/status`

      console.log(url)
      const result: any = await apiClient.get(url)

      if (result.success) {
        setData(result.data.diecuts)
      } else {
        throw new Error('Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    setSelectedType(event.target.value as string[])
  }

  const handleTypeSearch = (): void => {
    fetchData()
  }

  const handleItemSelect = () => {
    // Show loading state
    setDetailLoading(true)

    // Show the detail panel
    setShowDetailPanel(true)

    // Reset editing state when selecting a new item
    // setSelectedItem(item)
    setIsEditing(false)

    // Simulate delay or use actual data loading time
    setTimeout(() => {
      setDetailLoading(false)
    }, 800) // Adjust timing based on your actual data loading performance
  }

  const handleEditClick = (item: IDiecut) => {
    // Only allow edit if user has permission
    setSelectedItem(item)
    setIsEditing(true)

    // Show the detail panel
    setShowDetailPanel(true)
  }

  const handleEdit = () => {
    // Only allow edit if user has permission
    setIsEditing(true)
  }

  const handleOrderClick = (item: IDiecut) => {
    setOrderItem(item)
    setShowOrderModal(true)
  }

  const handleOrderComplete = () => {
    fetchData()
  }

  const handleDetailUpdate = () => {
    // Refresh the data
    fetchData()
  }

  // Add this function to HomeComponent
  // const handleAddRecord = (type: string) => {
  //   // Generate a temporary ID for the new record
  //   const timestamp = Date.now()
  //   const tempId = `${type || 'DC'}-TEMP-${timestamp}`

  //   // Create a new record with default values
  //   const newItem: IDiecut = {
  //     DIECUT_ID: tempId,
  //     DIECUT_SN: `${type || 'DC'}-NEW-${timestamp}`,
  //     STATUS: 'N', // Default status for new records
  //     DIECUT_TYPE: type || selectedType[0] || 'DC',
  //     BLANK_SIZE_X: null,
  //     BLANK_SIZE_Y: null,
  //     AGES: 0,
  //     REMAIN: 0,
  //     DIECUT_NEAR_EXP: 0

  //     // Add other required fields with default values
  //   }

  //   // Select the new item immediately
  //   setSelectedItem(newItem)

  //   // Set editing mode to true
  //   setIsEditing(true)

  //   // Show the detail panel
  //   setShowDetailPanel(true)

  //   // Show detail loading state briefly for visual feedback
  //   setDetailLoading(true)
  //   setTimeout(() => {
  //     setDetailLoading(false)
  //   }, 500)
  // }

  // Function to handle newly created items after they've been saved
  // const handleNewRecordSave = async (newRecord: IDiecut) => {
  //   setLoading(true)

  //   try {
  //     // Call API to create the new record
  //     const result = await apiClient.post('/api/diecuts/create', newRecord)

  //     if (result.success) {
  //       // Add the new record to the data array
  //       setData(prev => [result.data.diecut, ...prev])

  //       // Update the selected item with the returned data (which should have proper IDs)
  //       setSelectedItem(result.data.diecut)

  //       // Show success message

  //       // Refresh the data to ensure everything is up to date
  //       fetchData()
  //     } else {
  //       throw new Error(result.message || 'Failed to create new record')
  //     }
  //   } catch (error) {
  //     console.error('Error creating new record:', error)
  //   } finally {
  //     setLoading(false)
  //     setIsEditing(false)
  //   }
  // }

  const handleStatusChange = (status: 'Pending' | 'Pass' | 'Rejected') => {
    // Only allow status change if user has permission to approve
    // if (!roleAccess.canApprove) {
    //   return
    // }

    if (selectedItem) {
      setSelectedItem({
        ...selectedItem,
        STATUS: status
      })
    }
  }

  const handleSave = async () => {
    // if (!roleAccess.canModify || !selectedItem) return

    setLoading(true)

    try {
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update local data
      setData(prev =>
        prev.map(item => {
          if (item.DIECUT_ID === selectedItem?.DIECUT_ID) {
            return selectedItem as IDiecut // Cast to ensure it's an IDiecut
          }

          return item
        })
      )

      setIsEditing(false)
    } catch (error) {
      console.error('Error saving changes:', error)
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

  // Function to close the detail panel
  const handleDetailClose = () => {
    setShowDetailPanel(false)
    setSelectedItem(null)
    setIsEditing(false)
  }

  // Add this function to the HomeComponent for handling new blade creation
  // const handleNewBladeInGroup = (groupId: string) => {
  //   // Generate a unique timestamp for the new blade
  //   const timestamp = Date.now()

  //   // Create a new blade object with the group's diecut ID
  //   const newItem: IDiecut = {
  //     DIECUT_ID: groupId,
  //     DIECUT_SN: `${groupId}-NEW-${timestamp}`,
  //     STATUS: 'N', // Default status for new records
  //     DIECUT_TYPE: selectedType[0] || 'DC',

  //     // Add common fields with default values
  //     BLANK_SIZE_X: null,
  //     BLANK_SIZE_Y: null,
  //     AGES: 0,
  //     REMAIN: 0,
  //     PRIORITY: 'Medium',
  //     MODIFY_TYPE: 'N',
  //     JOB_ORDER: '',
  //     PRODUCT_CODE: '',
  //     DIECUT_NEAR_EXP: 0
  //   }

  //   // Add the new item to the data array for immediate UI feedback
  //   setData(prevData => [...prevData, newItem])

  //   // Set the selected item to the new blade
  //   setSelectedItem(newItem)

  //   // Set editing mode to true
  //   setIsEditing(true)

  //   // Show the detail panel
  //   setShowDetailPanel(true)

  //   // Show detail loading state briefly for visual feedback
  //   setDetailLoading(true)
  //   setTimeout(() => {
  //     setDetailLoading(false)
  //   }, 500)
  // }

  // Function to handle saving a newly created blade
  // const handleSaveNewBlade = async (bladeData: IDiecut) => {
  //   setLoading(true)

  //   try {
  //     // Prepare the API payload
  //     const payload = {
  //       diecutId: bladeData.DIECUT_ID,
  //       diecutSN: bladeData.DIECUT_SN,
  //       diecutType: bladeData.DIECUT_TYPE || selectedType[0] || 'DC',
  //       status: 'N',

  //       // Include any other fields from the form
  //       ...bladeData
  //     }

  //     // Call the API to create the new blade
  //     const result = await apiClient.post('/api/diecuts/create', payload)

  //     if (result.success) {
  //       // Replace the temporary blade in the data array with the saved one
  //       setData(prevData => prevData.map(item => (item.DIECUT_SN === bladeData.DIECUT_SN ? result.data.diecut : item)))

  //       // Update the selected item with the returned data
  //       setSelectedItem(result.data.diecut)

  //       // Exit editing mode
  //       setIsEditing(false)

  //       // Refresh the full data to ensure everything is up to date
  //       fetchData()
  //     } else {
  //       throw new Error(result.message || 'Failed to create new blade')
  //     }
  //   } catch (error) {
  //     console.error('Error creating new blade:', error)

  //     // Handle error (use your existing toast/notification system)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // Fetch diecut types when the component mounts
  useEffect(() => {
    fetchDiecutTypes()
  }, [fetchDiecutTypes])

  // Fetch data when the component mounts or when selectedType changes
  useEffect(() => {
    fetchData()
  }, [])

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
          {/* Development mode chips removed for brevity */}
        </Box>
      )}
      <RoleSwitcher />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: isMobile ? '1fr' : showDetailPanel ? 'repeat(4, 1fr)' : '1fr',
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
            gridColumn: isMobile ? 'span 4' : showDetailPanel ? 'span 3' : 'span 4',
            overflow: 'hidden',
            backgroundColor: 'background.paper',
            transition: 'all 0.3s ease'
          }}
          className='shadow'
        >
          <RequestTable
            data={data}
            setData={setData}
            loading={loading}
            isManager={isManager}
            handleItemSelect={handleItemSelect}
            handleEditClick={handleEditClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedType={setSelectedType}
            selectedType={selectedType}
            handleTypeSearch={handleTypeSearch}
            diecutTypes={diecutTypes}
            typesLoading={typesLoading}
            handleTypeChange={handleTypeChange}
            handleOrderClick={handleOrderClick}
            selectedItem={selectedItem}
          />
        </Paper>

        {/* Right sidebar panel - only show when a process button has been clicked */}
        {showDetailPanel && (
          <Box
            sx={{
              gridColumn: isMobile ? 'span 4' : 'span 1',
              display: 'grid',
              gap: 2,
              gridTemplateRows: '1fr',
              transition: 'all 0.3s ease'
            }}
          >
            <DetailPanel
              selectedItem={selectedItem}
              isEditing={isEditing}
              isManager={isManager}
              loading={loading}
              detailLoading={detailLoading}
              handleEdit={handleEdit}
              handleSave={handleSave}
              handleCancel={handleCancel}
              handleStatusChange={handleStatusChange}
              canEdit={canEdit}
              onClose={handleDetailClose}
              data={data}
              onProcessComplete={handleDetailUpdate}
            />
          </Box>
        )}
      </Box>
      <OrderModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        selectedItem={orderItem}
        onComplete={handleOrderComplete}
      />
      {/* Notifications */}
      {/* <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant='filled'>
          {snackbar.message}
        </Alert>
      </Snackbar> */}
    </>
  )
}

export default HomeComponent
