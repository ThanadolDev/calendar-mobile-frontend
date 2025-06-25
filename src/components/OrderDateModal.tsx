'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

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
  Collapse,
  FormControl,
  FormLabel
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import TableViewIcon from '@mui/icons-material/TableView'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
import apiClient from '../services/apiClient'
import type { IDiecut } from '../types/types'

// Types
interface OrderData {
  JOB_ID: string
  PROD_ID: string
  PROD_DESC: string
  JOB_DESC: string
  REVISION: string | number | null
  DATE_USING: string | null
  ORDER_DATE: string | null
  SRC?: string
}

interface SavedDateData extends OrderData {
  DUE_DATE?: string | null
}

interface OrderDateModalProps {
  open: boolean
  onClose: () => void
  onSelect: (orderData: OrderData & { ORDER_DATE_TYPE: string }) => void
  selectedDiecutForOrderDate: IDiecut | null
}

// Constants
const DATE_DISPLAY_FORMAT = 'DD/MM/YYYY'
const MODAL_MAX_WIDTH = 'md' as const
const TABLE_HEIGHT = '300px'
const TIMEZONE = 'Asia/Bangkok'

// Custom DatePicker component with MUI styling
const CustomDatePicker = ({
  label,
  value,
  onChange,
  maxDate,
  error,
  helperText,
  placeholder = 'วว/ดด/ปปปป'
}: {
  label: string
  value: dayjs.Dayjs | null
  onChange: (date: dayjs.Dayjs | null) => void
  maxDate?: dayjs.Dayjs
  error?: boolean
  helperText?: string
  placeholder?: string
}) => {
  return (
    <FormControl fullWidth size='small'>
      <FormLabel component='legend' sx={{ fontSize: '0.75rem', mb: 0.5 }}>
        {label}
      </FormLabel>
      <DatePicker
        value={value}
        onChange={onChange}
        maxDate={maxDate}
        format='DD/MM/YYYY'
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            error: error,
            helperText: helperText,
            placeholder: placeholder,
            sx: {
              '& .MuiInputBase-input': {
                height: '1.4375em',
                padding: '8.5px 14px'
              },
              '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                color: '#98867B'
              }
            }
          },
          popper: {
            sx: {
              '& .MuiPickersCalendarHeader-root': {
                backgroundColor: '#98867b !important'
              },
              '& .MuiPickersCalendarHeader-label': {
                color: 'white !important'
              },
              '& .MuiPickersArrowSwitcher-button': {
                color: 'white !important'
              },
              '& .MuiDayCalendar-weekDayLabel': {
                color: '#98867b !important',
                fontWeight: 'bold'
              },
              '& .MuiPickersDay-root': {
                '&.Mui-selected': {
                  backgroundColor: '#98867b !important',
                  '&:hover': {
                    backgroundColor: '#5A4D40 !important'
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(152, 134, 123, 0.3) !important'
                }
              }
            }
          }
        }}
      />
    </FormControl>
  )
}

