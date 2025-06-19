'use client'

import { useState, useEffect } from 'react'

import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Divider,
  Grid
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/th' // Thai locale
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import apiClient from '../services/apiClient'
import type { IDiecut } from '../types/types'

// Configure dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)

// Set default timezone to Thailand
dayjs.tz.setDefault('Asia/Bangkok')

interface OrderDateModalProps {
  open: boolean
  onClose: () => void
  onSelect: (orderData: any) => void
  selectedDiecutForOrderDate: IDiecut | null
}

const OrderDateModal = ({ open, onClose, onSelect, selectedDiecutForOrderDate }: OrderDateModalProps) => {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allOrderData, setAllOrderData] = useState<any[]>([]) // Store all data
  const [orderData, setOrderData] = useState<any[]>([]) // Store filtered data
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

  // State สำหรับการเลือกวันที่เอง (MANUAL mode)
  const [manualDueDate, setManualDueDate] = useState<dayjs.Dayjs | null>(null)
  const [manualOrderDate, setManualOrderDate] = useState<dayjs.Dayjs | null>(null)

  // State สำหรับเก็บวันที่เก่าที่เคยบันทึกไว้
  const [savedDateData, setSavedDateData] = useState<any>(null)

  // Function to ensure date is in Thailand timezone and format correctly
  const ensureThailandDate = (date: dayjs.Dayjs | null): dayjs.Dayjs | null => {
    if (!date) return null

    // Convert to Thailand timezone and ensure it's the start of day to avoid timezone issues
    return dayjs.tz(date.format('YYYY-MM-DD'), 'Asia/Bangkok').startOf('day')
  }

  // Function to format date for display (always DD/MM/YYYY)
  const formatDateDisplay = (dateValue: string | Date | dayjs.Dayjs | null): string => {
    if (!dateValue) return '-'

    try {
      let date: dayjs.Dayjs

      if (typeof dateValue === 'string') {
        // Parse string date and set to Thailand timezone
        date = dayjs.tz(dateValue, 'Asia/Bangkok')
      } else if (dateValue instanceof Date) {
        // Convert Date to dayjs with Thailand timezone
        date = dayjs.tz(dateValue, 'Asia/Bangkok')
      } else {
        // Already dayjs object, ensure Thailand timezone
        date = dayjs.tz(dateValue, 'Asia/Bangkok')
      }

      // Always return DD/MM/YYYY format
      return date.format('DD/MM/YYYY')
    } catch (error) {
      console.error('Error formatting date:', error)

      return '-'
    }
  }

  // Function to format date for API (always YYYY-MM-DD)
  const formatDateForAPI = (date: dayjs.Dayjs | null): string => {
    if (!date) return ''

    // Ensure Thailand timezone and return YYYY-MM-DD format
    return dayjs.tz(date, 'Asia/Bangkok').format('YYYY-MM-DD')
  }

  // Fetch data when modal opens
  useEffect(() => {
    if (open) {
      fetchOrderData()
      console.log(selectedDiecutForOrderDate)
    } else {
      // Clear selection when modal closes
      setSelectedRow(null)
      setSearchQuery('')
      setManualDueDate(null)
      setManualOrderDate(null)
      setSavedDateData(null)
    }
  }, [open])

  // Populate saved dates when data is loaded
  useEffect(() => {
    if (savedDateData) {
      // Populate the date fields based on saved data
      const savedDueDate = savedDateData.DUE_DATE ? dayjs(savedDateData.DUE_DATE) : null
      const savedOrderDate = savedDateData.ORDER_DATE ? dayjs(savedDateData.ORDER_DATE) : null

      if (savedDateData.ORDER_DATE_TYPE === 'MANUAL') {
        // If previously saved as MANUAL, populate manual date fields
        setManualDueDate(savedDueDate)
        setManualOrderDate(savedOrderDate)
      } else if (savedDateData.ORDER_DATE_TYPE === 'AUTO') {
        // If previously saved as AUTO, try to find and select the matching row
        const matchingRow = allOrderData.find(
          row => row.JOB_ID === savedDateData.JOB_ID && row.PROD_ID === savedDateData.PROD_ID
        )

        if (matchingRow) {
          setSelectedRow(matchingRow)
        }
      }
    }
  }, [savedDateData, allOrderData])

  // Fetch order data from API - only called once when modal opens
  const fetchOrderData = async () => {
    setLoading(true)

    try {
      console.log(selectedDiecutForOrderDate)

      const result: any = await apiClient.post('/api/diecuts/getjoborderlist', {
        diecutId: selectedDiecutForOrderDate?.DIECUT_ID,
        DIECUT_TYPE: selectedDiecutForOrderDate?.DIECUT_TYPE,
        DIECUT_SN: selectedDiecutForOrderDate?.DIECUT_SN
      })

      if (result.success) {
        console.log(result)
        const data = result.data.jobList || []
        const dateData = result.data.dateList || []

        setAllOrderData(data) // Store all data
        setOrderData(data) // Initial display all data

        // Store saved date data if available
        if (dateData.length > 0) {
          setSavedDateData(dateData[0]) // Assume first item contains saved dates
        }
      } else {
        console.error('Failed to fetch job orders:', result.message)
        setAllOrderData([])
        setOrderData([])
        setSavedDateData(null)
      }
    } catch (error) {
      console.error('Error fetching job orders:', error)
      setAllOrderData([])
      setOrderData([])
      setSavedDateData(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle search - now filters local data instead of API call
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      // If search query is empty, show all data
      setOrderData(allOrderData)

      return
    }

    // Filter the data based on search query
    const filteredData = allOrderData.filter(row => {
      const query = searchQuery.toLowerCase()

      // Search in JOB_ID, PROD_ID, and JOB_DESC fields
      return (
        (row.JOB_ID && row.JOB_ID.toLowerCase().includes(query)) ||
        (row.PROD_ID && row.PROD_ID.toLowerCase().includes(query)) ||
        (row.JOB_DESC && row.JOB_DESC.toLowerCase().includes(query))
      )
    })

    setOrderData(filteredData)
  }

  // Handle search input keypress (search on Enter)
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  // Handle row selection (AUTO mode)
  const handleRowClick = (row: any) => {
    setSelectedRow(row)

    // ยกเลิกการเลือกวันที่เมื่อเลือกจาก table
    setManualDueDate(null)
    setManualOrderDate(null)
  }

  // Handle manual date selection (MANUAL mode)
  const handleManualDueDateChange = (newValue: dayjs.Dayjs | null) => {
    const adjustedDate = ensureThailandDate(newValue)

    setManualDueDate(adjustedDate)

    // ยกเลิกการเลือกจาก table เมื่อเลือกวันที่
    if (adjustedDate) {
      setSelectedRow(null)
    }
  }

  const handleManualOrderDateChange = (newValue: dayjs.Dayjs | null) => {
    const adjustedDate = ensureThailandDate(newValue)

    setManualOrderDate(adjustedDate)

    // ยกเลิกการเลือกจาก table เมื่อเลือกวันที่
    if (adjustedDate) {
      setSelectedRow(null)
    }
  }

  // Handle confirmation and pass selected data back
  const handleConfirm = () => {
    let enrichedData: any = {}

    if (selectedRow) {
      // AUTO mode - เลือกจาก table
      enrichedData = {
        ...selectedRow,
        ORDER_DATE_TYPE: 'AUTO'
      }
    } else if (manualDueDate && manualOrderDate) {
      // MANUAL mode - กรอกวันที่เอง
      enrichedData = {
        JOB_ID: selectedDiecutForOrderDate?.JOB_ID || '',
        PROD_ID: selectedDiecutForOrderDate?.PROD_ID || '',
        PROD_DESC: selectedDiecutForOrderDate?.PROD_DESC || '',
        JOB_DESC: selectedDiecutForOrderDate?.JOB_DESC || '',
        REVISION: selectedDiecutForOrderDate?.REVISION || '',
        DATE_USING: formatDateForAPI(manualDueDate), // Always YYYY-MM-DD
        ORDER_DATE: formatDateForAPI(manualOrderDate), // Always YYYY-MM-DD
        ORDER_DATE_TYPE: 'MANUAL'
      }
    } else {
      // ข้อมูลไม่ครบ
      return
    }

    onSelect(enrichedData)
    onClose()
  }

  // Check if confirm button should be enabled
  const isConfirmDisabled = () => {
    // ต้องเลือกอย่างใดอย่างหนึ่ง: จาก table หรือ กรอกวันที่เอง
    const hasTableSelection = selectedRow !== null
    const hasManualSelection = manualDueDate !== null && manualOrderDate !== null

    return !hasTableSelection && !hasManualSelection
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>งานสั่งทำ</DialogTitle>
      <DialogContent>
        {/* Search field */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder='ค้นหา (JOB, รหัสสินค้า, ชื่องาน)'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            size='small'
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant='contained'
            onClick={handleSearch}
            sx={{
              backgroundColor: '#98867B',
              '&:hover': {
                backgroundColor: '#5A4D40'
              }
            }}
          >
            ค้นหา
          </Button>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} sx={{ height: '350px', mb: 2 }}>
          <Table stickyHeader size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>
                  วันที่ต้องการใช้
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>
                  วันที่สั่งทำ
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>JOB</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>
                  รหัสสินค้า
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', minWidth: '300px' }}>
                  ชื่องาน
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>
                  ประเภท
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align='center' sx={{ height: '300px' }}>
                    <CircularProgress size={40} sx={{ color: '#98867B' }} />
                  </TableCell>
                </TableRow>
              ) : orderData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center' sx={{ height: '300px' }}>
                    <Typography variant='body1'>ไม่พบข้อมูล</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orderData.map((row, index) => (
                  <TableRow
                    key={index}
                    onClick={() => handleRowClick(row)}
                    selected={selectedRow && selectedRow.JOB_ID === row.JOB_ID}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(152, 134, 123, 0.15)',
                        '&:hover': {
                          backgroundColor: 'rgba(152, 134, 123, 0.25)'
                        }
                      }
                    }}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateDisplay(row.DATE_USING)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateDisplay(row.ORDER_DATE)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.JOB_ID || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {row.PROD_ID
                        ? row.REVISION
                          ? `${row.PROD_ID.replace(/^0+/, '')}-${row.REVISION}`
                          : row.PROD_ID.replace(/^0+/, '')
                        : '-'}
                    </TableCell>
                    <TableCell sx={{ minWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {row.JOB_DESC || '-'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {row.SRC == 'LSD' ? 'L.S.D ปั๊ม' : 'Job Scheduling'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Divider */}
        <Divider sx={{ my: 2 }}>
          <Typography variant='body2' color='text.secondary'>
            หรือ
          </Typography>
        </Divider>

        {/* Manual Date Selection with Thailand Locale */}
        <Box
          sx={{
            p: 2,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            backgroundColor: manualDueDate || manualOrderDate ? 'rgba(152, 134, 123, 0.05)' : 'transparent'
          }}
        >
          <Typography variant='subtitle2' gutterBottom sx={{ fontWeight: 'bold' }}>
            กำหนดวันที่เอง
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='th'>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <DatePicker
                  label='วันที่ต้องการใช้'
                  value={manualDueDate}
                  onChange={handleManualDueDateChange}
                  format='DD/MM/YYYY' // Force DD/MM/YYYY format
                  timezone='Asia/Bangkok' // Ensure Thailand timezone
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'วว/ดด/ปปปป'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <DatePicker
                  label='วันที่สั่งทำ'
                  value={manualOrderDate}
                  onChange={handleManualOrderDateChange}
                  format='DD/MM/YYYY' // Force DD/MM/YYYY format
                  timezone='Asia/Bangkok' // Ensure Thailand timezone
                  maxDate={manualDueDate || undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'วว/ดด/ปปปป',
                      helperText: manualDueDate ? 'วันที่สั่งทำต้องไม่เกินวันที่ต้องการใช้' : ''
                    }
                  }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Box>

        {/* Selection Status */}
      </DialogContent>

      <DialogActions>
        <div className='mr-auto'>
          <Typography variant='caption' display='block'>
            *LSD ปั๊ม = DUE ส่งของแรก-จำนวนขั้นตอนการผลิตจนถึงขั้นตอนปั๊ม
          </Typography>
          <Typography variant='caption' display='block'>
            *Job Scheduling = วันที่วางแผนกำหนดเริ่มงานแผนกปั๊ม
          </Typography>
        </div>
        <Button onClick={onClose} sx={{ color: '#98867B' }}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirmDisabled()}
          variant='contained'
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
          ตกลง
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default OrderDateModal
