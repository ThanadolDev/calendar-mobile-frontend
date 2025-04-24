'use client'

import { useState, useEffect, useRef } from 'react'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ConstructionIcon from '@mui/icons-material/Construction'
import {
  Box,
  Typography,
  Chip,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material'

import { isEqual } from 'lodash'

import apiClient from '../../services/apiClient'
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
  JOB_ORDER?: string
  PRODUCT_CODE?: string
  PRODUCT_NAME?: string
  PCS_PER_SHEET?: number
  REQUIRED_DATE?: Date | null
  MODIFY_TYPE?: string
  MODIFY_TYPE_ORIGINAL?: string
  MODIFY_TYPE_APPV_FLAG?: string | null
  MODIFY_TYPE_APPV_BY?: string
  MODIFY_TYPE_APPV_BY_NAME?: string
  MODIFY_TYPE_APPV_DATE?: Date
}

interface DetailPanelProps {
  selectedItem: IDiecut | null
  isEditing: boolean
  isManager: boolean
  loading: boolean
  detailLoading?: boolean
  handleEdit: () => void
  handleSave: () => void
  handleCancel: () => void
  handleStatusChange: (status: 'Pending' | 'Pass' | 'Rejected') => void
  canEdit: boolean
  onProcessComplete?: () => void
  onClose?: () => void
}

