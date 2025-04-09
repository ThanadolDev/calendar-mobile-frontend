'use client'

import { useState, useEffect, useRef } from 'react'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Box, Typography, Chip, Paper, Button, CircularProgress, TextField, Grid, IconButton } from '@mui/material'

import { isEqual } from 'lodash'

import { usePermission } from '../../contexts/PermissionContext'
import PermissionGate from '../PermissionGate'
import { PermissionButton } from '../PermissionButton'

import type { IDiecut } from '../../types/types'
import { formatNumber } from '../../utils/formatters'

// Define interface for blade item
interface BladeItem {
  DIECUT_ID: any
  DIECUT_SN: string
  BLADE_TYPE: any
  DIECUT_AGE: number
  STATUS: string
  bladeType: string
  bladeSize: string
  details: string
  TL_STATUS: string
  PROB_DESC: string
  START_TIME: Date
  END_TIME: Date
  PRODUCTION_ISSUE: string
  TOOLING_AGE: number
  FIX_DETAILS: string
  BLADE_SIZE: string
  MULTI_BLADE_REASON: string
  MULTI_BLADE_REMARK: string
  isNewlyAdded: boolean
  REMARK: string
}

interface DetailPanelProps {
  selectedItem: IDiecut | null
  isEditing: boolean
  isManager: boolean
  loading: boolean
  handleEdit: () => void
  handleSave: () => void
  handleCancel: () => void
  handleStatusChange: (status: 'Pending' | 'Pass' | 'Rejected') => void
  canEdit: boolean
}

