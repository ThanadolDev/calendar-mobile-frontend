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
  Grid,
  Alert,
  Collapse
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import TableViewIcon from '@mui/icons-material/TableView'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

import apiClient from '../services/apiClient'
import type { IDiecut } from '../types/types'

interface OrderDateModalProps {
  open: boolean
  onClose: () => void
  onSelect: (orderData: any) => void
  selectedDiecutForOrderDate: IDiecut | null
}

const OrderDateModal = ({ open, onClose, onSelect, selectedDiecutForOrderDate }: OrderDateModalProps) => {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allOrderData, setAllOrderData] = useState<any[]>([])
  const [orderData, setOrderData] = useState<any[]>([])
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

  // Custom date mode
  const [isCustomDateMode, setIsCustomDateMode] = useState(false)
  const [customDueDate, setCustomDueDate] = useState<dayjs.Dayjs | null>(null)
  const [customOrderDate, setCustomOrderDate] = useState<dayjs.Dayjs | null>(null)

  // Saved data from database
  const [savedDateData, setSavedDateData] = useState<any>(null)

  // UI states
  const [showTableSection, setShowTableSection] = useState(true)

  // Fixed timezone date parsing
  const parseDate = (dateValue: string | Date | dayjs.Dayjs | null): dayjs.Dayjs | null => {
    if (!dateValue) return null

    try {
      if (typeof dateValue === 'string') {
        // Remove timezone and parse as local date
        const dateOnly = dateValue.split('T')[0]

        return dayjs(dateOnly)
      } else if (dateValue instanceof Date) {
        // Convert to YYYY-MM-DD string to avoid timezone issues
        const year = dateValue.getFullYear()
        const month = String(dateValue.getMonth() + 1).padStart(2, '0')
        const day = String(dateValue.getDate()).padStart(2, '0')

        return dayjs(`${year}-${month}-${day}`)
      } else {
        return dayjs(dateValue)
      }
    } catch (error) {
      console.error('Error parsing date:', error)

      return null
    }
  }

  // Format date for display (DD/MM/YYYY)
  const formatDateDisplay = (dateValue: any) => {
    // const date = parseDate(dateValue)

    // return date ? date.format('DD/MM/YYYY') : '-'

    const date = new Date(dateValue)

    // let formattedDisplayDate = '-'

    // Check if date is valid
    if (!isNaN(date.getTime())) {
      // Format for display (DD/MM/YYYY)
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${date.getFullYear()}`
    }
  }

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date: dayjs.Dayjs | null): string => {
    return date ? date.format('YYYY-MM-DD') : ''
  }

  // Reset states when modal opens/closes
  useEffect(() => {
    if (open) {
      fetchOrderData()
    } else {
      // Reset all states
      setSelectedRow(null)
      setSearchQuery('')
      setCustomDueDate(null)
      setCustomOrderDate(null)
      setSavedDateData(null)
      setIsCustomDateMode(false)
      setShowTableSection(true)
    }
  }, [open])

  // Load saved data and determine initial state
  useEffect(() => {
    if (savedDateData) {
      const savedDueDate = savedDateData.DUE_DATE ? dayjs(savedDateData.DUE_DATE) : null

      const savedOrderDate = savedDateData.ORDER_DATE ? dayjs(savedDateData.ORDER_DATE) : null

      // If has saved dates, check if it matches any row in table
      const matchingRow = allOrderData.find(
        row => row.JOB_ID === savedDateData.JOB_ID && row.PROD_ID === savedDateData.PROD_ID
      )

      if (matchingRow) {
        // Found matching row - select it
        setSelectedRow(matchingRow)
        setIsCustomDateMode(false)
      } else {
        // No matching row - use custom date mode with saved dates
        setCustomDueDate(savedDueDate)
        setCustomOrderDate(savedOrderDate)
        setIsCustomDateMode(true)
        setShowTableSection(false) // Hide table since using custom dates
      }
    } else if (allOrderData.length === 0 && !loading) {
      // No table data available - switch to custom date mode
      setIsCustomDateMode(true)
      setShowTableSection(false)
    }
  }, [savedDateData, allOrderData, loading])

  const fetchOrderData = async () => {
    setLoading(true)

    try {
      const result: any = await apiClient.post('/api/diecuts/getjoborderlist', {
        diecutId: selectedDiecutForOrderDate?.DIECUT_ID,
        DIECUT_TYPE: selectedDiecutForOrderDate?.DIECUT_TYPE,
        DIECUT_SN: selectedDiecutForOrderDate?.DIECUT_SN
      })

      if (result.success) {
        const data = result.data.jobList || []
        const dateData = result.data.dateList || []

        setAllOrderData(data)
        setOrderData(data)

        if (dateData.length > 0) {
          setSavedDateData(dateData[0])
        }
      } else {
        setAllOrderData([])
        setOrderData([])
      }
    } catch (error) {
      console.error('Error fetching job orders:', error)
      setAllOrderData([])
      setOrderData([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setOrderData(allOrderData)

      return
    }

    const filteredData = allOrderData.filter(row => {
      const query = searchQuery.toLowerCase()

      return (
        (row.JOB_ID && row.JOB_ID.toLowerCase().includes(query)) ||
        (row.PROD_ID && row.PROD_ID.toLowerCase().includes(query)) ||
        (row.JOB_DESC && row.JOB_DESC.toLowerCase().includes(query))
      )
    })

    setOrderData(filteredData)
  }

  const handleRowClick = (row: any) => {
    if (!isCustomDateMode) {
      setSelectedRow(row)
    }
  }

  // Switch to custom date mode
  const handleSwitchToCustomDate = () => {
    setIsCustomDateMode(true)
    setSelectedRow(null)

    // If there was a selected row, pre-populate with its dates
    if (selectedRow) {
      setCustomDueDate(parseDate(selectedRow.DATE_USING))
      setCustomOrderDate(parseDate(selectedRow.ORDER_DATE))
    }
  }

  // Switch back to table selection
  const handleSwitchToTable = () => {
    setIsCustomDateMode(false)
    setCustomDueDate(null)
    setCustomOrderDate(null)
    setShowTableSection(true)
  }

  const handleCustomDateChange = (field: 'due' | 'order') => (newValue: dayjs.Dayjs | null) => {
    if (field === 'due') {
      setCustomDueDate(newValue)
    } else {
      setCustomOrderDate(newValue)
    }
  }

  const handleConfirm = () => {
    let enrichedData: any = {}

    if (isCustomDateMode) {
      // Custom date mode
      enrichedData = {
        JOB_ID: selectedDiecutForOrderDate?.JOB_ID || '',
        PROD_ID: selectedDiecutForOrderDate?.PROD_ID || '',
        PROD_DESC: selectedDiecutForOrderDate?.PROD_DESC || '',
        JOB_DESC: selectedDiecutForOrderDate?.JOB_DESC || '',
        REVISION: selectedDiecutForOrderDate?.REVISION || '',
        DATE_USING: customDueDate ? formatDateForAPI(customDueDate) : null,
        ORDER_DATE: customOrderDate ? formatDateForAPI(customOrderDate) : null,
        ORDER_DATE_TYPE: 'MANUAL' // Backend still needs this
      }
    } else if (selectedRow) {
      // Table selection
      enrichedData = {
        ...selectedRow,
        ORDER_DATE_TYPE: 'MANUAL' // All selections are treated as manual now
      }
    } else {
      return
    }

    onSelect(enrichedData)
    onClose()
  }

  const isConfirmDisabled = () => {
    if (isCustomDateMode) {
      return false // Can always save in custom date mode (even with null dates)
    } else {
      return !selectedRow // Must select a row in table mode
    }
  }

  const hasTableData = allOrderData.length > 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>งานสั่งทำ</DialogTitle>

      <DialogContent>
        {/* Info when no table data */}
        {!loading && !hasTableData && (
          <Alert severity='info' sx={{ mb: 2 }}>
            ไม่พบข้อมูลแผนการผลิต กรุณากำหนดวันที่เอง
          </Alert>
        )}

        {/* Table Section */}
        {hasTableData && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Button
                startIcon={showTableSection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowTableSection(!showTableSection)}
                variant='text'
                sx={{ color: '#98867B' }}
              >
                เลือกจากแผนการผลิต ({allOrderData.length} รายการ)
              </Button>

              {!isCustomDateMode && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={handleSwitchToCustomDate}
                  variant='outlined'
                  size='small'
                  sx={{
                    borderColor: '#98867B',
                    color: '#98867B',
                    '&:hover': { borderColor: '#5A4D40', backgroundColor: 'rgba(152, 134, 123, 0.04)' }
                  }}
                >
                  กำหนดวันที่เอง
                </Button>
              )}
            </Box>

            <Collapse in={showTableSection && !isCustomDateMode}>
              <Box>
                {/* Search */}
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    placeholder='ค้นหา (JOB, รหัสสินค้า, ชื่องาน)'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSearch()}
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
                      '&:hover': { backgroundColor: '#5A4D40' }
                    }}
                  >
                    ค้นหา
                  </Button>
                </Box>

                {/* Table */}
                <TableContainer component={Paper} sx={{ height: '300px', mb: 2 }}>
                  <Table stickyHeader size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>วันที่ต้องการใช้</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>วันที่สั่งทำ</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>JOB</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>รหัสสินค้า</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>ชื่องาน</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>ประเภท</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} align='center' sx={{ height: '200px' }}>
                            <CircularProgress size={40} sx={{ color: '#98867B' }} />
                          </TableCell>
                        </TableRow>
                      ) : orderData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align='center' sx={{ height: '200px' }}>
                            <Typography variant='body1'>ไม่พบข้อมูลตามการค้นหา</Typography>
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
                                '&:hover': { backgroundColor: 'rgba(152, 134, 123, 0.25)' }
                              }
                            }}
                          >
                            <TableCell>{formatDateDisplay(row.DATE_USING)}</TableCell>
                            <TableCell>{formatDateDisplay(row.ORDER_DATE)}</TableCell>
                            <TableCell>{row.JOB_ID || '-'}</TableCell>
                            <TableCell>
                              {row.PROD_ID
                                ? row.REVISION
                                  ? `${row.PROD_ID.replace(/^0+/, '')}-${row.REVISION}`
                                  : row.PROD_ID.replace(/^0+/, '')
                                : '-'}
                            </TableCell>
                            <TableCell sx={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                              {row.JOB_DESC || '-'}
                            </TableCell>
                            <TableCell>{row.SRC == 'LSD' ? 'L.S.D ปั๊ม' : 'Job Scheduling'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Custom Date Section */}
        {isCustomDateMode && (
          <Box
            sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              backgroundColor: 'rgba(152, 134, 123, 0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                กำหนดวันที่เอง
              </Typography>
              {hasTableData && (
                <Button
                  startIcon={<TableViewIcon />}
                  onClick={handleSwitchToTable}
                  variant='outlined'
                  size='small'
                  sx={{
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    '&:hover': { borderColor: '#1565c0', backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                  }}
                >
                  กลับไปเลือกจากรายการ
                </Button>
              )}
            </Box>

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='th'>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label='วันที่ต้องการใช้'
                    value={customDueDate}
                    onChange={handleCustomDateChange('due')}
                    format='DD/MM/YYYY'
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: 'วว/ดด/ปปปป',
                        error: false
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    label='วันที่สั่งทำ'
                    value={customOrderDate}
                    onChange={handleCustomDateChange('order')}
                    format='DD/MM/YYYY'
                    maxDate={customDueDate || undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: 'วว/ดด/ปปปป',
                        helperText: customDueDate
                          ? 'วันที่สั่งทำต้องไม่เกินวันที่ต้องการใช้'
                          : 'ไม่จำเป็นต้องกรอก (สามารถเว้นว่างได้)'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Box>
        )}

        {/* Status Display */}
        <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            <strong>สถานะปัจจุบัน:</strong>{' '}
            {isCustomDateMode
              ? `กำหนดวันที่เอง ${
                  customDueDate || customOrderDate
                    ? `(${customDueDate ? formatDateDisplay(customDueDate) : '-'} | ${customOrderDate ? formatDateDisplay(customOrderDate) : '-'})`
                    : '(ยังไม่มีวันที่)'
                }`
              : selectedRow
                ? `เลือกจากรายการ: ${selectedRow.JOB_ID} (${formatDateDisplay(selectedRow.DATE_USING)} | ${formatDateDisplay(selectedRow.ORDER_DATE)})`
                : 'ยังไม่ได้เลือกรายการ'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Box>
            <Typography variant='caption' display='block'>
              *LSD ปั๊ม = DUE ส่งของแรก-จำนวนขั้นตอนการผลิตจนถึงขั้นตอนปั๊ม
            </Typography>
            <Typography variant='caption' display='block'>
              *Job Scheduling = วันที่วางแผนกำหนดเริ่มงานแผนกปั๊ม
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} sx={{ color: '#98867B' }}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirmDisabled()}
              variant='contained'
              sx={{
                backgroundColor: '#98867B',
                '&:hover': { backgroundColor: '#5A4D40' },
                '&.Mui-disabled': { backgroundColor: 'action.disabledBackground', opacity: 0.7 }
              }}
            >
              ตกลง
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default OrderDateModal
