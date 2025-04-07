'use client'

import { useState, useEffect } from 'react'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import { Box, Typography, Chip, Paper, Button, CircularProgress, TextField, Grid, IconButton } from '@mui/material'

import type { IDiecut } from '../../types/types'

// Define interface for blade item
interface BladeItem {
  DIECUT_ID: any
  DIECUT_SN: string
  DIECUT_TYPE: any
  DIECUT_AGE: number
  STATUS: string
  bladeType: string
  bladeSize: string
  details: string
  TL_STATUS: string
  PROB_DESC: string
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
}

const DetailPanel = ({
  selectedItem,
  isEditing,
  isManager,
  loading,
  handleEdit,
  handleSave,
  handleCancel,
  handleStatusChange
}: DetailPanelProps) => {
  // State for editing a specific blade
  const [editingBladeSN, setEditingBladeSN] = useState<string | null>(null)

  const [dieCutSNList, setDieCutSNList] = useState<BladeItem[]>([])

  // Initialize form data for the detail editing
  const [formData, setFormData] = useState({
    startDate: selectedItem?.START_DATE ? new Date(selectedItem.START_DATE) : null,
    endDate: selectedItem?.END_DATE ? new Date(selectedItem.END_DATE) : null,
    toolingAge: selectedItem?.TOOLING_AGE || '',
    productionIssue: selectedItem?.PRODUCTION_ISSUE || '',
    fixDetails: selectedItem?.FIX_DETAILS || '',
    bladeSize: selectedItem?.BLADE_SIZE || '',
    dualBladeReason: selectedItem?.DUAL_BLADE_REASON || '',
    dualBladeDetails: selectedItem?.DUAL_BLADE_DETAILS || ''
  })

  // State for editing a specific blade's data
  const [bladeFormData, setBladeFormData] = useState<BladeItem | null>(null)

  const handleChange = field => event => {
    const value = event.target.value

    setFormData(prev => ({
      ...prev,
      [field]: field.includes('Date') && value ? new Date(value) : value
    }))
  }

  // Handle blade field changes
  const handleBladeChange = field => event => {
    const value = event.target.value

    if (!bladeFormData) return

    setBladeFormData(prev => ({
      ...prev!,
      [field]: value
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
          diecutId: selectedItem.DIECUT_ID
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

    if (selectedItem) {
      console.log('Selected item:', selectedItem)

      // Reset form data when selected item changes
      setFormData({
        startDate: selectedItem?.START_DATE ? new Date(selectedItem.START_DATE) : null,
        endDate: selectedItem?.END_DATE ? new Date(selectedItem.END_DATE) : null,
        toolingAge: selectedItem?.TOOLING_AGE || '',
        productionIssue: selectedItem?.PRODUCTION_ISSUE || '',
        fixDetails: selectedItem?.FIX_DETAILS || '',
        bladeSize: selectedItem?.BLADE_SIZE || '',
        dualBladeReason: selectedItem?.DUAL_BLADE_REASON || '',
        dualBladeDetails: selectedItem?.DUAL_BLADE_DETAILS || ''
      })

      // Fetch diecut SN data from API
      const loadDiecutData = async () => {
        const diecutId = selectedItem.DIECUT_ID
        const snData = await getDetailData(diecutId)

        if (snData && snData.length > 0) {
          setDieCutSNList(snData)
        } else {
          // Initialize with empty data if no data is returned
          setDieCutSNList([])
        }
      }

      loadDiecutData()
    }
  }, [selectedItem])

  const handleSaveList = async () => {
    if (!isManager || !selectedItem) return

    try {
      const requestData = {
        diecutId: selectedItem.DIECUT_ID,
        SNList: dieCutSNList.map(blade => ({
          DIECUT_SN: blade.DIECUT_SN,
          DIECUT_TYPE: blade.DIECUT_TYPE
        }))
      }

      const response = await fetch(`http://localhost:2525/api/diecuts/savesn`, {
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
          setDieCutSNList(updatedData)
        }
      }
    } catch (error) {
      console.error('Error saving blade list:', error)
    }
  }

  // Start editing a specific blade
  const handleEditBlade = (blade: BladeItem) => {
    setEditingBladeSN(blade.DIECUT_SN)
    setBladeFormData({ ...blade })
  }

  // Save changes to a specific blade
  const handleSaveBlade = () => {
    if (!bladeFormData) return

    setDieCutSNList(prevList => prevList.map(blade => (blade.DIECUT_SN === editingBladeSN ? bladeFormData : blade)))

    // Clear editing state
    setEditingBladeSN(null)
    setBladeFormData(null)
  }

  // Cancel editing a specific blade
  const handleCancelBlade = () => {
    setEditingBladeSN(null)
    setBladeFormData(null)
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
        DIECUT_TYPE: '',
        DIECUT_AGE: 0,
        STATUS: 'W',
        bladeType: '',
        bladeSize: '',
        details: '',
        TL_STATUS: 'GOOD',
        PROB_DESC: ''
      }
    ])
  }

  // Delete a blade from the list
  const handleDeleteBlade = diecutSN => {
    setDieCutSNList(dieCutSNList.filter(blade => blade.DIECUT_SN !== diecutSN))
  }

  const handleDetailEditSave = async () => {
    if (!isManager) return

    try {
      // Format dates for API submission
      const payload = {
        diecutId: selectedItem.DIECUT_ID,
        startDate: formData.startDate ? formData.startDate.toISOString().split('T')[0] : null,
        endDate: formData.endDate ? formData.endDate.toISOString().split('T')[0] : null,
        toolingAge: formData.toolingAge,
        productionIssue: formData.productionIssue,
        fixDetails: formData.fixDetails,
        bladeSize: formData.bladeSize,
        dualBladeReason: formData.dualBladeReason,
        dualBladeDetails: formData.dualBladeDetails
      }

      console.log(payload)

      // Call your API here
      // const response = await apiService.updateDiecutDetails(payload);

      // Optionally: refresh data or notify success
    } catch (error) {
      console.error('Failed to save diecut details:', error)

      // Optionally: show error notification
    } finally {
      handleCancel()
    }
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
                      {selectedItem.DIECUT_TYPE || 'ไม่ระบุ'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>อายุการใช้งาน</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.AGES || 'ไม่ระบุ'}
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
                    <IconButton onClick={handleAddBlade} color='primary' size='small'>
                      <AddIcon className='cursor-pointer' />
                      <Typography>เพิ่ม</Typography>
                    </IconButton>
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
                        <Box>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDeleteBlade(blade.DIECUT_SN)}
                            sx={{ mr: 1 }}
                          >
                            <DeleteIcon fontSize='small' />
                            <Typography>ลบ</Typography>
                          </IconButton>
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
                            onClick={() => handleEditBlade(blade)} // Use the new edit blade function
                          >
                            <EditIcon />
                            <Typography>แก้ไข</Typography>
                          </Button>
                        </Box>
                      </Box>

                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant='caption' color='text.secondary'>
                            ประเภทใบมีด
                          </Typography>
                          <Typography variant='body2'>{blade.DIECUT_TYPE || 'ไม่ระบุ'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant='caption' color='text.secondary'>
                            อายุ tooling
                          </Typography>
                          <Typography variant='body2'>{blade.DIECUT_AGE || 'ไม่ระบุ'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant='caption' color='text.secondary'>
                            สถานะ
                          </Typography>
                          <Typography variant='body2'>{blade.STATUS || 'ไม่ระบุ'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant='caption' color='text.secondary'>
                            สถานะ TL
                          </Typography>
                          <Typography variant='body2'>{blade.TL_STATUS || 'ไม่ระบุ'}</Typography>
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
                  disabled={!isManager}
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
                  {isManager ? 'บันทึก' : 'บันทึก (เฉพาะผู้จัดการ)'}
                </Button>

                {!isManager && (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mt: 1, textAlign: 'center' }}
                  >
                    คุณต้องมีสิทธิ์ผู้จัดการเพื่อแก้ไขคำขอ
                  </Typography>
                )}
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
                      value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                      onChange={handleChange('startDate')}
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
                      value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                      onChange={handleChange('endDate')}
                      InputLabelProps={{ shrink: true }}
                      margin='normal'
                      inputProps={{
                        min: formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''
                      }}
                      error={formData.endDate && formData.startDate && formData.endDate < formData.startDate}
                      helperText={
                        formData.endDate && formData.startDate && formData.endDate < formData.startDate
                          ? 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น'
                          : ''
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>ประเภทใบมีด</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      value={bladeFormData.DIECUT_TYPE || ''}
                      onChange={handleBladeChange('DIECUT_TYPE')}
                      margin='normal'
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
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>ปัญหาจาก production</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      multiline
                      rows={3}
                      value={bladeFormData.PRODUCTION_ISSUE || ''}
                      onChange={handleBladeChange('PRODUCTION_ISSUE')}
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
                      value={bladeFormData.FIX_DETAILS || ''}
                      onChange={handleBladeChange('FIX_DETAILS')}
                      margin='normal'
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>ระยะมีด</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      value={bladeFormData.DIECUT_AGE || ''}
                      onChange={handleBladeChange('BLADE_SIZE')}
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
                      value={bladeFormData.PROB_DESC || ''}
                      onChange={handleBladeChange('DUAL_BLADE_REASON')}
                      margin='normal'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>รายละเอียดในการใช้มีดคู่</Typography>
                    <TextField
                      fullWidth
                      size='small'
                      value={bladeFormData.DIECUT_AGE || ''}
                      onChange={handleBladeChange('DUAL_BLADE_DETAILS')}
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
                <Button
                  variant='contained'
                  onClick={handleSaveBlade}
                  sx={{
                    backgroundColor: '#98867B',
                    '&:hover': {
                      backgroundColor: '#5A4D40'
                    }
                  }}
                >
                  บันทึก
                </Button>
              </Box>
            </Box>
          )}

          {/* {isEditing && (
            <Box sx={{ p: 2 }}>
              <Typography variant='subtitle2'>รหัสคำขอ: {selectedItem.DIECUT_ID}</Typography>
              <Typography variant='subtitle1' sx={{ mt: 1, mb: 1 }}>
                {selectedItem.DIECUT_SN}
              </Typography>

              <Typography variant='subtitle2'>เริ่มงานวันที่</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  type='date'
                  value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                  onChange={handleChange('startDate')}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Typography variant='subtitle2'>สิ้นสุดวันที่</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  type='date'
                  value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                  onChange={handleChange('endDate')}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Typography variant='subtitle2'>อายุ tooling</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField fullWidth size='small' value={formData.toolingAge} onChange={handleChange('toolingAge')} />
              </Box>

              <Typography variant='subtitle2'>ปัญหาจาก production</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  multiline
                  rows={2}
                  value={formData.productionIssue}
                  onChange={handleChange('productionIssue')}
                />
              </Box>

              <Typography variant='subtitle2'>รายละเอียดในการแก้ไข</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  multiline
                  rows={2}
                  value={formData.fixDetails}
                  onChange={handleChange('fixDetails')}
                />
              </Box>

              <Typography variant='subtitle2'>ระยะมีด</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField fullWidth size='small' value={formData.bladeSize} onChange={handleChange('bladeSize')} />
              </Box>

              <Typography variant='subtitle2'>สาเหตุที่ใช้มีดคู่</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  value={formData.dualBladeReason}
                  onChange={handleChange('dualBladeReason')}
                />
              </Box>

              <Typography variant='subtitle2'>รายละเอียดในการใช้มีดคู่</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  multiline
                  rows={2}
                  value={formData.dualBladeDetails}
                  onChange={handleChange('dualBladeDetails')}
                />
              </Box>

              <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant='outlined' color='secondary' onClick={handleCancel} disabled={loading}>
                  ยกเลิก
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleDetailEditSave}
                  disabled={loading || !isManager}
                  startIcon={loading && <CircularProgress size={20} color='inherit' />}
                  sx={{
                    backgroundColor: '#98867B',
                    '&:hover': {
                      backgroundColor: '#5A4D40'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'action.disabledBackground'
                    }
                  }}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </Box>
            </Box>
          )} */}
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