const OrderDateModal = ({ open, onClose, onSelect, selectedDiecutForOrderDate }: OrderDateModalProps) => {
  // State management
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allOrderData, setAllOrderData] = useState<OrderData[]>([])
  const [orderData, setOrderData] = useState<OrderData[]>([])
  const [selectedRow, setSelectedRow] = useState<OrderData | null>(null)

  // Custom date mode - using dayjs instead of Date
  const [isCustomDateMode, setIsCustomDateMode] = useState(false)
  const [customDueDate, setCustomDueDate] = useState<dayjs.Dayjs | null>(null)
  const [customOrderDate, setCustomOrderDate] = useState<dayjs.Dayjs | null>(null)

  // Saved data from database
  const [savedDateData, setSavedDateData] = useState<SavedDateData | null>(null)

  // UI states
  const [showTableSection, setShowTableSection] = useState(true)

  // Parse date from API with timezone adjustment (+7 hours)
  const parseDateFromAPI = useCallback((dateString: string | null): dayjs.Dayjs | null => {
    if (!dateString) return null

    try {
      return dayjs.utc(dateString).tz(TIMEZONE)
    } catch (error) {
      console.error('Error parsing date from API:', error)

      return null
    }
  }, [])

  const formatDateDisplay = useCallback((dateValue: string | dayjs.Dayjs | null): string => {
    if (!dateValue) return '-'

    try {
      if (typeof dateValue === 'string') {
        const adjustedDate = dayjs.utc(dateValue).tz(TIMEZONE)

        if (!adjustedDate || !adjustedDate.isValid()) return '-'

        return adjustedDate.format(DATE_DISPLAY_FORMAT)
      } else {
        const dayjsDate = dayjs(dateValue).tz(TIMEZONE)

        if (!dayjsDate || !dayjsDate.isValid()) return '-'

        return dayjsDate.format(DATE_DISPLAY_FORMAT)
      }
    } catch (error) {
      console.error('Error formatting date for display:', error)

      return '-'
    }
  }, [])

  const formatDateForAPI = useCallback((date: dayjs.Dayjs | null): string => {
    if (!date) return ''

    try {
      return date.tz(TIMEZONE).utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    } catch (error) {
      console.error('Error formatting date for API:', error)

      return ''
    }
  }, [])

  // Date validation logic
  const validateDates = useCallback(
    (
      dueDate: dayjs.Dayjs | null,
      orderDate: dayjs.Dayjs | null
    ): {
      isValid: boolean
      errorMessage: string
    } => {
      // If no dates provided, it's valid (optional dates)
      if (!dueDate && !orderDate) {
        return { isValid: true, errorMessage: '' }
      }

      // If only one date is provided, it's valid
      if (!dueDate || !orderDate) {
        return { isValid: true, errorMessage: '' }
      }

      // Check if both dates are valid
      if (!dueDate.isValid() || !orderDate.isValid()) {
        return { isValid: false, errorMessage: 'วันที่ไม่ถูกต้อง' }
      }

      // Check if order date is after due date
      if (orderDate.isAfter(dueDate, 'day')) {
        return { isValid: false, errorMessage: 'วันที่สั่งทำต้องไม่เกินวันที่ต้องการใช้' }
      }

      return { isValid: true, errorMessage: '' }
    },
    []
  )

  // Check if confirm button should be disabled
  const isConfirmDisabled = useMemo((): boolean => {
    if (isCustomDateMode) {
      // In custom date mode, validate the date constraint
      const validation = validateDates(customDueDate, customOrderDate)

      return !validation.isValid
    } else {
      // In table mode, must select a row
      return !selectedRow
    }
  }, [isCustomDateMode, customDueDate, customOrderDate, selectedRow, validateDates])

  // Get validation error message for custom dates
  const dateValidationError = useMemo(() => {
    if (!isCustomDateMode) return ''
    const validation = validateDates(customDueDate, customOrderDate)

    return validation.errorMessage
  }, [isCustomDateMode, customDueDate, customOrderDate, validateDates])

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
      // Use timezone-adjusted parsing for dates from API
      const savedDueDate = savedDateData.DUE_DATE ? parseDateFromAPI(savedDateData.DUE_DATE) : null
      const savedOrderDate = savedDateData.ORDER_DATE ? parseDateFromAPI(savedDateData.ORDER_DATE) : null

      const matchingRow = allOrderData.find(
        row => row.JOB_ID === savedDateData.JOB_ID && row.PROD_ID === savedDateData.PROD_ID
      )

      if (matchingRow) {
        setSelectedRow(matchingRow)
        setIsCustomDateMode(false)
      } else {
        setCustomDueDate(savedDueDate)
        setCustomOrderDate(savedOrderDate)
        setIsCustomDateMode(true)
        setShowTableSection(false)
      }
    } else if (allOrderData.length === 0 && !loading) {
      setIsCustomDateMode(true)
      setShowTableSection(false)
    }
  }, [savedDateData, allOrderData, loading, parseDateFromAPI])

  const fetchOrderData = async (): Promise<void> => {
    if (!selectedDiecutForOrderDate) return

    setLoading(true)

    try {
      const result: any = await apiClient.post('/api/diecuts/getjoborderlist', {
        diecutId: selectedDiecutForOrderDate.DIECUT_ID,
        DIECUT_TYPE: selectedDiecutForOrderDate.DIECUT_TYPE,
        DIECUT_SN: selectedDiecutForOrderDate.DIECUT_SN
      })

      if (result.success) {
        const data: OrderData[] = result.data.jobList || []
        const dateData: SavedDateData[] = result.data.dateList || []

        setAllOrderData(data)
        setOrderData(data)

        if (dateData.length > 0) {
          setSavedDateData(dateData[0])
        }
      } else {
        setAllOrderData([])
        setOrderData([])
        console.error('Failed to fetch order data:', result.message)
      }
    } catch (error) {
      console.error('Error fetching job orders:', error)
      setAllOrderData([])
      setOrderData([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((): void => {
    if (!searchQuery.trim()) {
      setOrderData(allOrderData)

      return
    }

    const filteredData = allOrderData.filter(row => {
      const query = searchQuery.toLowerCase().trim()

      return (
        (row.JOB_ID && row.JOB_ID.toLowerCase().includes(query)) ||
        (row.PROD_ID && row.PROD_ID.toLowerCase().includes(query)) ||
        (row.JOB_DESC && row.JOB_DESC.toLowerCase().includes(query))
      )
    })

    setOrderData(filteredData)
  }, [searchQuery, allOrderData])

  const handleRowClick = useCallback(
    (row: OrderData): void => {
      if (!isCustomDateMode) {
        setSelectedRow(row)
      }
    },
    [isCustomDateMode]
  )

  const handleSwitchToCustomDate = useCallback((): void => {
    setIsCustomDateMode(true)
    setSelectedRow(null)

    // If there was a selected row, pre-populate with its dates
    if (selectedRow) {
      setCustomDueDate(parseDateFromAPI(selectedRow.DATE_USING))
      setCustomOrderDate(parseDateFromAPI(selectedRow.ORDER_DATE))
    }
  }, [selectedRow, parseDateFromAPI])

  const handleSwitchToTable = useCallback((): void => {
    setIsCustomDateMode(false)
    setCustomDueDate(null)
    setCustomOrderDate(null)
    setShowTableSection(true)
  }, [])

  const handleCustomDateChange = useCallback(
    (field: 'due' | 'order') => (date: dayjs.Dayjs | null) => {
      if (field === 'due') {
        setCustomDueDate(date)

        // If order date is after new due date, clear it
        if (date && customOrderDate && customOrderDate.isAfter(date, 'day')) {
          setCustomOrderDate(null)
        }
      } else {
        setCustomOrderDate(date)
      }
    },
    [customOrderDate]
  )

  const handleConfirm = useCallback((): void => {
    let enrichedData: OrderData & { ORDER_DATE_TYPE: string }

    if (isCustomDateMode) {
      // Validate dates before confirming
      const validation = validateDates(customDueDate, customOrderDate)

      if (!validation.isValid) {
        return // Should not happen since button is disabled, but extra safety
      }

      // Custom date mode
      enrichedData = {
        JOB_ID: selectedDiecutForOrderDate?.JOB_ID || '',
        PROD_ID: selectedDiecutForOrderDate?.PROD_ID || '',
        PROD_DESC: selectedDiecutForOrderDate?.PROD_DESC || '',
        JOB_DESC: selectedDiecutForOrderDate?.JOB_DESC || '',
        REVISION: selectedDiecutForOrderDate?.REVISION || '',
        DATE_USING: formatDateForAPI(customDueDate),
        ORDER_DATE: formatDateForAPI(customOrderDate),
        ORDER_DATE_TYPE: 'MANUAL'
      }
    } else if (selectedRow) {
      // Table selection
      enrichedData = {
        ...selectedRow,
        ORDER_DATE_TYPE: 'MANUAL'
      }
    } else {
      return // Should not happen since button is disabled
    }

    onSelect(enrichedData)
    onClose()
  }, [
    isCustomDateMode,
    validateDates,
    customDueDate,
    customOrderDate,
    selectedDiecutForOrderDate,
    formatDateForAPI,
    selectedRow,
    onSelect,
    onClose
  ])

  const hasTableData = allOrderData.length > 0

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='th'>
      <Dialog open={open} onClose={onClose} maxWidth={MODAL_MAX_WIDTH} fullWidth>
        <DialogTitle>งานสั่งทำ {selectedDiecutForOrderDate && selectedDiecutForOrderDate.DIECUT_SN}</DialogTitle>

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
                  <TableContainer component={Paper} sx={{ height: TABLE_HEIGHT, mb: 2 }}>
                    <Table stickyHeader size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>
                            วันที่ต้องการใช้
                          </TableCell>
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
                              key={`${row.JOB_ID}-${row.PROD_ID}-${index}`}
                              onClick={() => handleRowClick(row)}
                              selected={selectedRow?.JOB_ID === row.JOB_ID && selectedRow?.PROD_ID === row.PROD_ID}
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
                              <TableCell>{row.SRC === 'LSD' ? 'L.S.D ปั๊ม' : 'Job Scheduling'}</TableCell>
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
                backgroundColor: 'rgba(152, 134, 123, 0.05)',
                mt: 10
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

              {/* Date validation error */}
              {dateValidationError && (
                <Alert severity='error' sx={{ mb: 2 }}>
                  {dateValidationError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <CustomDatePicker
                    label='วันที่ต้องการใช้'
                    value={customDueDate}
                    onChange={handleCustomDateChange('due')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <CustomDatePicker
                    label='วันที่สั่งทำ'
                    value={customOrderDate}
                    onChange={handleCustomDateChange('order')}
                    maxDate={customDueDate || undefined}
                    error={Boolean(dateValidationError)}
                    helperText={
                      customDueDate
                        ? 'วันที่สั่งทำต้องไม่เกินวันที่ต้องการใช้'
                        : 'ไม่จำเป็นต้องกรอก (สามารถเว้นว่างได้)'
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          )}
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
                disabled={isConfirmDisabled}
                variant='contained'
                sx={{
                  backgroundColor: '#98867B',
                  '&:hover': { backgroundColor: '#5A4D40' },
                  '&.Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    opacity: 0.7,
                    cursor: 'not-allowed'
                  }
                }}
                title={isConfirmDisabled && dateValidationError ? dateValidationError : undefined}
              >
                ตกลง
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default OrderDateModal