const DetailPanel = ({
  selectedItem,
  isEditing,
  loading,
  handleEdit,
  handleSave,
  handleCancel,
  handleStatusChange
}: DetailPanelProps) => {
  const { isManager, canModify, canApprove, canRecordDetails } = usePermission()
  const canEdit = canModify || canRecordDetails

  // State for editing a specific blade
  const [editingBladeSN, setEditingBladeSN] = useState<string | null>(null)
  const [dieCutSNList, setDieCutSNList] = useState<BladeItem[]>([])
  const [bladeFormData, setBladeFormData] = useState<BladeItem | null>(null)

  // Keep original data references to compare for changes
  const originalBladeDataRef = useRef<BladeItem | null>(null)
  const originalListRef = useRef<BladeItem[]>([])

  // Function to compare original list with current list - ignoring isNewlyAdded flags
  const hasListChanged = () => {
    // Different length means there's been a change
    if (originalListRef.current.length !== dieCutSNList.length) {
      return true
    }

    // Compare each item's essential data fields
    const compareItems = (a: BladeItem, b: BladeItem) => {
      return (
        a.DIECUT_SN === b.DIECUT_SN &&
        a.BLADE_TYPE === b.BLADE_TYPE &&
        a.DIECUT_AGE === b.DIECUT_AGE &&
        a.PROB_DESC === b.PROB_DESC &&
        a.REMARK === b.REMARK
      )
    }

    // Check if all items in the original list exist in the current list
    const allItemsMatch = originalListRef.current.every(originalItem => {
      return dieCutSNList.some(currentItem => compareItems(originalItem, currentItem))
    })

    // Check if all items in the current list exist in the original list
    const allCurrentItemsHaveOrigin = dieCutSNList.every(currentItem => {
      return originalListRef.current.some(originalItem => compareItems(originalItem, currentItem))
    })

    // If both checks pass, no effective change has occurred
    return !(allItemsMatch && allCurrentItemsHaveOrigin)
  }

  // Function to check if blade form data has changed from original
  const hasFormChanged = () => {
    if (!bladeFormData || !originalBladeDataRef.current) return false

    // Create comparison objects with only the fields we care about
    const getComparisonObject = (data: BladeItem) => {
      const { DIECUT_AGE, BLADE_TYPE, PROB_DESC, REMARK, MULTI_BLADE_REASON, MULTI_BLADE_REMARK } = data

      // Format dates consistently for comparison
      const formatDate = (date: any) => {
        if (!date) return null

        return typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0]
      }

      return {
        DIECUT_AGE: DIECUT_AGE ?? '',
        BLADE_TYPE: BLADE_TYPE ?? '',
        PROB_DESC: PROB_DESC ?? '',
        REMARK: REMARK ?? '',
        MULTI_BLADE_REASON: MULTI_BLADE_REASON ?? '',
        MULTI_BLADE_REMARK: MULTI_BLADE_REMARK ?? '',
        START_TIME: formatDate(data.START_TIME),
        END_TIME: formatDate(data.END_TIME)
      }
    }

    const originalForComparison = getComparisonObject(originalBladeDataRef.current)
    const currentForComparison = getComparisonObject(bladeFormData)

    // Use deep comparison to check if data has changed
    return !isEqual(originalForComparison, currentForComparison)
  }

  const handleBladeChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    if (!bladeFormData) return

    setBladeFormData(prev => ({
      ...prev!,
      [field]: field.includes('Date') && value ? new Date(value) : value
    }))
  }

  async function getDetailData(diecutId: any) {
    try {
      const response = await fetch(`http://localhost:2525/api/diecuts/getdiecutsn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          diecutId: selectedItem?.DIECUT_ID
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        return data.data.diecutList
      } else {
        console.error('Failed to fetch diecut SN data:', data.message)

        return []
      }
    } catch (error) {
      console.error('Error fetching diecut SN data:', error)

      return []
    }
  }

  // The useEffect hook to load data when a die cut is selected
  useEffect(() => {
    // Clear editing state when selected item changes
    setEditingBladeSN(null)
    setBladeFormData(null)
    originalBladeDataRef.current = null

    if (selectedItem) {
      console.log('Selected item:', selectedItem)

      // Fetch diecut SN data from API
      const loadDiecutData = async () => {
        const diecutId = selectedItem.DIECUT_ID
        const snData = await getDetailData(diecutId)

        if (snData && snData.length > 0) {
          // Mark all blades from API as not newly added
          const markedData = snData.map(blade => ({
            ...blade,
            isNewlyAdded: false
          }))

          setDieCutSNList(markedData)

          // Store original list for comparison
          originalListRef.current = JSON.parse(JSON.stringify(markedData))
        } else {
          // Initialize with empty data if no data is returned
          setDieCutSNList([])
          originalListRef.current = []
        }
      }

      loadDiecutData()
    }
  }, [selectedItem])

  const handleSaveList = async () => {
    if (!isManager || !selectedItem || !hasListChanged()) return

    try {
      const requestData = {
        diecutId: selectedItem.DIECUT_ID,
        SNList: dieCutSNList.map(blade => ({
          DIECUT_SN: blade.DIECUT_SN,
          BLADE_TYPE: blade.BLADE_TYPE
        }))
      }

      const response = await fetch(`http://localhost:2525/api/diecuts/savediecut`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const result = await response.json()

      console.log('Save result:', result)

      // Optionally refresh the data after saving
      if (selectedItem) {
        const updatedData = await getDetailData(selectedItem.DIECUT_ID)

        if (updatedData && updatedData.length > 0) {
          const markedData = updatedData.map(blade => ({
            ...blade,
            isNewlyAdded: false
          }))

          setDieCutSNList(markedData)

          // Update original reference with the new saved data
          originalListRef.current = JSON.parse(JSON.stringify(markedData))
        }
      }
    } catch (error) {
      console.error('Error saving blade list:', error)
    }
  }

  // Start editing a specific blade
  const handleEditBlade = (blade: BladeItem) => {
    setEditingBladeSN(blade.DIECUT_SN)

    // Create a proper copy of the blade data with appropriate date conversions
    const bladeDataWithDates = {
      ...blade,

      // Convert string dates to Date objects if they exist
      START_TIME: blade.START_TIME ? new Date(blade.START_TIME) : null,
      END_TIME: blade.END_TIME ? new Date(blade.END_TIME) : null
    }

    // Store original data for comparison
    originalBladeDataRef.current = JSON.parse(JSON.stringify(bladeDataWithDates))
    setBladeFormData(bladeDataWithDates)
  }

  const handleSaveBlade = async () => {
    if (!bladeFormData || !hasFormChanged()) return

    try {
      const payload = {
        diecutId: bladeFormData.DIECUT_ID,
        diecutSN: bladeFormData.DIECUT_SN,
        diecutAge: bladeFormData.DIECUT_AGE,
        startTime: bladeFormData.START_TIME ? new Date(bladeFormData.START_TIME) : null,
        endTime: bladeFormData.END_TIME ? new Date(bladeFormData.END_TIME) : null,
        bladeType: bladeFormData.BLADE_TYPE,
        multiBladeReason: bladeFormData.MULTI_BLADE_REASON,
        multiBladeRemark: bladeFormData.MULTI_BLADE_REMARK,
        probDesc: bladeFormData.PROB_DESC,
        remark: bladeFormData.REMARK
      }

      console.log('Saving blade data:', payload)

      const response = await fetch('http://localhost:2525/api/diecuts/savediecutmodidetail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const updatedBlade = {
          ...bladeFormData
        }

        // Update the list with the new data
        const updatedList = dieCutSNList.map(blade => (blade.DIECUT_SN === editingBladeSN ? updatedBlade : blade))

        setDieCutSNList(updatedList)

        // Update original list reference
        originalListRef.current = JSON.parse(JSON.stringify(updatedList))

        console.log('Blade data saved successfully:', result)
      } else {
        console.error('Failed to save blade data:', result.message)
      }
    } catch (error) {
      console.error('Error saving blade data:', error)
    } finally {
      setEditingBladeSN(null)
      setBladeFormData(null)
      originalBladeDataRef.current = null
    }
  }

  // Cancel editing a specific blade
  const handleCancelBlade = () => {
    setEditingBladeSN(null)
    setBladeFormData(null)
    originalBladeDataRef.current = null
  }

  // Directly add a new blank blade item without modal
  const handleAddBlade = () => {
    if (!selectedItem) return

    // Get the highest sequence number from existing blades
    const existingSequences = dieCutSNList
      .map(blade => {
        const parts = (blade.DIECUT_SN || '').split('-')

        return parts.length > 0 ? parseInt(parts[parts.length - 1]) : 0
      })
      .filter(seq => !isNaN(seq))

    // Get next sequence number
    const nextSequence = existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1

    // Create new blade ID in format: DIECUT_ID-sequence
    const baseDiecutId = selectedItem.DIECUT_ID || ''
    const newDiecutSN = `${baseDiecutId}-${nextSequence}`

    setDieCutSNList([
      ...dieCutSNList,
      {
        DIECUT_ID: baseDiecutId,
        DIECUT_SN: newDiecutSN,
        BLADE_TYPE: '',
        DIECUT_AGE: 0,
        STATUS: 'W',
        bladeType: '',
        bladeSize: '',
        details: '',
        TL_STATUS: 'GOOD',
        PROB_DESC: '',

        // Add this flag to mark as newly added
        isNewlyAdded: true
      } as BladeItem
    ])
  }

  // Delete a blade from the list
  const handleDeleteBlade = (diecutSN: string) => {
    setDieCutSNList(dieCutSNList.filter(blade => blade.DIECUT_SN !== diecutSN))
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        gridRow: 'span 4',
        overflow: 'auto',
        backgroundColor: 'background.paper',
        transition: 'all 0.3s ease'
      }}
      className='shadow'
    >
      <Typography variant='h6' gutterBottom>
        {isEditing ? 'แก้ไขคำขอเปลี่ยนใบมีด' : selectedItem ? 'รายละเอียดคำขอ' : 'รายละเอียด'}
      </Typography>

      {selectedItem ? (
        <>
          {!isEditing && editingBladeSN === null && (
            <>
              {/* Top 30% - Request Details */}
              <Box
                sx={{
                  mb: 2,
                  pb: 2,
                  height: '30%',
                  borderBottom: '1px solid #E0E0E0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>รหัสคำขอ</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.DIECUT_ID}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>หมายเลขใบมีด</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.DIECUT_SN}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>สถานะ</Typography>
                    <Chip
                      label={selectedItem.STATUS || 'รอดำเนินการ'}
                      color={
                        selectedItem.STATUS === 'Pass'
                          ? 'success'
                          : selectedItem.STATUS === 'Pending'
                            ? 'warning'
                            : selectedItem.STATUS === 'Rejected'
                              ? 'error'
                              : 'default'
                      }
                      size='small'
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>ประเภท</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.BLADE_TYPE || 'ไม่ระบุ'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>อายุการใช้งาน</Typography>
                    <Typography variant='body2' gutterBottom>
                      {formatNumber(selectedItem.AGES) || 'ไม่ระบุ'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>ความเร่งด่วน</Typography>
                    <Chip
                      label={selectedItem.PRIORITY || 'ไม่ระบุ'}
                      color={
                        selectedItem.PRIORITY === 'High'
                          ? 'error'
                          : selectedItem.PRIORITY === 'Medium'
                            ? 'primary'
                            : 'default'
                      }
                      size='small'
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Middle 60% - Blade Card List */}
              <Box sx={{ height: '50vh', overflow: 'auto', mb: 2 }}>
                <div className='flex w-full'>
                  <Typography variant='subtitle1' gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    รายการใบมีด
                  </Typography>
                  <div className='ml-auto mr-4'>
                    <PermissionGate requiredPermission='canModify'>
                      <IconButton onClick={handleAddBlade} color='primary' size='small'>
                        <AddIcon className='cursor-pointer' />
                        <Typography>เพิ่ม</Typography>
                      </IconButton>
                    </PermissionGate>
                  </div>
                </div>

                {/* Update the JSX rendering for the blade cards to match the API data structure */}
                {dieCutSNList.length === 0 ? (
                  <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 3 }}>
                    ไม่พบรายการใบมีด กดปุ่ม + เพื่อเพิ่มรายการ
                  </Typography>
                ) : (
                  dieCutSNList.map(blade => (
                    <Paper
                      key={blade.DIECUT_SN}
                      variant='outlined'
                      sx={{
                        p: 2,
                        mb: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                          {blade.DIECUT_SN || 'ใบมีดใหม่'}
                        </Typography>
                        <PermissionGate requiredPermission='canView'>
                          <Box>
                            {blade.isNewlyAdded ? (
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => handleDeleteBlade(blade.DIECUT_SN)}
                                sx={{ mr: 1 }}
                              >
                                <DeleteIcon fontSize='small' />
                                <Typography>ลบ</Typography>
                              </IconButton>
                            ) : (
                              <Button
                                size='small'
                                variant='outlined'
                                sx={{
                                  borderColor: '#98867B',
                                  color: '#98867B',
                                  '&:hover': {
                                    borderColor: '#5A4D40',
                                    backgroundColor: 'rgba(152, 134, 123, 0.04)'
                                  }
                                }}
                                onClick={() => handleEditBlade(blade)}
                              >
                                <EditIcon />
                                <Typography>แก้ไข</Typography>
                              </Button>
                            )}
                          </Box>
                        </PermissionGate>
                      </Box>

                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant='caption' color='text.secondary'>
                            ประเภทใบมีด
                          </Typography>
                          <Typography variant='body2'>{blade.BLADE_TYPE || 'ไม่ระบุ'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant='caption' color='text.secondary'>
                            อายุ tooling
                          </Typography>
                          <Typography variant='body2'>{formatNumber(blade.DIECUT_AGE) || 'ไม่ระบุ'}</Typography>
                        </Grid>

                        {blade.PROB_DESC && (
                          <Grid item xs={12}>
                            <Typography variant='caption' color='text.secondary'>
                              รายละเอียดปัญหา
                            </Typography>
                            <Typography variant='body2'>{blade.PROB_DESC}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  ))
                )}
              </Box>

              {/* Bottom 10% - Edit Button */}
              <Box
                sx={{
                  pt: 2,
                  mt: 'auto',
                  borderTop: '1px solid #E0E0E0',
                  position: 'sticky',
                  bottom: 0,
                  backgroundColor: 'background.paper',
                  width: '100%'
                }}
              >
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleSaveList}
                  disabled={!isManager || !hasListChanged()}
                  fullWidth
                  sx={{
                    backgroundColor: '#98867B',
                    '&:hover': {
                      backgroundColor: '#5A4D40'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'action.disabledBackground',
                      opacity: 0.7
                    }
                  }}
                >
                  {isManager ? 'บันทึก' : 'บันทึก'}
                </Button>
              </Box>
            </>
          )}

          {/* Blade Editing Form */}
          {editingBladeSN !== null && bladeFormData && (
            <Box sx={{ p: 2 }}>
              <Typography variant='subtitle1' gutterBottom>
                แก้ไขใบมีด: {bladeFormData.DIECUT_SN}
              </Typography>
              <div className='flex-1 overflow-auto' style={{ height: '72vh' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>เริ่มงานวันที่</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      type='date'
                      value={
                        bladeFormData.START_TIME
                          ? typeof bladeFormData.START_TIME === 'string'
                            ? bladeFormData.START_TIME.split('T')[0]
                            : new Date(bladeFormData.START_TIME).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={handleBladeChange('START_TIME')}
                      InputLabelProps={{ shrink: true }}
                      margin='normal'
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>สิ้นสุดวันที่</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      type='date'
                      value={
                        bladeFormData.END_TIME
                          ? typeof bladeFormData.END_TIME === 'string'
                            ? bladeFormData.END_TIME.split('T')[0]
                            : new Date(bladeFormData.END_TIME).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={handleBladeChange('END_TIME')}
                      InputLabelProps={{ shrink: true }}
                      margin='normal'
                      inputProps={{
                        min: bladeFormData.START_TIME || ''
                      }}
                      error={
                        bladeFormData.END_TIME &&
                        bladeFormData.START_TIME &&
                        new Date(bladeFormData.END_TIME) < new Date(bladeFormData.START_TIME)
                      }
                      helperText={
                        bladeFormData.END_TIME &&
                        bladeFormData.START_TIME &&
                        new Date(bladeFormData.END_TIME) < new Date(bladeFormData.START_TIME)
                          ? 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น'
                          : ''
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>อายุ tooling</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      value={bladeFormData.DIECUT_AGE || ''}
                      onChange={handleBladeChange('DIECUT_AGE')}
                      margin='normal'
                      InputProps={{
                        sx: {
                          '& input': {
                            textAlign: 'right'
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>ปัญหาจาก production</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      multiline
                      rows={3}
                      value={bladeFormData.PROB_DESC || ''}
                      onChange={handleBladeChange('PROB_DESC')}
                      margin='normal'
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>รายละเอียดในการแก้ไข</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      multiline
                      rows={3}
                      value={bladeFormData.REMARK || ''}
                      onChange={handleBladeChange('REMARK')}
                      margin='normal'
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>ระยะมีด</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      value={bladeFormData.BLADE_TYPE || ''}
                      onChange={handleBladeChange('BLADE_TYPE')}
                      margin='normal'
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>สาเหตุที่ใช้มีดคู่</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      multiline
                      rows={3}
                      value={bladeFormData.MULTI_BLADE_REASON || ''}
                      onChange={handleBladeChange('MULTI_BLADE_REASON')}
                      margin='normal'
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>รายละเอียดในการใช้มีดคู่</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      multiline
                      rows={2}
                      value={bladeFormData.MULTI_BLADE_REMARK || ''}
                      onChange={handleBladeChange('MULTI_BLADE_REMARK')}
                      margin='normal'
                    />
                  </Grid>
                </Grid>
              </div>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant='outlined'
                  onClick={handleCancelBlade}
                  sx={{
                    borderColor: '#98867B',
                    color: '#98867B'
                  }}
                >
                  ยกเลิก
                </Button>
                <PermissionGate requiredPermission='canModify'>
                  <Button
                    variant='contained'
                    onClick={handleSaveBlade}
                    disabled={!hasFormChanged()}
                    sx={{
                      backgroundColor: '#98867B',
                      '&:hover': {
                        backgroundColor: '#5A4D40'
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'action.disabledBackground',
                        opacity: 0.7
                      }
                    }}
                  >
                    บันทึก
                  </Button>
                </PermissionGate>
              </Box>
            </Box>
          )}
        </>
      ) : (
        <Typography variant='body2' color='text.secondary'>
          เลือกคำขอเพื่อดูรายละเอียด
        </Typography>
      )}
    </Paper>
  )
}

export default DetailPanel
