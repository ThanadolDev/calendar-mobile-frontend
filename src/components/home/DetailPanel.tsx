/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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
  Alert,
  FormHelperText
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
  END_TIME: Date | null
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
  MODIFY_TYPE_REQ_TO?: string
  DIECUT_TYPE?: string
  NEW_ADD?: boolean
  CHANGE_REASON?: string // Added field for change reason
  CR_DATE?: string | Date
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
  data?: IDiecut[]
}

// Define the available modify types
const MODIFY_TYPES = [
  { value: 'N', label: 'สร้างใหม่' },
  { value: 'B', label: 'เปลี่ยนใบมีด' },
  { value: 'M', label: 'สร้างทดแทน' },
  { value: 'E', label: 'แก้ไข' }
]

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
  onClose,
  data = []
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
  const [showCancelOrderDialog, setShowCancelOrderDialog] = useState(false)
  const [showBatchSaveDialog, setShowBatchSaveDialog] = useState(false)
  const [relatedSNs, setRelatedSNs] = useState<BladeItem[]>([])
  const [relatedNewSNs, setRelatedNewSNs] = useState<BladeItem[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [newModifyType, setNewModifyType] = useState<string>('')
  const batchSaveInProgressRef = useRef(false)

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
        REQUIRED_DATE,
        CHANGE_REASON
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
        END_TIME: formatDate(data.END_TIME),
        CHANGE_REASON: CHANGE_REASON ?? ''
      }
    }

    const originalForComparison = getComparisonObject(originalBladeDataRef.current)
    const currentForComparison = getComparisonObject(bladeFormData)

    // Use deep comparison to check if data has changed
    return !isEqual(originalForComparison, currentForComparison)
  }

  const getRelatedNewSNs = useCallback(
    (diecutId: string, currentSN: string) => {
      // Only get newly created SNs from local state
      const localNewSNs = data.filter(
        item =>
          item.DIECUT_ID === diecutId &&
          item.DIECUT_SN !== currentSN &&
          (item.NEW_ADD === true || item.isNewlyAdded === true)
      )

      return localNewSNs
    },
    [data]
  )

  // Function to format date as DD/MM/YYYY
  const formatDateDisplay = (date: Date | string | null): string => {
    if (!date) return '-'

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date

      if (isNaN(dateObj.getTime())) return '-'

      return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`
    } catch (error) {
      console.error('Error formatting date:', error)

      return '-'
    }
  }

  // Validate the form before saving
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const now = new Date()

    // Check if start date is in the future
    if (bladeFormData?.START_TIME && new Date(bladeFormData.START_TIME) > now) {
      errors.START_TIME = 'วันที่เริ่มงานต้องไม่มากกว่าวันที่ปัจจุบัน'
    }

    // Check if end date is in the future
    if (bladeFormData?.END_TIME && new Date(bladeFormData.END_TIME) > now) {
      errors.END_TIME = 'วันที่สิ้นสุดต้องไม่มากกว่าวันที่ปัจจุบัน'
    }

    // Check if start date is after end date
    if (
      bladeFormData?.START_TIME &&
      bladeFormData?.END_TIME &&
      new Date(bladeFormData.START_TIME) > new Date(bladeFormData.END_TIME)
    ) {
      errors.END_TIME = 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น'
    }

    // Check tooling age range when end date is set
    if (bladeFormData?.END_TIME) {
      if (
        typeof bladeFormData.DIECUT_AGE !== 'number' ||
        bladeFormData.DIECUT_AGE < 1 ||
        bladeFormData.DIECUT_AGE > 250000
      ) {
        errors.DIECUT_AGE = 'อายุ tooling ต้องอยู่ระหว่าง 1 ถึง 250,000'
      }
    } else {
      // When no end date, just check that age isn't negative or too large
      if (
        bladeFormData?.DIECUT_AGE !== undefined &&
        (bladeFormData.DIECUT_AGE < 0 || bladeFormData.DIECUT_AGE > 250000)
      ) {
        errors.DIECUT_AGE = 'อายุ tooling ต้องอยู่ระหว่าง 0 ถึง 250,000'
      }
    }

    // Check for change reason when changing type
    if (showTypeChangeDialog && (!newModifyType || !bladeFormData?.CHANGE_REASON)) {
      errors.CHANGE_REASON = 'ต้องระบุเหตุผลในการเปลี่ยนประเภท'
    }

    setValidationErrors(errors)

    return Object.keys(errors).length === 0
  }

  const handleBladeChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    if (!bladeFormData) return

    // Clear validation error when field is edited
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev }

        delete updated[field]

        return updated
      })
    }

    // Special handling for datetime-local inputs
    if (field === 'START_TIME' || field === 'END_TIME') {
      // Ensure we're creating valid date objects
      const dateValue = value ? new Date(value) : null

      // Validate date before setting
      const isValidDate = dateValue && !isNaN(dateValue.getTime())

      if (field === 'END_TIME' && isValidDate) {
        // When setting end date, update status to T
        setBladeFormData(prev => ({
          ...prev!,
          [field]: isValidDate ? dateValue : null,
          STATUS: 'T' // Update status to T when end date is set
        }))
      } else {
        setBladeFormData(prev => ({
          ...prev!,
          [field]: isValidDate ? dateValue : null
        }))
      }
    } else if (field === 'DIECUT_AGE') {
      // For tooling age, convert to number and limit range
      const numValue = parseInt(value, 10)

      // Allow empty value (will be caught by validation later if needed)
      if (isNaN(numValue) && value !== '') return

      setBladeFormData(prev => {
        if (!prev) return prev // Handle null case by returning null

        // Create a copy of the previous state
        const updatedItem = { ...prev }

        // Type-safe update based on field type
        if (field === 'DIECUT_AGE') {
          // For numeric fields
          updatedItem[field] = value === '' ? 0 : Math.min(Math.max(numValue, 0), 250000)
        }

        return updatedItem as BladeItem
      })
    } else {
      setBladeFormData(prev => ({
        ...prev!,
        [field]: field.includes('Date') && value ? new Date(value) : value
      }))
    }
  }

  const getAllRelatedSNs = useCallback(
    async (diecutId: string, currentSN: string) => {
      try {
        // 1. Get SNs from database
        const result: any = await apiClient.post('/api/diecuts/getdiecutsn', {
          diecutId: diecutId
        })

        let dbSNs = []

        if (result.success && result.data.diecutList) {
          dbSNs = result.data.diecutList.filter(
            (blade: BladeItem) => blade.DIECUT_SN !== currentSN && blade.DIECUT_ID === diecutId && blade.STATUS !== 'F'
          )
        }

        // 2. Get newly created SNs from local state
        const localNewSNs = data.filter(
          item =>
            item.DIECUT_ID === diecutId &&
            item.DIECUT_SN !== currentSN &&
            (item.NEW_ADD === true || item.isNewlyAdded === true)
        )

        // 3. Combine and remove duplicates
        const allSNs = [...dbSNs, ...localNewSNs]

        const uniqueSNs = allSNs.filter(
          (sn, index, self) => index === self.findIndex(t => t.DIECUT_SN === sn.DIECUT_SN)
        )

        return uniqueSNs
      } catch (error) {
        console.error('Error fetching related SNs:', error)

        return []
      }
    },
    [data]
  )

  const saveSingleBlade = async (formData: BladeItem, basicDataOnly: boolean = false) => {
    try {
      // Validate form data first
      if (!basicDataOnly && !validateForm()) {
        return false
      }

      // Check if this is a newly added blade
      const isNewBlade = formData.isNewlyAdded || formData.NEW_ADD

      // Always create the SN in database first if it's new
      if (isNewBlade) {
        console.log('Creating new blade in database first:', formData.DIECUT_SN)

        const createResult: any = await apiClient.post('/api/diecuts/savediecut', {
          diecutId: formData.DIECUT_ID,
          diecut_TYPE: formData.DIECUT_TYPE || 'DC',
          STATUS: formData.STATUS || 'N',
          SNList: [
            {
              DIECUT_SN: formData.DIECUT_SN,
              BLADE_TYPE: formData.BLADE_TYPE || '',
              MODIFY_TYPE: formData.MODIFY_TYPE || 'N'
            }
          ]
        })

        if (!createResult.success) {
          console.error('Failed to create new blade:', createResult.message)

          return false
        }
      }

      // Only save detailed data if not in basicDataOnly mode
      if (!basicDataOnly) {
        // Save the detailed blade information
        const payload = {
          diecutId: formData.DIECUT_ID,
          diecutSN: formData.DIECUT_SN,
          diecutAge: formData.DIECUT_AGE,
          startTime: formData.START_TIME ? new Date(formData.START_TIME) : null,
          endTime: formData.END_TIME ? new Date(formData.END_TIME) : null,
          bladeType: formData.BLADE_TYPE,
          multiBladeReason: formData.MULTI_BLADE_REASON,
          multiBladeRemark: formData.MULTI_BLADE_REMARK,
          probDesc: formData.PROB_DESC,
          remark: formData.REMARK,
          jobOrder: formData.JOB_ORDER,
          productCode: formData.PRODUCT_CODE,
          productName: formData.PRODUCT_NAME,
          pcsPerSheet: formData.PCS_PER_SHEET,
          requiredDate: formData.REQUIRED_DATE,
          changeReason: formData.CHANGE_REASON,
          status: formData.END_TIME ? 'T' : formData.STATUS // Set status to T if end date is set
        }

        console.log('Saving blade details:', payload)

        const result: any = await apiClient.post('/api/diecuts/savediecutmodidetail', payload)

        if (!result.success) {
          console.error('Failed to save blade data:', result.message)

          return false
        }
      }

      // Update local state to mark the item as saved
      const updatedBlade = {
        ...formData,
        isNewlyAdded: false,
        NEW_ADD: false,

        // If end date is set, update STATUS to T
        STATUS: formData.END_TIME ? 'T' : formData.STATUS
      }

      // Update the list with the new data
      const updatedList = dieCutSNList.map(blade => (blade.DIECUT_SN === formData.DIECUT_SN ? updatedBlade : blade))

      setDieCutSNList(updatedList)

      // if (onProcessComplete) {
      //   console.log('Calling onProcessComplete to refresh parent data')
      //   onProcessComplete()
      // }

      // Update original list reference
      originalListRef.current = JSON.parse(JSON.stringify(updatedList))

      console.log('Blade data saved successfully')

      return true
    } catch (error) {
      console.error('Error saving blade data:', error)

      return false
    }
  }

  const saveBatchNewSNs = async () => {
    // Skip if already processing
    if (batchSaveInProgressRef.current) {
      console.log('Batch save already in progress, ignoring duplicate call')

      return
    }

    // Set flag BEFORE any state changes
    batchSaveInProgressRef.current = true
    console.log('Starting batch save, dialog should stay open')

    try {
      // First check location for the current blade
      const checkLocation = await handleCheckLocation(bladeFormData as BladeItem)

      if (!checkLocation) {
        // Reset flag if location check fails
        batchSaveInProgressRef.current = false
        setShowBatchSaveDialog(false)

        return
      }

      // Then save the current blade with full details
      const currentSuccess = await saveSingleBlade(bladeFormData as BladeItem, false)

      if (!currentSuccess) {
        alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง')

        // Reset flag and close dialog only after the alert
        batchSaveInProgressRef.current = false
        setShowBatchSaveDialog(false)

        return
      }

      let successCount = 1 // Current blade already saved
      let failCount = 0

      // Then save all related new blades with basic data only
      for (const sn of relatedNewSNs) {
        // Check location for each blade
        const snLocationCheck = await handleCheckLocation(sn)

        if (snLocationCheck) {
          const success = await saveSingleBlade(sn, true)

          if (success) {
            successCount++
          } else {
            failCount++
          }
        } else {
          failCount++
        }
      }

      // Only close the dialog once at the end of the entire process
      setShowBatchSaveDialog(false)

      // Clean up state in a single batch to minimize re-renders
      setEditingBladeSN(null)
      setBladeFormData(null)
      originalBladeDataRef.current = null

      // Call onProcessComplete to refresh the data in parent component
      // with small delay to ensure dialog is closed first
      setTimeout(() => {
        if (onClose) onClose()
        if (onProcessComplete) onProcessComplete()

        // Reset the flag AFTER everything is done
        batchSaveInProgressRef.current = false
      }, 100)
    } catch (error) {
      console.error('Error in batch save:', error)

      // Reset flag and close dialog on error
      batchSaveInProgressRef.current = false
      setShowBatchSaveDialog(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!bladeFormData) return

    try {
      // API call to cancel the order
      const result: any = await apiClient.post('/api/diecuts/cancelorder', {
        diecutId: bladeFormData.DIECUT_ID,
        diecutSN: bladeFormData.DIECUT_SN
      })

      if (result.success) {
        // Close the dialog
        setShowCancelOrderDialog(false)

        // Show success message
        // You could add a snackbar notification here if needed

        // Close the detail panel
        onClose && onClose()

        // If you have a callback to refresh the parent component's data
        onProcessComplete && onProcessComplete()
      } else {
        console.error('Failed to cancel order:')

        // You could show an error message here
      }
    } catch (error) {
      console.error('Error cancelling order:', error)

      // You could show an error message here
    }
  }

  const handleCheckLocation = async (blade: BladeItem): Promise<boolean> => {
    // If the status is 'N' or 'M', no need to check location
    if (blade.STATUS === 'N' || blade.STATUS === 'M') {
      return true
    }

    // For status 'T', insert location automatically
    if (blade.STATUS === 'T' || blade.END_TIME) {
      try {
        // Call API to insert location
        const result: any = await apiClient.post('/api/diecuts/insertlocation', {
          diecutId: blade.DIECUT_ID,
          diecutSn: blade.DIECUT_SN
        })

        return result.success
      } catch (error) {
        console.error('Error inserting location:', error)

        return false
      }
    }

    // For all other statuses (B, E, etc.), check location
    try {
      const result: any = await apiClient.post('/api/diecuts/checklocation', {
        diecutId: blade.DIECUT_ID,
        diecutSn: blade.DIECUT_SN
      })

      if (!result.success || !result.data.hasLocation) {
        // If location check fails, prompt user to confirm
        const confirmResult = window.confirm(
          'ไม่พบข้อมูลตำแหน่งจัดเก็บ Tooling นี้ ต้องการบันทึกโดยไม่ระบุตำแหน่งหรือไม่?'
        )

        return confirmResult
      }

      return true
    } catch (error) {
      console.error('Error checking location:', error)

      return false
    }
  }

  const CancelOrderDialog = () => {
    return (
      <Dialog open={showCancelOrderDialog} onClose={() => setShowCancelOrderDialog(false)}>
        <DialogTitle>ยืนยันการยกเลิก tooling</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณต้องการยกเลิก tooling นี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCancelOrderDialog(false)}
            sx={{
              borderColor: '#98867B',
              color: '#98867B'
            }}
          >
            ยกเลิก
          </Button>
          <Button onClick={handleCancelOrder} variant='contained' color='error'>
            ตกลง
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const getDetailData = useCallback(
    async (diecutId: any) => {
      try {
        const data: any = await apiClient.post('/api/diecuts/getdiecutsndetail', {
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
    },
    [selectedItem?.DIECUT_ID, selectedItem?.DIECUT_SN]
  )

  // The useEffect hook to load data when a die cut is selected
  useEffect(() => {
    // Clear editing state when selected item changes
    setEditingBladeSN(null)
    setBladeFormData(null)
    originalBladeDataRef.current = null
    setValidationErrors({})

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
          MODIFY_TYPE: 'N',
          CHANGE_REASON: ''
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
  }, [selectedItem, getDetailData])

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
          const markedData = updatedData.map((blade: any) => ({
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
    setValidationErrors({}) // Clear validation errors

    // Create a proper copy of the blade data with appropriate date conversions
    const bladeDataWithDates = {
      ...blade,

      // Convert string dates to Date objects if they exist
      START_TIME: blade.START_TIME ? new Date(blade.START_TIME) : new Date(),
      END_TIME: blade.END_TIME ? new Date(blade.END_TIME) : null,
      REQUIRED_DATE: blade.REQUIRED_DATE ? new Date(blade.REQUIRED_DATE) : null,
      CHANGE_REASON: blade.CHANGE_REASON || ''
    }

    // Store original data for comparison
    originalBladeDataRef.current = JSON.parse(JSON.stringify(bladeDataWithDates))
    setBladeFormData(bladeDataWithDates)
  }

  const handleSaveBlade = async (e: any) => {
    if (!bladeFormData) return

    if (e) e.stopPropagation()

    // Validate form before saving
    if (!validateForm()) {
      return
    }

    try {
      // Check if this is a newly added blade
      const isNewBlade = bladeFormData.isNewlyAdded || bladeFormData.NEW_ADD

      if (isNewBlade) {
        // Only look for other new SNs if this is a new blade
        const relatedNew = getRelatedNewSNs(bladeFormData.DIECUT_ID, bladeFormData.DIECUT_SN)

        if (relatedNew && relatedNew.length > 0) {
          // Convert IDiecut[] to BladeItem[]
          const convertedItems: BladeItem[] = relatedNew.map(item => ({
            DIECUT_ID: item.DIECUT_ID,
            DIECUT_SN: item.DIECUT_SN,
            BLADE_TYPE: item.DIECUT_TYPE || '',
            DIECUT_AGE: item.AGES || 0,
            STATUS: item.STATUS || 'N',
            bladeType: item.DIECUT_TYPE || '',
            bladeSize: '',
            details: '',
            TL_STATUS: 'GOOD',
            PROB_DESC: item.PROD_DESC || '',
            START_TIME: new Date(),
            END_TIME: null,
            PRODUCTION_ISSUE: '',
            TOOLING_AGE: item.AGES || 0,
            FIX_DETAILS: '',
            BLADE_SIZE: '',
            MULTI_BLADE_REASON: '',
            MULTI_BLADE_REMARK: '',
            isNewlyAdded: true,
            REMARK: item.REMARK || '',
            MODIFY_TYPE: item.MODIFY_TYPE || 'N',
            JOB_ORDER: item.JOB_ID || '',
            PRODUCT_CODE: item.PROD_ID || '',
            PRODUCT_NAME: item.PROD_DESC || '',
            CHANGE_REASON: ''
          }))

          setRelatedNewSNs(convertedItems)
          setShowBatchSaveDialog(true)

          return
        }
      }

      // If not a new blade or no related new SNs, check location first
      const checkLocation = await handleCheckLocation(bladeFormData)

      if (checkLocation) {
        // If location check passes, save the blade
        const success = await saveSingleBlade(bladeFormData, false)

        if (success) {
          // Call onProcessComplete to refresh the data in parent component
          if (onProcessComplete) {
            onProcessComplete()
          }

          setEditingBladeSN(null)
          setBladeFormData(null)
          onClose?.()
          originalBladeDataRef.current = null
        }
      }
    } catch (error) {
      console.error('Error in handleSaveBlade:', error)
    }
  }

  const BatchSaveDialog = () => {
    return (
      <Dialog open={showBatchSaveDialog} onClose={() => setShowBatchSaveDialog(false)}>
        <DialogTitle>ยืนยันการบันทึกรายการใหม่</DialogTitle>
        <DialogContent>
          <DialogContentText>
            พบรายการใบมีดใหม่ที่มีรหัส {bladeFormData?.DIECUT_ID} จำนวน {relatedNewSNs.length} รายการ
            จะบันทึกรายการเหล่านี้ด้วยหรือไม่?
          </DialogContentText>
          <Typography variant='subtitle2' sx={{ mt: 2 }}>
            รายการที่จะบันทึก:
          </Typography>
          <Box sx={{ ml: 2, mt: 1, maxHeight: '200px', overflow: 'auto' }}>
            <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
              {bladeFormData?.DIECUT_SN} (รายการปัจจุบัน - บันทึกข้อมูลครบถ้วน)
            </Typography>
            {relatedNewSNs.map(sn => (
              <Typography key={sn.DIECUT_SN} variant='body2' sx={{ color: 'text.secondary' }}>
                {sn.DIECUT_SN} (บันทึกเฉพาะข้อมูลเริ่มต้น)
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={saveBatchNewSNs}
            variant='contained'
            disabled={batchSaveInProgressRef.current}
            sx={{
              backgroundColor: '#98867B',
              '&:hover': {
                backgroundColor: '#5A4D40'
              }
            }}
          >
            {batchSaveInProgressRef.current ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  // Cancel editing a specific blade
  const handleCancelBlade = () => {
    setEditingBladeSN(null)
    setBladeFormData(null)
    originalBladeDataRef.current = null
    setValidationErrors({})
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
        CHANGE_REASON: '',

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
      const result: any = await apiClient.post('/api/diecuts/getautodate', {
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

      const result: any = await apiClient.post('/api/diecuts/updatestatus', payload)

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
        const result: any = await apiClient.post('/api/auth/verifyapprover', {
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
            กรุณาใส่ชื่อผู้ใช้และรหัสผ่านของผู้มีสิทธิ์อนุมัติเพื่อเปลี่ยนสถานะจาก เปลี่ยนใบมีด เป็น สร้างทดแทน
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
    const [loading, setLoading] = useState(false)
    const [localChangeReason, setLocalChangeReason] = useState(bladeFormData?.CHANGE_REASON || '')
    const [localError, setLocalError] = useState('')

    const handleTypeChange = async () => {
      if (!newModifyType || !localChangeReason) {
        setLocalError('กรุณาเลือกประเภทและระบุเหตุผลในการเปลี่ยนก่อนดำเนินการต่อ')

        return
      }

      setLoading(true)
      setLocalError('')

      try {
        // Update bladeFormData with change reason
        setBladeFormData(prev => {
          if (!prev) return null

          return {
            ...prev,
            CHANGE_REASON: localChangeReason
          }
        })

        const payload = {
          diecutId: bladeFormData?.DIECUT_ID,
          diecutSN: bladeFormData?.DIECUT_SN,
          modifyType: newModifyType,
          changeReason: localChangeReason,
          modifyTypeAppvFlag: 'P'
        }

        const result: any = await apiClient.post('/api/diecuts/changetyperequest', payload)

        if (result.success) {
          // Update local state
          setBladeFormData(prev => ({
            ...prev!,
            MODIFY_TYPE_APPV_FLAG: 'P',
            MODIFY_TYPE: newModifyType,
            CHANGE_REASON: localChangeReason
          }))

          // Close dialog
          setShowTypeChangeDialog(false)

          // Open approval dialog immediately
          setShowTypeApprovalDialog(true)
        } else {
          setLocalError('ไม่สามารถเปลี่ยนประเภทได้: ' + (result.message || 'เกิดข้อผิดพลาด'))
        }
      } catch (error) {
        console.error('Error requesting type change:', error)
        setLocalError('เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง')
      } finally {
        setLoading(false)
      }
    }

    return (
      <Dialog open={showTypeChangeDialog} onClose={() => setShowTypeChangeDialog(false)} fullWidth maxWidth='sm'>
        <DialogTitle>เปลี่ยนประเภทงาน</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            เลือกประเภทงานใหม่ โดยการเปลี่ยนประเภทงานจะต้องได้รับการอนุมัติจากหัวหน้า
          </DialogContentText>
          <FormControl fullWidth margin='dense' error={!!localError}>
            <InputLabel>ประเภทงานใหม่</InputLabel>
            <Select value={newModifyType} onChange={e => setNewModifyType(e.target.value)} label='ประเภทงานใหม่'>
              {MODIFY_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin='dense'
            label='เหตุผลในการเปลี่ยน'
            multiline
            rows={3}
            fullWidth
            value={localChangeReason}
            onChange={e => setLocalChangeReason(e.target.value)}
            error={!!localError && !localChangeReason}
            sx={{ mt: 2 }}
          />
          {localError && (
            <FormHelperText error sx={{ mt: 1 }}>
              {localError}
            </FormHelperText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTypeChangeDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleTypeChange} disabled={loading || !newModifyType || !localChangeReason}>
            {loading ? <CircularProgress size={24} /> : 'ยืนยัน'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  // Dialog for work type change approval
  // Dialog for work type change approval
  const TypeApprovalDialog = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [loadingStep, setLoadingStep] = useState(0) // 0=not started, 1=checking auth, 2=saving, 3=complete

    // ฟังก์ชันทำการอนุมัติโดยตรงสำหรับ manager
    const handleDirectApprove = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!bladeFormData) return

      setLoading(true)
      setLoadingStep(2) // ข้ามขั้นตอนการตรวจสอบ auth ไปยังขั้นตอนการบันทึก

      try {
        // บันทึกข้อมูลการอนุมัติโดยใช้ข้อมูลผู้ใช้ปัจจุบัน
        const approvalResult: any = await apiClient.post('/api/diecuts/approvetypechange', {
          diecutId: bladeFormData.DIECUT_ID,
          diecutSN: bladeFormData.DIECUT_SN,
          modifyType: newModifyType || bladeFormData.MODIFY_TYPE_REQ_TO

          // ไม่ต้องส่ง approverId และ approverName จะใช้ข้อมูลจาก session
        })

        if (approvalResult.success) {
          setLoadingStep(3) // Complete

          // Short delay to show completion state
          setTimeout(() => {
            // Update local state
            setBladeFormData(prev => ({
              ...prev!,
              MODIFY_TYPE_APPV_FLAG: 'A',
              MODIFY_TYPE: newModifyType || bladeFormData.MODIFY_TYPE_REQ_TO
            }))

            // Close dialog
            setShowTypeApprovalDialog(false)

            if (onProcessComplete) {
              onProcessComplete()
            }
          }, 1000)
        } else {
          setError('ไม่สามารถบันทึกการอนุมัติได้: ' + approvalResult.message)
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

    // ฟังก์ชันสำหรับทำการอนุมัติที่ต้องกรอก username/password
    const handleApprove = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!bladeFormData) return

      // ดึงข้อมูลจากฟอร์ม
      const formData = new FormData(e.target as HTMLFormElement)
      const username = formData.get('username') as string
      const password = formData.get('password') as string

      if (!username || !password) {
        setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')

        return
      }

      setLoading(true)
      setError('')
      setLoadingStep(1) // Start with auth check

      try {
        // First verify the supervisor credentials
        const authResult: any = await apiClient.post('/api/diecuts/verifyapprover', {
          username,
          password,
          requiredPositionId: 'DIECUT_CHG_MOD_TYPE_APPV_POS'
        })

        if (authResult.success) {
          setLoadingStep(2) // Move to saving step

          // If authentication is successful, approve the change
          const approvalResult: any = await apiClient.post('/api/diecuts/approvetypechange', {
            diecutId: bladeFormData.DIECUT_ID,
            diecutSN: bladeFormData.DIECUT_SN,
            modifyType: newModifyType || bladeFormData.MODIFY_TYPE_REQ_TO,
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
                MODIFY_TYPE: newModifyType || bladeFormData.MODIFY_TYPE_REQ_TO
              }))

              // Close dialog
              setShowTypeApprovalDialog(false)

              if (onProcessComplete) {
                onProcessComplete()
              }
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
        const result: any = await apiClient.post('/api/diecuts/canceltypechange', {
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

        {loadingStep === 0 ? (
          isManager ? (
            <form onSubmit={handleDirectApprove}>
              <DialogContent>
                <DialogContentText>
                  คุณต้องการอนุมัติการเปลี่ยนประเภทงานจาก
                  {bladeFormData?.MODIFY_TYPE_ORIGINAL || '-'} เป็น {bladeFormData?.MODIFY_TYPE || '-'} หรือไม่?
                </DialogContentText>
                {error && (
                  <Alert severity='error' sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancel} color='error' disabled={loading}>
                  ยกเลิก
                </Button>
                <Button type='submit' disabled={loading}>
                  ตกลง
                </Button>
              </DialogActions>
            </form>
          ) : (
            <form onSubmit={handleApprove}>
              <DialogContent>
                <DialogContentText>
                  กรุณาใส่ชื่อผู้ใช้และรหัสผ่านของหัวหน้าที่มีสิทธิ์อนุมัติการเปลี่ยนประเภทงานจาก
                  {bladeFormData?.MODIFY_TYPE_ORIGINAL || '-'} เป็น {bladeFormData?.MODIFY_TYPE || '-'}
                </DialogContentText>
                <TextField autoFocus margin='dense' name='username' label='ชื่อผู้ใช้' type='text' fullWidth required />
                <TextField margin='dense' name='password' label='รหัสผ่าน' type='password' fullWidth required />
                {error && (
                  <Alert severity='error' sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancel} color='error' disabled={loading}>
                  ยกเลิก
                </Button>
                <Button type='submit' disabled={loading}>
                  อนุมัติ
                </Button>
              </DialogActions>
            </form>
          )
        ) : (
          <DialogContent>
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
                <Box sx={{ width: '100%', mt: 1 }}>{/* โค้ดแสดงขั้นตอนการทำงานเดิม */}</Box>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    )
  }

  // Function to get status text display
  const getStatusText = (status: string | null | undefined) => {
    if (!status) return 'ไม่ระบุ'

    switch (status) {
      case 'N':
        return 'สร้างใหม่'
      case 'B':
        return 'เปลี่ยนใบมีด'
      case 'M':
        return 'สร้างทดแทน'
      case 'E':
        return 'แก้ไข'
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
            {/* Main container using flexbox */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {/* Left column */}
              <Box sx={{ width: '50%', pr: 1, mb: 1 }}>
                <Typography variant='subtitle2'>รหัสคำขอ</Typography>
                <Box sx={{ width: '70%', height: 20, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Box>

              {/* Right column */}
              <Box sx={{ width: '50%', mb: 1 }}>
                <Typography variant='subtitle2'>สถานะ</Typography>
                <Box sx={{ width: '50%', height: 24, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Box>

              {/* Left column - second row */}
              <Box sx={{ width: '50%', pr: 1, mb: 1 }}>
                <Typography variant='subtitle2'>ประเภท</Typography>
                <Box sx={{ width: '60%', height: 20, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Box>

              {/* Right column - second row */}
              <Box sx={{ width: '50%', mb: 1 }}>
                <Typography variant='subtitle2'>อายุการใช้งาน</Typography>
                <Box sx={{ width: '40%', height: 20, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Box>

              {/* Left column - third row */}
              <Box sx={{ width: '50%', pr: 1 }}>
                <Typography variant='subtitle2'>ความเร่งด่วน</Typography>
                <Box sx={{ width: '50%', height: 24, bgcolor: '#f0f0f0', borderRadius: 1, mt: 0.5 }} />
              </Box>
            </Box>
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
                  {/* Left column - first row */}
                  <Box sx={{ width: 'calc(50% - 4px)' }}>
                    <Typography variant='subtitle2'>รหัสคำขอ</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.DIECUT_ID}
                    </Typography>
                  </Box>

                  {/* Right column - first row */}
                  <Box sx={{ width: 'calc(50% - 4px)' }}>
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
                  </Box>

                  {/* Left column - second row */}
                  <Box sx={{ width: 'calc(50% - 4px)' }}>
                    <Typography variant='subtitle2'>กว้าง (มม.)</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.BLANK_SIZE_X || 'ไม่ระบุ'}
                    </Typography>
                    <Typography variant='subtitle2'>ยาว (มม.)</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.BLANK_SIZE_Y || 'ไม่ระบุ'}
                    </Typography>
                  </Box>

                  {/* Right column - second row */}
                  <Box sx={{ width: 'calc(50% - 4px)' }}>
                    <Typography variant='subtitle2'>อายุการใช้งาน</Typography>
                    <Typography variant='body2' gutterBottom>
                      {formatNumber(selectedItem.AGES) || 'ไม่ระบุ'}
                    </Typography>
                  </Box>
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

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {/* First row, left column */}
                          <Box sx={{ width: 'calc(50% - 4px)' }}>
                            <Typography variant='caption' color='text.secondary'>
                              ประเภทใบมีด
                            </Typography>
                            <Typography variant='body2'>{blade.BLADE_TYPE || 'ไม่ระบุ'}</Typography>
                          </Box>

                          {/* First row, right column */}
                          <Box sx={{ width: 'calc(50% - 4px)' }}>
                            <Typography variant='caption' color='text.secondary'>
                              อายุ tooling
                            </Typography>
                            <Typography variant='body2'>{formatNumber(blade.DIECUT_AGE) || 'ไม่ระบุ'}</Typography>
                          </Box>

                          {/* Second row, left column */}
                          <Box sx={{ width: 'calc(50% - 4px)' }}>
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
                          </Box>

                          {/* Second row, right column */}
                          <Box sx={{ width: 'calc(50% - 4px)' }}>
                            <Typography variant='caption' color='text.secondary'>
                              JOB Order
                            </Typography>
                            <Typography variant='body2'>{blade.JOB_ORDER || 'ไม่ระบุ'}</Typography>
                          </Box>

                          {/* Conditional full-width row for problem description */}
                          {blade.PROB_DESC && (
                            <Box sx={{ width: '100%' }}>
                              <Typography variant='caption' color='text.secondary'>
                                รายละเอียดปัญหา
                              </Typography>
                              <Typography variant='body2'>{blade.PROB_DESC}</Typography>
                            </Box>
                          )}

                          {/* Show change reason if it exists */}
                          {blade.CHANGE_REASON && (
                            <Box sx={{ width: '100%' }}>
                              <Typography variant='caption' color='text.secondary'>
                                เหตุผลในการเปลี่ยน
                              </Typography>
                              <Typography variant='body2'>{blade.CHANGE_REASON}</Typography>
                            </Box>
                          )}
                        </Box>
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
                    บันทึกๅๅ
                  </Button>
                </Box>
              </>
            )}

            {/* Blade Editing Form */}
            {editingBladeSN !== null && bladeFormData && (
              <Box sx={{ p: 2 }}>
                {/* Work Type Change Buttons */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 2,
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
                    {/* แก้ไขที่ Box ที่มีปุ่มให้มีเงื่อนไขแสดงผล */}
                    <Box sx={{ ml: 'auto' }}>
                      {bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'P' ? (
                        isManager && (
                          <PermissionGate requiredPermission='isManager'>
                            <Button
                              variant='outlined'
                              size='small'
                              onClick={() => setShowTypeApprovalDialog(true)}
                              sx={{
                                borderColor: '#98867B',
                                color: '#98867B',
                                '&:hover': {
                                  borderColor: '#5A4D40',
                                  backgroundColor: 'rgba(152, 134, 123, 0.04)'
                                },
                                '&.Mui-disabled': {
                                  borderColor: 'rgba(0, 0, 0, 0.12)',
                                  color: 'rgba(0, 0, 0, 0.26)'
                                }
                              }}
                            >
                              อนุมัติ
                            </Button>
                          </PermissionGate>
                        )
                      ) : (
                        <Button
                          variant='outlined'
                          size='small'
                          onClick={() => setShowTypeChangeDialog(true)}
                          sx={{
                            borderColor: '#98867B',
                            color: '#98867B',
                            '&:hover': {
                              borderColor: '#5A4D40',
                              backgroundColor: 'rgba(152, 134, 123, 0.04)'
                            },
                            '&.Mui-disabled': {
                              borderColor: 'rgba(0, 0, 0, 0.12)',
                              color: 'rgba(0, 0, 0, 0.26)'
                            }
                          }}
                        >
                          เปลี่ยน
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>

                <div className='flex-1 overflow-auto' style={{ height: '65vh' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {/* Start Date */}
                    <Box sx={{ width: 'calc(50% - 8px)' }}>
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
                        error={!!validationErrors.START_TIME}
                        helperText={validationErrors.START_TIME}
                        inputProps={{
                          max: new Date().toISOString().substring(0, 16), // Restrict to current date/time
                          min: bladeFormData?.CR_DATE
                            ? new Date(bladeFormData.CR_DATE).toISOString().substring(0, 16)
                            : undefined // Set minimum date to creation date
                        }}
                        disabled={bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'P'}
                      />
                    </Box>

                    {/* End Date */}
                    <Box sx={{ width: 'calc(50% - 8px)' }}>
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
                          })(),

                          max: new Date().toISOString().substring(0, 16) // Restrict to current date/time
                        }}
                        error={!!validationErrors.END_TIME}
                        helperText={validationErrors.END_TIME}
                        disabled={bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'P'}
                      />
                    </Box>

                    {/* Full-width Fields */}
                    {/* Tooling Age */}
                    <Box sx={{ width: '100%' }}>
                      <Typography variant='subtitle2'>อายุ tooling</Typography>
                      <TextField
                        fullWidth
                        size='small'
                        type='number'
                        value={bladeFormData.DIECUT_AGE || ''}
                        onChange={handleBladeChange('DIECUT_AGE')}
                        margin='normal'
                        error={!!validationErrors.DIECUT_AGE}
                        helperText={validationErrors.DIECUT_AGE}
                        InputProps={{
                          inputProps: {
                            min: bladeFormData.END_TIME ? 1 : 0,
                            max: 250000
                          },
                          sx: {
                            '& input': {
                              textAlign: 'right'
                            }
                          }
                        }}
                        disabled={bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'P' || bladeFormData?.MODIFY_TYPE === 'E'}
                      />
                    </Box>

                    {/* Problem from production */}
                    <Box sx={{ width: '100%' }}>
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
                    </Box>

                    {/* Edit details */}
                    <Box sx={{ width: '100%' }}>
                      <Typography variant='subtitle2'>รายละเอียดในการแก้ไข</Typography>
                      <TextField
                        fullWidth
                        size='small'
                        multiline
                        rows={3}
                        value={bladeFormData.REMARK || ''}
                        onChange={handleBladeChange('REMARK')}
                        margin='normal'
                        disabled={bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'P'}
                      />
                    </Box>

                    {/* Change reason if requesting change */}
                    <Box sx={{ width: '100%' }}>
                      <Typography variant='subtitle2'>เหตุผลในการเปลี่ยน</Typography>
                      <TextField
                        fullWidth
                        size='small'
                        multiline
                        rows={3}
                        value={bladeFormData.CHANGE_REASON || ''}
                        onChange={handleBladeChange('CHANGE_REASON')}
                        margin='normal'
                        error={!!validationErrors.CHANGE_REASON}
                        helperText={validationErrors.CHANGE_REASON}
                        disabled
                      />
                    </Box>

                    {/* Blade distance */}
                    <Box sx={{ width: '100%' }}>
                      <Typography variant='subtitle2'>ระยะมีด</Typography>
                      <TextField
                        fullWidth
                        disabled
                        size='small'
                        value={bladeFormData.BLADE_TYPE || ''}
                        onChange={handleBladeChange('BLADE_TYPE')}
                        margin='normal'
                      />
                    </Box>

                    {/* Reason for using double blade */}
                    <Box sx={{ width: '100%' }}>
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
                    </Box>

                    {/* Details for using double blade */}
                    <Box sx={{ width: '100%' }}>
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
                    </Box>
                  </Box>
                </div>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <PermissionGate requiredPermission='isManager'>
                    <Button
                      variant='outlined'
                      color='error'
                      onClick={() => setShowCancelOrderDialog(true)}
                      sx={{
                        borderColor: '#d32f2f',
                        color: '#d32f2f'
                      }}
                    >
                      ยกเลิก tooling
                    </Button>
                  </PermissionGate>
                  <Button
                    variant='outlined'
                    onClick={onClose}
                    sx={{
                      borderColor: '#98867B',
                      color: '#98867B'
                    }}
                  >
                    ปิด
                  </Button>

                  <Button
                    variant='contained'
                    onClick={handleSaveBlade}
                    disabled={!hasFormChanged() || bladeFormData?.MODIFY_TYPE_APPV_FLAG === 'P'}
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
                </Box>
                <Typography sx={{ color: 'red', mt: 4 }}>
                  หมายเหตุ: เมื่อใส่วันที่สิ้นสุด และบันทึก สถานะจะเปลี่ยนเป็น พร้อมใช้งาน โดยอัตโนมัติ และอายุ Tooling
                </Typography>
              </Box>
            )}

            {/* Render the dialogs */}
            {showApprovalDialog && <ApprovalDialog />}
            {showTypeChangeDialog && <TypeChangeDialog />}
            {showTypeApprovalDialog && <TypeApprovalDialog />}
            {showCancelOrderDialog && <CancelOrderDialog />}
            {showBatchSaveDialog && <BatchSaveDialog />}
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
