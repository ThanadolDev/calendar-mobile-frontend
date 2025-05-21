'use client'

import React, { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box,
  Typography,
  IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { toast } from 'react-toastify'

import apiClient from '../services/apiClient'
import type { IDiecut } from '../types/types'
import { usePermission } from '../contexts/PermissionContext' // Added import for permissions

interface OrderModalProps {
  open: boolean
  onClose: () => void
  selectedItem: IDiecut | null
  onComplete?: () => void
}

const OrderModal = ({ open, onClose, selectedItem, onComplete }: OrderModalProps) => {
  const { isManager } = usePermission() // Get isManager status from permission context
  const [modifyType, setModifyType] = useState('B') // B = เปลี่ยนใบมีด, M = สร้างทดแทน, E = แก้ไข
  const [bladeChangeCount, setBladeChangeCount] = useState(0)
  const [dueDateValue, setDueDateValue] = useState<string>('')
  const [problemDesc, setProblemDesc] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Reset state when the modal opens with a new item
  useEffect(() => {
    if (open && selectedItem) {
      // Default to the appropriate modify type based on blade change count
      // Will be updated after fetching the blade change count
      setModifyType('B')
      setProblemDesc('')
      setDueDateValue('')

      // Fetch blade change count
      fetchBladeChangeCount()
    }
  }, [open, selectedItem])

  // Function to fetch blade change count
  const fetchBladeChangeCount = async () => {
    if (!selectedItem) return

    try {
      const response: any = await apiClient.post('/api/diecuts/getbladechangecount', {
        diecutId: selectedItem.DIECUT_ID,
        diecutSN: selectedItem.DIECUT_SN
      })

      if (response.success) {
        const count = response.data.bladeChangeCount || 0

        setBladeChangeCount(count)

        // Set the default modify type based on blade change count
        // Managers can select any option by default
        if (!isManager) {
          // For regular users, set default based on count
          if (count > 1) {
            setModifyType('M') // Default to "สร้างทดแทน" for count > 1
          } else {
            setModifyType('B') // Default to "เปลี่ยนใบมีด" for count 0 or 1
          }
        }
      } else {
        console.error('Failed to fetch blade change count:', response.message)
      }
    } catch (error) {
      console.error('Error fetching blade change count:', error)
    }
  }

  // Handle change type selection
  const handleModifyTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModifyType(event.target.value)
  }

  // Handle submit button click
  const handleSubmit = () => {
    // Check if description is required for repair (E) type
    if (modifyType === 'E' && !problemDesc.trim()) {
      toast.warning('กรุณาระบุปัญหาสำหรับการซ่อม')

      return
    }

    // Open confirmation dialog
    setConfirmDialog(true)
  }

  // Check if submit button should be disabled
  const isSubmitDisabled = () => {
    // Disable if modifyType is E and problemDesc is empty
    return isLoading || (modifyType === 'E' && !problemDesc.trim())
  }

  // Handle final confirmation
  const handleConfirm = async () => {
    if (!selectedItem) return

    setIsLoading(true)

    try {
      const payload = {
        diecutId: selectedItem.DIECUT_ID,
        diecutSN: selectedItem.DIECUT_SN,
        modifyType: modifyType,
        problemDesc: problemDesc,
        dueDate: dueDateValue ? new Date(dueDateValue) : null
      }

      const response: any = await apiClient.post('/api/diecuts/orderchange', payload)

      if (response.success) {
        toast.success('บันทึกข้อมูลสำเร็จ')
        setConfirmDialog(false)
        onClose()
        if (onComplete) onComplete()
      } else {
        toast.error(`เกิดข้อผิดพลาด: ${response.message}`)
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelConfirm = () => {
    setConfirmDialog(false)
  }

  // Determine which options should be disabled based on blade change count and user role
  const isBOptionDisabled = !isManager && bladeChangeCount > 1
  const isMOptionDisabled = !isManager && bladeChangeCount <= 1

  return (
    <>
      {/* Main Order Dialog */}
      <Dialog open={open && !confirmDialog} onClose={onClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6'>เปลี่ยนใบมีด/ทำงานแก้ไข Tooling</Typography>
          <IconButton
            aria-label='close'
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <TextField
              label='รหัส Tooling'
              value={selectedItem?.DIECUT_SN || ''}
              fullWidth
              disabled
              variant='outlined'
              size='small'
              sx={{ mb: 2 }}
            />

            <Typography variant='body2' sx={{ mb: 1 }}>
              เปลี่ยนใบมีดแล้ว [{bladeChangeCount}] ครั้ง
            </Typography>

            <FormControl component='fieldset' sx={{ mb: 2 }}>
              <FormLabel component='legend'>ประเภทงาน:</FormLabel>
              <RadioGroup name='modifyType' value={modifyType} onChange={handleModifyTypeChange}>
                <FormControlLabel value='B' control={<Radio />} label='เปลี่ยนใบมีด' disabled={isBOptionDisabled} />
                <FormControlLabel value='M' control={<Radio />} label='สร้างทดแทน' disabled={isMOptionDisabled} />
                <FormControlLabel value='E' control={<Radio />} label='แก้ไข' />
              </RadioGroup>
            </FormControl>

            {modifyType === 'E' && (
              <TextField
                label='ปัญหา'
                value={problemDesc}
                onChange={e => setProblemDesc(e.target.value)}
                fullWidth
                multiline
                rows={3}
                variant='outlined'
                size='small'
                required
                sx={{ mb: 4 }}
              />
            )}

            <TextField
              label='วันที่ต้องการ'
              type='date'
              value={dueDateValue}
              onChange={e => setDueDateValue(e.target.value)}
              fullWidth
              size='small'
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            mt: 4
          }}
        >
          <Button
            variant='outlined'
            onClick={onClose}
            sx={{
              borderColor: '#98867B',
              color: '#98867B',
              '&:hover': {
                borderColor: '#5A4D40',
                backgroundColor: 'rgba(152, 134, 123, 0.04)'
              }
            }}
          >
            ยกเลิก
          </Button>
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={isSubmitDisabled()}
            sx={{
              backgroundColor: isSubmitDisabled() ? '#cccccc' : '#98867B',
              '&:hover': {
                backgroundColor: isSubmitDisabled() ? '#cccccc' : '#5A4D40'
              }
            }}
          >
            ตกลง
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={handleCancelConfirm}>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: '#2196f3',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: 24
              }}
            >
              ?
            </Box>
            <Typography>ต้องการดำเนินการต่อสำหรับรายการนี้ เปลี่ยนใบมีด/ทำงานแก้ไข Tooling นี้หรือไม่</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirm} disabled={isLoading} sx={{ color: 'text.secondary' }}>
            ยกเลิก
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} variant='contained' color='primary'>
            ตกลง
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default OrderModal