const DetailPanel = ({
  selectedItem,
  isEditing,
  loading,
  detailLoading,
  handleEdit,
  handleSave,
  handleCancel,
  handleStatusChange,
  onProcessComplete,
  onClose
}: DetailPanelProps) => {
  const { isManager, canModify, canApprove, canRecordDetails } = usePermission()
  const canEdit = canModify || canRecordDetails

  // State for editing a specific blade
  const [editingBladeSN, setEditingBladeSN] = useState<string | null>(null)
  const [dieCutSNList, setDieCutSNList] = useState<BladeItem[]>([])
  const [bladeFormData, setBladeFormData] = useState<BladeItem | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showTypeChangeDialog, setShowTypeChangeDialog] = useState(false)
  const [showTypeApprovalDialog, setShowTypeApprovalDialog] = useState(false)
  const [allowedChangeTypes, setAllowedChangeTypes] = useState<string[]>([])

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
      const {
        DIECUT_AGE,
        BLADE_TYPE,
        PROB_DESC,
        REMARK,
        MULTI_BLADE_REASON,
        MULTI_BLADE_REMARK,
        JOB_ORDER,
        PRODUCT_CODE,
        PRODUCT_NAME,
        PCS_PER_SHEET,
        REQUIRED_DATE
      } = data

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
        JOB_ORDER: JOB_ORDER ?? '',
        PRODUCT_CODE: PRODUCT_CODE ?? '',
        PRODUCT_NAME: PRODUCT_NAME ?? '',
        PCS_PER_SHEET: PCS_PER_SHEET ?? '',
        REQUIRED_DATE: formatDate(REQUIRED_DATE),
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

    // Special handling for datetime-local inputs
    if (field === 'START_TIME' || field === 'END_TIME') {
      // Ensure we're creating valid date objects
      const dateValue = value ? new Date(value) : null

      // Validate date before setting
      const isValidDate = dateValue && !isNaN(dateValue.getTime())

      setBladeFormData(prev => ({
        ...prev!,
        [field]: isValidDate ? dateValue : null
      }))
    } else {
      setBladeFormData(prev => ({
        ...prev!,
        [field]: field.includes('Date') && value ? new Date(value) : value
      }))
    }
  }

  async function getDetailData(diecutId: any) {
    try {
      const data = await apiClient.post('/api/diecuts/getdiecutsndetail', {
        diecutId: selectedItem?.DIECUT_ID,
        diecutSN: selectedItem?.DIECUT_SN
      })

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

  // Load allowed change types
  // useEffect(() => {
  //   const loadAllowedChangeTypes = async () => {
  //     try {
  //       const result = await apiClient.get('/api/profile/getsetting?key=DIECUT_CHG_MOD_TYPE_LIST')

  //       if (result.success && result.data.value) {
  //         // Parse the comma-separated list into an array
  //         setAllowedChangeTypes(result.data.value.split(',').map((type: string) => type.trim()))
  //       }
  //     } catch (error) {
  //       console.error('Error loading allowed change types:', error)
  //     }
  //   }

  //   loadAllowedChangeTypes()
  // }, [])

  // The useEffect hook to load data when a die cut is selected

  useEffect(() => {
    // Clear editing state when selected item changes
    setEditingBladeSN(null)
    setBladeFormData(null)
    originalBladeDataRef.current = null

    if (selectedItem) {
      console.log('Selected item:', selectedItem)

      // Check if this is a newly created item
      if (isNewlyCreatedItem(selectedItem)) {
        // For new items, we initialize with a single blank blade
        console.log('pass')

        const newBlade: BladeItem = {
          DIECUT_ID: selectedItem.DIECUT_ID,
          DIECUT_SN: selectedItem.DIECUT_SN,
          BLADE_TYPE: '',
          DIECUT_AGE: 0,
          STATUS: 'N',
          bladeType: '',
          bladeSize: '',
          details: '',
          TL_STATUS: 'GOOD',
          PROB_DESC: '',
          START_TIME: new Date(),
          END_TIME: null,
          PRODUCTION_ISSUE: '',
          TOOLING_AGE: 0,
          FIX_DETAILS: '',
          BLADE_SIZE: '',
          MULTI_BLADE_REASON: '',
          MULTI_BLADE_REMARK: '',
          isNewlyAdded: true,
          REMARK: '',
          MODIFY_TYPE: 'N'
        }

        console.log('pass1')

        setDieCutSNList([newBlade])
        originalListRef.current = [newBlade]

        // Automatically start editing the new blade
        handleEditBlade(newBlade)

        return // Skip the regular data fetching for new items
      }

      // Fetch diecut SN data from API for existing items
      const loadDiecutData = async () => {
        const diecutId = selectedItem.DIECUT_ID
        const snData = await getDetailData(diecutId)

        console.log(snData)

        if (snData && snData.length > 0) {
          // Mark all blades from API as not newly added
          // const markedData = snData.map(blade => ({
          //   ...blade,
          //   isNewlyAdded: false
          // }))

          // setDieCutSNList(markedData)

          // // Store original list for comparison
          // originalListRef.current = JSON.parse(JSON.stringify(markedData))
          handleEditBlade(snData[0])
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
        diecut_TYPE: selectedItem.DIECUT_TYPE,
        SNList: dieCutSNList.map(blade => ({
          DIECUT_SN: blade.DIECUT_SN,
          BLADE_TYPE: blade.BLADE_TYPE,
          MODIFY_TYPE: blade.MODIFY_TYPE
        }))
      }

      const result = await apiClient.post('/api/diecuts/savediecut', requestData)

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
    console.log(blade)
    setEditingBladeSN(blade.DIECUT_SN)

    // Create a proper copy of the blade data with appropriate date conversions
    const bladeDataWithDates = {
      ...blade,

      // Convert string dates to Date objects if they exist
      START_TIME: blade.START_TIME ? new Date(blade.START_TIME) : new Date(),
      END_TIME: blade.END_TIME ? new Date(blade.END_TIME) : null,
      REQUIRED_DATE: blade.REQUIRED_DATE ? new Date(blade.REQUIRED_DATE) : null
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
        remark: bladeFormData.REMARK,
        jobOrder: bladeFormData.JOB_ORDER,
        productCode: bladeFormData.PRODUCT_CODE,
        productName: bladeFormData.PRODUCT_NAME,
        pcsPerSheet: bladeFormData.PCS_PER_SHEET,
        requiredDate: bladeFormData.REQUIRED_DATE
      }

      console.log('Saving blade data:', payload)

      const result = await apiClient.post('/api/diecuts/savediecutmodidetail', payload)

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
      onClose()
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
        STATUS: 'N',
        bladeType: '',
        bladeSize: '',
        details: '',
        TL_STATUS: 'GOOD',
        PROB_DESC: '',
        START_TIME: new Date(),
        MODIFY_TYPE: 'N',

        // Add this flag to mark as newly added
        isNewlyAdded: true
      } as BladeItem
    ])
  }

  // Delete a blade from the list
  const handleDeleteBlade = (diecutSN: string) => {
    setDieCutSNList(dieCutSNList.filter(blade => blade.DIECUT_SN !== diecutSN))
  }

  // Auto date calculation
  const handleAutoDate = async () => {
    if (!bladeFormData || !bladeFormData.JOB_ORDER) {
      console.warn('ต้องระบุ JOB Order ก่อนคำนวณวันที่อัตโนมัติ')

      return
    }

    try {
      // Call API to get suggested date based on JOB Order
      const result = await apiClient.post('/api/diecuts/getautodate', {
        jobOrder: bladeFormData.JOB_ORDER
      })

      if (result.success && result.data.suggestedDate) {
        setBladeFormData(prev => ({
          ...prev!,
          REQUIRED_DATE: new Date(result.data.suggestedDate)
        }))
      } else {
        console.info('ไม่สามารถคำนวณวันที่อัตโนมัติได้ กรุณาระบุวันที่ด้วยตนเอง')
      }
    } catch (error) {
      console.error('Error calculating auto date:', error)
    }
  }

  // Handle status change with approval
  const handleStatusChangeWithApproval = async (newStatus: string) => {
    if (!bladeFormData) return

    // Check if we're changing from B to M which requires approval
    if (bladeFormData.STATUS === 'B' && newStatus === 'M') {
      // Create a state for the approval dialog
      setShowApprovalDialog(true)
    } else {
      // For other status changes, just update directly
      updateBladeStatus(newStatus)
    }
  }

  // Update blade status
  const updateBladeStatus = async (newStatus: string) => {
    if (!bladeFormData) return

    try {
      const payload = {
        diecutId: bladeFormData.DIECUT_ID,
        diecutSN: bladeFormData.DIECUT_SN,
        status: newStatus
      }

      const result = await apiClient.post('/api/diecuts/updatestatus', payload)

      if (result.success) {
        // Update local state
        setBladeFormData(prev => ({
          ...prev!,
          STATUS: newStatus
        }))

        // If changing to status T, update parent component
        if (newStatus === 'T') {
          // Notify parent component that processing is complete
          onProcessComplete && onProcessComplete()
        }
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Dialog for status change approval
  const ApprovalDialog = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleApproval = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await apiClient.post('/api/auth/verifyapprover', {
          username,
          password
        })

        if (result.success) {
          setShowApprovalDialog(false)

          // Proceed with status change
          updateBladeStatus('M')
        } else {
          setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือคุณไม่มีสิทธิ์อนุมัติ')
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง')
      } finally {
        setLoading(false)
      }
    }

    return (
      <Dialog open={showApprovalDialog} onClose={() => setShowApprovalDialog(false)}>
        <DialogTitle>การอนุมัติเปลี่ยนสถานะ</DialogTitle>
        <DialogContent>
          <DialogContentText>
            กรุณาใส่ชื่อผู้ใช้และรหัสผ่านของผู้มีสิทธิ์อนุมัติเพื่อเปลี่ยนสถานะจาก B (เปลี่ยนใบมีด) เป็น M (สร้างทดแทน)
          </DialogContentText>
          <TextField
            autoFocus
            margin='dense'
            label='ชื่อผู้ใช้'
            type='text'
            fullWidth
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <TextField
            margin='dense'
            label='รหัสผ่าน'
            type='password'
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApprovalDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleApproval} disabled={loading || !username || !password}>
            {loading ? <CircularProgress size={24} /> : 'ยืนยัน'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const isNewlyCreatedItem = (item: IDiecut | null) => {
    console.log(item)
    if (!item?.NEW_ADD) return false

    return item
  }

  // Dialog for work type change
  const TypeChangeDialog = () => {
    const [newType, setNewType] = useState('')
    const [loading, setLoading] = useState(false)

    const handleTypeChange = async () => {
      // if (!bladeFormData || !newType) return

      setLoading(true)

      try {
        const payload = {
          diecutId: bladeFormData.DIECUT_ID,
          diecutSN: bladeFormData.DIECUT_SN,
          modifyTypeAppvFlag: 'P'
        }

        const result = await apiClient.post('/api/diecuts/changetyperequest', payload)

        if (result.success) {
          // Update local state
          setBladeFormData(prev => ({
            ...prev!,
            MODIFY_TYPE_APPV_FLAG: 'P'
          }))

          // Close dialog
          setShowTypeChangeDialog(false)

          // Open approval dialog immediately
          setShowTypeApprovalDialog(true)
        } else {
          console.error('Failed to request type change:', result.message)
        }
      } catch (error) {
        console.error('Error requesting type change:', error)
      } finally {
        setLoading(false)
      }
    }

    return (
      <Dialog open={showTypeChangeDialog} onClose={() => setShowTypeChangeDialog(false)}>
        <DialogTitle>เปลี่ยนประเภทงาน</DialogTitle>
        <DialogContent>
          <DialogContentText>
            เลือกประเภทงานใหม่ โดยการเปลี่ยนประเภทงานจะต้องได้รับการอนุมัติจากหัวหน้า
          </DialogContentText>
          <FormControl fullWidth margin='dense'>
            {/* <InputLabel>ประเภทงานใหม่</InputLabel> */}
            {/* <Select value={newType} onChange={e => setNewType(e.target.value)} label='ประเภทงานใหม่'>
              {allowedChangeTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select> */}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTypeChangeDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleTypeChange}>{loading ? <CircularProgress size={24} /> : 'ยืนยัน'}</Button>
        </DialogActions>
      </Dialog>
    )
  }

  // Dialog for work type change approval
  const TypeApprovalDialog = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [loadingStep, setLoadingStep] = useState(0) // 0=not started, 1=checking auth, 2=saving, 3=complete

    const handleApprove = async () => {
      if (!bladeFormData) return

      setLoading(true)
      setError('')
      setLoadingStep(1) // Start with auth check

      try {
        // First verify the supervisor credentials
        const authResult = await apiClient.post('/api/diecuts/verifyapprover', {
          username,
          password,
          requiredPositionId: 'DIECUT_CHG_MOD_TYPE_APPV_POS'
        })

        if (authResult.success) {
          setLoadingStep(2) // Move to saving step

          // If authentication is successful, approve the change
          const approvalResult = await apiClient.post('/api/diecuts/approvetypechange', {
            diecutId: bladeFormData.DIECUT_ID,
            diecutSN: bladeFormData.DIECUT_SN,
            modifyType: 'M',
            approverId: authResult.data.employeeId,
            approverName: authResult.data.employeeName
          })

          if (approvalResult.success) {
            setLoadingStep(3) // Complete

            // Short delay to show completion state
            setTimeout(() => {
              // Update local state
              setBladeFormData(prev => ({
                ...prev!,
                MODIFY_TYPE_APPV_FLAG: 'A',
                MODIFY_TYPE: 'M'
              }))

              // Close dialog
              setShowTypeApprovalDialog(false)
            }, 1000)
          } else {
            setError('ไม่สามารถบันทึกการอนุมัติได้: ' + approvalResult.message)
            setLoadingStep(0)
          }
        } else {
          setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือคุณไม่มีตำแหน่งงานที่สามารถอนุมัติได้')
          setLoadingStep(0)
        }
      } catch (error) {
        console.error('Error approving type change:', error)
        setError('เกิดข้อผิดพลาดในการอนุมัติ กรุณาลองใหม่อีกครั้ง')
        setLoadingStep(0)
      } finally {
        if (loadingStep !== 3) {
          setLoading(false)
        }
      }
    }

    const handleCancel = async () => {
      if (!bladeFormData) return

      setLoading(true)
      setLoadingStep(1)

      try {
        const result = await apiClient.post('/api/diecuts/canceltypechange', {
          diecutId: bladeFormData.DIECUT_ID,
          diecutSN: bladeFormData.DIECUT_SN
        })

        if (result.success) {
          setLoadingStep(3)

          // Short delay to show completion state
          setTimeout(() => {
            // Update local state - revert to original type and clear approval flag
            setBladeFormData(prev => ({
              ...prev!,
              MODIFY_TYPE: result.data.originalType || prev!.MODIFY_TYPE,
              MODIFY_TYPE_APPV_FLAG: null
            }))

            // Close dialog
            setShowTypeApprovalDialog(false)
          }, 1000)
        } else {
          setError('ไม่สามารถยกเลิกการเปลี่ยนประเภทงานได้: ' + result.message)
          setLoadingStep(0)
        }
      } catch (error) {
        console.error('Error canceling type change:', error)
        setError('เกิดข้อผิดพลาดในการยกเลิก กรุณาลองใหม่อีกครั้ง')
        setLoadingStep(0)
      } finally {
        if (loadingStep !== 3) {
          setLoading(false)
        }
      }
    }

    return (
      <Dialog open={showTypeApprovalDialog} onClose={() => !loading && setShowTypeApprovalDialog(false)}>
        <DialogTitle>อนุมัติการเปลี่ยนประเภทงาน</DialogTitle>
        <DialogContent>
          {loadingStep === 0 ? (
            <>
              <DialogContentText>
                กรุณาใส่ชื่อผู้ใช้และรหัสผ่านของหัวหน้าที่มีสิทธิ์อนุมัติการเปลี่ยนประเภทงานจาก
                {bladeFormData?.MODIFY_TYPE_ORIGINAL || '-'} เป็น {bladeFormData?.MODIFY_TYPE || '-'}
              </DialogContentText>
              <TextField
                autoFocus
                margin='dense'
                label='ชื่อผู้ใช้'
                type='text'
                fullWidth
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <TextField
                margin='dense'
                label='รหัสผ่าน'
                type='password'
                fullWidth
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {error && (
                <Alert severity='error' sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress size={60} />
                  {loadingStep === 3 && (
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant='caption' component='div' color='text.secondary'>
                        ✓
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography variant='h6'>
                  {loadingStep === 1 && 'กำลังตรวจสอบสิทธิ์...'}
                  {loadingStep === 2 && 'กำลังบันทึกข้อมูล...'}
                  {loadingStep === 3 && 'ดำเนินการเสร็จสิ้น'}
                </Typography>
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: loadingStep >= 1 ? 'success.main' : '#eee',
                        mr: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      {loadingStep > 1 ? '✓' : '1'}
                    </Box>
                    <Typography variant='body2' color={loadingStep >= 1 ? 'text.primary' : 'text.disabled'}>
                      ตรวจสอบสิทธิ์การอนุมัติ
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: loadingStep >= 2 ? 'success.main' : '#eee',
                        mr: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      {loadingStep > 2 ? '✓' : '2'}
                    </Box>
                    <Typography variant='body2' color={loadingStep >= 2 ? 'text.primary' : 'text.disabled'}>
                      บันทึกการเปลี่ยนประเภทงาน
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: loadingStep >= 3 ? 'success.main' : '#eee',
                        mr: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      {loadingStep > 3 ? '✓' : '3'}
                    </Box>
                    <Typography variant='body2' color={loadingStep >= 3 ? 'text.primary' : 'text.disabled'}>
                      ดำเนินการเสร็จสมบูรณ์
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {loadingStep === 0 && (
            <>
              <Button onClick={handleCancel} color='error' disabled={loading}>
                ยกเลิกการเปลี่ยน
              </Button>
              <Button onClick={handleApprove} disabled={loading || !username || !password}>
                อนุมัติ
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    )
  }

  // Function to get status text display
  const getStatusText = (status: string | null | undefined) => {
    if (!status) return 'ไม่ระบุ'

    switch (status) {
      case 'N':
        return 'สั่งทำใหม่'
      case 'B':
        return 'เปลี่ยนใบมีด'
      case 'M':
        return 'สร้างทดแทน'
      case 'E':
        return 'ซ่อม'
      case 'T':
        return 'พร้อมใช้งาน'
      case 'F':
        return 'ยกเลิก'
      default:
        return status
    }
  }

  // Function to determine if status can be processed
  const isActiveForProcess = (status: string | null | undefined) => {
    if (!status) return false

    return ['N', 'B', 'M', 'E'].includes(status)
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
        {selectedItem ? ' (' + selectedItem?.DIECUT_SN + ') ' : ''}
      </Typography>

      {selectedItem ? (
        detailLoading ? (
          <Box sx={{ mb: 2, pb: 2, height: '30%', borderBottom: '1px solid #E0E0E0' }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant='subtitle2'>รหัสคำขอ</Typography>
                <Box sx={{ width: '70%', height: 20, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Grid>

              <Grid item xs={6}>
                <Typography variant='subtitle2'>สถานะ</Typography>
                <Box sx={{ width: '50%', height: 24, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant='subtitle2'>ประเภท</Typography>
                <Box sx={{ width: '60%', height: 20, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant='subtitle2'>อายุการใช้งาน</Typography>
                <Box sx={{ width: '40%', height: 20, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant='subtitle2'>ความเร่งด่วน</Typography>
                <Box sx={{ width: '50%', height: 24, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Grid>
            </Grid>
          </Box>
        ) : (
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
                      <Typography variant='subtitle2'>สถานะ</Typography>
                      <Chip
                        label={selectedItem.STATUS ? getStatusText(selectedItem.STATUS) : 'รอดำเนินการ'}
                        color={
                          selectedItem.STATUS === 'T'
                            ? 'success'
                            : selectedItem.STATUS === 'N' ||
                                selectedItem.STATUS === 'B' ||
                                selectedItem.STATUS === 'M' ||
                                selectedItem.STATUS === 'E'
                              ? 'warning'
                              : selectedItem.STATUS === 'F'
                                ? 'error'
                                : 'default'
                        }
                        size='small'
                        sx={{ mb: 1 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='subtitle2'>กว้าง (มม.)</Typography>
                      <Typography variant='body2' gutterBottom>
                        {selectedItem.BLANK_SIZE_X || 'ไม่ระบุ'}
                      </Typography>
                      <Typography variant='subtitle2'>ยาว (มม.)</Typography>
                      <Typography variant='body2' gutterBottom>
                        {selectedItem.BLANK_SIZE_Y || 'ไม่ระบุ'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='subtitle2'>อายุการใช้งาน</Typography>
                      <Typography variant='body2' gutterBottom>
                        {formatNumber(selectedItem.AGES) || 'ไม่ระบุ'}
                      </Typography>
                    </Grid>
                    {/* <Grid item xs={6}>
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
                    </Grid> */}
                  </Grid>
                </Box>

                {/* Middle 60% - Blade Card List */}
                <Box sx={{ height: '50vh', overflow: 'auto', mb: 2 }}>
                  <div className='flex w-full'>
                    <Typography variant='subtitle1' gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                      รหัส Tooling
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

                                  // disabled={!isActiveForProcess(blade.STATUS)}
                                >
                                  <ConstructionIcon />
                                  <Typography>Process</Typography>
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
                          <Grid item xs={6}>
                            <Typography variant='caption' color='text.secondary'>
                              สถานะ
                            </Typography>
                            <Typography variant='body2'>
                              <Chip
                                label={getStatusText(blade.MODIFY_TYPE)}
                                size='small'
                                color={
                                  blade.MODIFY_TYPE === 'T'
                                    ? 'success'
                                    : blade.MODIFY_TYPE === 'N' ||
                                        blade.MODIFY_TYPE === 'B' ||
                                        blade.MODIFY_TYPE === 'M' ||
                                        blade.MODIFY_TYPE === 'E'
                                      ? 'warning'
                                      : blade.MODIFY_TYPE === 'F'
                                        ? 'error'
                                        : 'default'
                                }
                              />
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='caption' color='text.secondary'>
                              JOB Order
                            </Typography>
                            <Typography variant='body2'>{blade.JOB_ORDER || 'ไม่ระบุ'}</Typography>
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
                {/* <Typography variant='subtitle1' gutterBottom>
                  Process ใบมีด: {bladeFormData.DIECUT_SN}
                </Typography> */}

                {/* Work Type Change Buttons */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,

                    mb: 2,

                    // p: 2,
                    borderRadius: 1
                  }}
                >
                  <Box>
                    <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                      ประเภทงาน:
                    </Typography>
                    <Typography variant='body2' sx={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Chip
                        label={getStatusText(bladeFormData?.MODIFY_TYPE) || 'ไม่ระบุ'}
                        size='small'
                        sx={{ mr: 1, bgcolor: bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'P' ? '#fff3cd' : 'white' }}
                      />
                    </Typography>
                  </Box>

                  <Box sx={{ ml: 'auto' }}>
                    <Button
                      variant='outlined'
                      size='small'
                      // disabled={!allowedChangeTypes.includes(bladeFormData?.MODIFY_TYPE || '')}
                      onClick={() =>
                        bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'P' || bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'N'
                          ? setShowTypeApprovalDialog(true)
                          : setShowTypeChangeDialog(true)
                      }
                      sx={{
                        borderColor: '#98867B',
                        color: '#98867B',
                        '&:hover': {
                          borderColor: '#5A4D40',
                          backgroundColor: 'rgba(152, 134, 123, 0.04)'
                        }
                      }}
                    >
                      {bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'P' ? 'อนุมัติ' : 'เปลี่ยน'}
                    </Button>
                  </Box>
                </Box>

                <div className='flex-1 overflow-auto' style={{ height: '67vh' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant='subtitle2'>เริ่มงานวันที่</Typography>
                      <TextField
                        fullWidth
                        size='small'
                        type='datetime-local'
                        value={(() => {
                          // Check if START_TIME exists
                          if (!bladeFormData.START_TIME) {
                            return new Date().toISOString().substring(0, 16) // Default to current date and time
                          }

                          // Convert to Date object if it's a string
                          const startTimeDate =
                            typeof bladeFormData.START_TIME === 'string'
                              ? new Date(bladeFormData.START_TIME)
                              : new Date(bladeFormData.START_TIME)

                          // Check if the date is valid
                          if (isNaN(startTimeDate.getTime())) {
                            return new Date().toISOString().substring(0, 16) // Invalid date, use current date
                          }

                          // Check if date is more than 50 years ago
                          const fiftyYearsAgo = new Date()

                          fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50)

                          if (startTimeDate < fiftyYearsAgo) {
                            // If date is more than 50 years ago, use current date instead
                            return new Date().toISOString().substring(0, 16)
                          }

                          // Format date to YYYY-MM-DDTHH:MM
                          return startTimeDate.toISOString().substring(0, 16)
                        })()}
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
                        type='datetime-local'
                        value={(() => {
                          if (!bladeFormData.END_TIME) return ''

                          try {
                            const endDate =
                              typeof bladeFormData.END_TIME === 'string'
                                ? new Date(bladeFormData.END_TIME)
                                : bladeFormData.END_TIME

                            // Check if date is valid
                            if (isNaN(endDate.getTime())) return ''

                            return endDate.toISOString().substring(0, 16)
                          } catch (e) {
                            console.error('Error formatting END_TIME:', e)

                            return ''
                          }
                        })()}
                        onChange={handleBladeChange('END_TIME')}
                        InputLabelProps={{ shrink: true }}
                        margin='normal'
                        inputProps={{
                          min: (() => {
                            if (!bladeFormData.START_TIME) return ''

                            try {
                              const startDate =
                                typeof bladeFormData.START_TIME === 'string'
                                  ? new Date(bladeFormData.START_TIME)
                                  : bladeFormData.START_TIME

                              // Check if date is valid
                              if (isNaN(startDate.getTime())) return ''

                              return startDate.toISOString().substring(0, 16)
                            } catch (e) {
                              console.error('Error formatting START_TIME minimum:', e)

                              return ''
                            }
                          })()
                        }}
                        error={(() => {
                          if (!bladeFormData.END_TIME || !bladeFormData.START_TIME) return false

                          try {
                            const endDate =
                              typeof bladeFormData.END_TIME === 'string'
                                ? new Date(bladeFormData.END_TIME)
                                : bladeFormData.END_TIME

                            const startDate =
                              typeof bladeFormData.START_TIME === 'string'
                                ? new Date(bladeFormData.START_TIME)
                                : bladeFormData.START_TIME

                            // Check if both dates are valid
                            if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) return false

                            // Return true if end date is before start date
                            return endDate < startDate
                          } catch (e) {
                            console.error('Error comparing dates:', e)

                            return false
                          }
                        })()}
                        helperText={(() => {
                          if (!bladeFormData.END_TIME || !bladeFormData.START_TIME) return ''

                          try {
                            const endDate =
                              typeof bladeFormData.END_TIME === 'string'
                                ? new Date(bladeFormData.END_TIME)
                                : bladeFormData.END_TIME

                            const startDate =
                              typeof bladeFormData.START_TIME === 'string'
                                ? new Date(bladeFormData.START_TIME)
                                : bladeFormData.START_TIME

                            // Check if both dates are valid
                            if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) return ''

                            // Show error message if end date is before start date
                            return endDate < startDate ? 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น' : ''
                          } catch (e) {
                            console.error('Error generating error message:', e)

                            return ''
                          }
                        })()}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant='subtitle2'>วันที่ต้องการ</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          type='date'
                          value={
                            bladeFormData.REQUIRED_DATE
                              ? typeof bladeFormData.REQUIRED_DATE === 'string'
                                ? bladeFormData.REQUIRED_DATE.split('T')[0]
                                : new Date(bladeFormData.REQUIRED_DATE).toISOString().split('T')[0]
                              : ''
                          }
                          onChange={handleBladeChange('REQUIRED_DATE')}
                          InputLabelProps={{ shrink: true }}
                          margin='normal'
                        />
                        <Button
                          variant='outlined'
                          size='small'
                          onClick={handleAutoDate}
                          sx={{
                            borderColor: '#98867B',
                            color: '#98867B'
                          }}
                        >
                          Auto
                        </Button>
                      </Box>
                    </Grid>

                    {/* <Grid item xs={6}>
                      <Typography variant='subtitle2'>JOB Order</Typography>
                      <TextField
                        fullWidth
                        size='small'
                        value={bladeFormData.JOB_ORDER || ''}
                        onChange={handleBladeChange('JOB_ORDER')}
                        margin='normal'
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant='subtitle2'>รหัสสินค้า</Typography>
                      <TextField
                        fullWidth
                        size='small'
                        value={bladeFormData.PRODUCT_CODE || ''}
                        onChange={handleBladeChange('PRODUCT_CODE')}
                        margin='normal'
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant='subtitle2'>ชื่องาน</Typography>
                      <TextField
                        fullWidth
                        size='small'
                        value={bladeFormData.PRODUCT_NAME || ''}
                        onChange={handleBladeChange('PRODUCT_NAME')}
                        margin='normal'
                      />
                    </Grid> */}
                    {/*
                    <Grid item xs={6}>
                      <Typography variant='subtitle2'>ตัว/แผ่น</Typography>
                      <TextField
                        fullWidth
                        size='small'
                        type='number'
                        value={bladeFormData.PCS_PER_SHEET || ''}
                        onChange={handleBladeChange('PCS_PER_SHEET')}
                        margin='normal'
                        InputProps={{
                          sx: {
                            '& input': {
                              textAlign: 'right'
                            }
                          }
                        }}
                      />
                    </Grid> */}

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
                        disabled
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
                        disabled
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
                        disabled
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
                        disabled
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
                    onClick={onClose}
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
                <Typography sx={{ color: 'red', mt: 4 }}>
                  หมายเหตุ อายุ Tooling สามารถคีย์ได้ เมื่อระบุ สิ้นสุดวันที่ สร้างใหม่/สร้างทดแทน
                </Typography>
              </Box>
            )}

            {/* Render the dialogs */}
            {showApprovalDialog && <ApprovalDialog />}
            {showTypeChangeDialog && <TypeChangeDialog />}
            {showTypeApprovalDialog && <TypeApprovalDialog />}
          </>
        )
      ) : (
        <Typography variant='body2' color='text.secondary'>
          เลือกคำขอเพื่อดูรายละเอียด
        </Typography>
      )}
    </Paper>
  )
}

export default DetailPanel
