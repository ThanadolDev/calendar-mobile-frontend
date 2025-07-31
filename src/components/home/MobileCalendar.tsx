// React Imports
import { useState, useEffect, useRef, useCallback } from 'react'

// MUI Imports
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// Icon Imports
import {
  ChevronLeft
} from 'lucide-react'

// Date utilities
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, getYear, setYear, setMonth } from 'date-fns'

// Custom hooks
import { useCalendarData } from '../../hooks/useCalendarData'

// Types
import type { HolidayEvent, LeaveEvent } from '../../types/calendar'

type MobileCalendarProps = {
  events?: Array<HolidayEvent | LeaveEvent>
  employeeId?: string
}

type ViewMode = 'calendar' | 'month' | 'year'

// Year Picker Component
const YearPicker = ({ currentYear, onYearSelect }: { currentYear: number, onYearSelect: (year: number) => void }) => {
  const yearListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to selected year when component mounts
    if (yearListRef.current) {
      const selectedElement = yearListRef.current.querySelector(`[data-year="${currentYear}"]`)


      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [currentYear])

  const years = Array.from({ length: 26 }, (_, i) => currentYear - 20 + i)

  return (
    <Box sx={{
      mt: 3,
      px: 2
    }}>
      {/* Current Year Display */}
      <Box sx={{
        textAlign: 'center',
        mb: 4,
        py: 3,
        backgroundColor: '#F8F9FA',
        borderRadius: '16px',
        border: '1px solid #E0E0E0'
      }}>
        <Typography variant="h4" sx={{
          fontWeight: 'bold',
          color: '#FF6B6B',
          mb: 1
        }}>
          {currentYear}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666666' }}>
          ปีปัจจุบัน
        </Typography>
      </Box>

      {/* Year List */}
      <Box
        ref={yearListRef}
        sx={{
          maxHeight: '400px',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#F5F5F5',
            borderRadius: '2px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#CCCCCC',
            borderRadius: '2px',
            '&:hover': {
              backgroundColor: '#999999'
            }
          }
        }}
      >
        {years.map((year) => (
          <Box
            key={year}
            data-year={year}
            onClick={() => onYearSelect(year)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 2.5,
              px: 3,
              mb: 0.5,
              cursor: 'pointer',
              backgroundColor: year === currentYear ? '#FF6B6B' : 'transparent',
              color: year === currentYear ? '#FFFFFF' : '#000000',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              borderLeft: year === currentYear ? '4px solid #FFFFFF' : '4px solid transparent',
              '&:hover': {
                backgroundColor: year === currentYear ? '#FF6B6B' : '#F5F5F5',
                transform: 'translateX(4px)'
              },
              '&:active': {
                transform: 'scale(0.98)'
              }
            }}
          >
            <Typography variant="h6" sx={{
              fontWeight: year === currentYear ? 'bold' : 'medium',
              fontSize: '1.1rem'
            }}>
              {year}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const MobileCalendar = ({ employeeId }: MobileCalendarProps) => {
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedEvents, setSelectedEvents] = useState<Array<HolidayEvent | LeaveEvent>>([])
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')

  // Hooks
  const theme = useTheme()

  const { events, holidays, loading, error } = useCalendarData({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    employeeId
  })

  // Safe date parsing utility
  const parseDateSafely = useCallback((dateStr: string): Date | null => {
    if (!dateStr) return null
    
    // Handle DD/MM/YYYY format common in the API
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')

      if (day && month && year) {
        const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        
        return isNaN(parsedDate.getTime()) ? null : parsedDate
      }
    }
    
    // Handle ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
    if (dateStr.includes('T') || dateStr.includes('-')) {
      const parsedDate = new Date(dateStr)
      
      return isNaN(parsedDate.getTime()) ? null : parsedDate
    }
    
    // Fallback: try direct parsing
    const parsedDate = new Date(dateStr)
    
    return isNaN(parsedDate.getTime()) ? null : parsedDate
  }, [])

  // Helper function to check if date is holiday
  const isHolidayDate = useCallback((date: Date, holidayList: HolidayEvent[] = []): boolean => {
    return holidayList.some(holiday => {
      if (!holiday.date) return false
      
      const holidayDate = parseDateSafely(holiday.date)
      
      return holidayDate && isSameDay(holidayDate, date)
    })
  }, [parseDateSafely])

  // Get events for selected date
  const getEventsForDate = useCallback((date: Date) => {
    if (!events || events.length === 0) return []

    return events.filter(event => {
      // First try the date field
      if (event.date) {
        const eventDate = parseDateSafely(event.date)
        
        if (eventDate && isSameDay(eventDate, date)) {
          return true
        }
      }
      
      // For leave events, also check startDate field as fallback
      if (event.type === 'leave' && (event as LeaveEvent).startDate) {
        const startDate = parseDateSafely((event as LeaveEvent).startDate)
        
        if (startDate && isSameDay(startDate, date)) {
          return true
        }
      }
      
      return false
    })
  }, [events, parseDateSafely])

  // Re-fetch events when currentDate changes
  useEffect(() => {
    if (events) {
      const todayEvents = getEventsForDate(new Date())

      setSelectedEvents(todayEvents)
      
      // Debug: Log events data to console
      if (process.env.NODE_ENV === 'development') {
        console.log('Calendar Events:', events)
        console.log('Today Events:', todayEvents)
      }
    }
  }, [currentDate, events, getEventsForDate])

  // Handle date click
  const handleDateClick = (date: Date) => {
    // Prevent unselecting the same date
    if (selectedDate && isSameDay(date, selectedDate)) {
      return
    }

    setSelectedDate(date)
    const dayEvents = getEventsForDate(date)
    
    // Debug: Log date matching
    if (process.env.NODE_ENV === 'development') {
      console.log('Clicked date:', date.toDateString())
      console.log('Day events found:', dayEvents)
      console.log('All events:', events)
    }

    setSelectedEvents(dayEvents)
  }

  // Navigation functions (removed unused functions)

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const days = []
    let day = calendarStart

    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // Navigation handlers
  const handleBackClick = () => {
    if (viewMode === 'month') {
      setViewMode('calendar')
    } else if (viewMode === 'year') {
      setViewMode('month')
    }
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(currentDate, monthIndex)

    setCurrentDate(newDate)

    // Check if it's current month/year, if so select today, otherwise unselect
    const today = new Date()
    const isCurrentMonth = newDate.getMonth() === today.getMonth() && newDate.getFullYear() === today.getFullYear()

    if (isCurrentMonth) {
      setSelectedDate(today)
      setSelectedEvents(getEventsForDate(today))
    } else {
      setSelectedDate(null)
      setSelectedEvents([])
    }

    setViewMode('calendar')
  }

  const handleYearSelect = (year: number) => {
    const newDate = setYear(currentDate, year)

    setCurrentDate(newDate)

    // Check if it's current year, if so select today, otherwise unselect
    const today = new Date()
    const isCurrentYear = newDate.getFullYear() === today.getFullYear()

    if (isCurrentYear) {
      setSelectedDate(today)
      setSelectedEvents(getEventsForDate(today))
    } else {
      setSelectedDate(null)
      setSelectedEvents([])
    }

    setViewMode('month')
  }

  // Get day style
  const getDayStyle = (date: Date) => {
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isToday = isSameDay(date, new Date())
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const isHoliday = isHolidayDate(date, holidays || [])
    const hasEvents = getEventsForDate(date).length > 0

    return {
      position: 'relative',
      opacity: isCurrentMonth ? 1 : 0.3,
      backgroundColor: isToday ? '#FF6B6B' : isSelected ? '#000000' : hasEvents ? '#E3F2FD' : 'transparent',
      color: isToday ? '#FFFFFF' : isSelected ? '#FFFFFF' : hasEvents ? '#1976D2' : theme.palette.text.primary,
      fontWeight: isToday || isSelected || hasEvents ? 'bold' : 'normal',
      borderRadius: isToday || isSelected ? '50%' : '8px',
      width: '44px',
      height: '44px',
      aspectRatio: '1',
      border: isHoliday ? '2px solid #FFCDD2' : hasEvents ? '1px solid #2196F3' : 'none'
    }
  }

  // Show loading state
  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#FF6B6B', mb: 2 }} />
          <Typography>กำลังโหลดข้อมูลปฏิทิน...</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#F8F9FA',
      padding: 0
    }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          เกิดข้อผิดพลาด: {error}
        </Alert>
      )}

      {/* Header */}
      <></>
      <AppBar position="static" elevation={0} sx={{
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderBottom: `1px solid #E0E0E0`
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleBackClick}
              size="medium"
              sx={{ minWidth: '44px', minHeight: '44px' }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', cursor: viewMode === 'calendar' ? 'pointer' : 'default' }}
              onClick={viewMode === 'calendar' ? () => setViewMode('month') : undefined}
            >
              {viewMode === 'calendar' && `${getYear(currentDate)} BE`}
              {viewMode === 'month' && `${getYear(currentDate)} BE`}
              {viewMode === 'year' && 'Select Year'}
            </Typography>
          </Box>
          {/* <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton>
              <Menu />
            </IconButton>
            <IconButton>
              <Search />
            </IconButton>
            <IconButton>
              <Plus />
            </IconButton>
          </Box> */}
        </Toolbar>
      </AppBar>

      {/* Calendar Container */}
      <Box sx={{ padding: 2 }}>
        {viewMode === 'calendar' && (
          <>
            {/* Month Display */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000000' }}>
                {format(currentDate, 'MMMM')}
              </Typography>
            </Box>
          </>
        )}

        {viewMode === 'month' && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 3,
            mt: 3,
            px: 2
          }}>
            {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
              'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((month, index) => (
              <Card
                key={month}
                elevation={index === currentDate.getMonth() ? 4 : 1}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: index === currentDate.getMonth() ? '#FF6B6B' : '#FFFFFF',
                  color: index === currentDate.getMonth() ? '#FFFFFF' : '#000000',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    elevation: 6,
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => handleMonthSelect(index)}
              >
                <CardContent sx={{
                  py: 3,
                  textAlign: 'center',
                  '&:last-child': { pb: 3 }
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {month}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: index === currentDate.getMonth() ? '#FFFFFF' : '#666666',

                      mt: 0.5,
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewMode('calendar')
                    }}
                  >
                    {getYear(currentDate)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {viewMode === 'year' && (
          <YearPicker
            currentYear={getYear(currentDate)}
            onYearSelect={handleYearSelect}
          />
        )}

        {viewMode === 'calendar' && (
          <Card elevation={0} sx={{
            backgroundColor: 'transparent',
            border: 'none'
          }}>
            <CardContent sx={{ p: 0 }}>
              {/* Day Headers */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                mb: 2
              }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Box key={index} sx={{
                    textAlign: 'center',
                    py: 1,
                    color: '#666666',
                    fontSize: '0.875rem',
                    fontWeight: 'medium'
                  }}>
                    {day}
                  </Box>
                ))}
              </Box>

              {/* Calendar Days */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1
              }}>
                {calendarDays.map((date, index) => {
                  const hasEvents = getEventsForDate(date).length > 0

                  return (
                    <Box
                      key={index}
                      onClick={() => handleDateClick(date)}
                      sx={{
                        ...getDayStyle(date),
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#F0F0F0',
                          borderRadius: '8px'
                        }
                      }}
                    >
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                      }}>
                        {format(date, 'd')}
                      </Box>
                      {hasEvents && (
                        <Box sx={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#2196F3',
                          borderRadius: '50%',
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px'
                        }} />
                      )}
                    </Box>
                  )
                })}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Events Display */}
        {viewMode === 'calendar' && (
          <Box sx={{ mt: 4 }}>
            {selectedDate && selectedEvents.length > 0 ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#000000' }}>
                  รายการกิจกรรมวันที่ {format(selectedDate, 'd MMMM yyyy')}
                </Typography>
                <Stack spacing={2}>
                  {selectedEvents.map((event, index) => (
                    <Card key={index} elevation={2} sx={{ backgroundColor: '#FFFFFF' }}>
                      <CardContent sx={{ p: 3 }}>
                        {event.type === 'leave' ? (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000' }}>
                                {(event as LeaveEvent).employeeName}
                              </Typography>
                              <Chip
                                label={(event as LeaveEvent).leaveType}
                                size="small"
                                sx={{
                                  backgroundColor: (event as LeaveEvent).leaveType === 'ลาป่วย' ? '#FFE5E5' :
                                                   (event as LeaveEvent).leaveType === 'ลาพักร้อน' ? '#E5F3FF' :
                                                   (event as LeaveEvent).leaveType === 'ลากิจ' ? '#FFF5E5' : '#E8F5E8',
                                  color: (event as LeaveEvent).leaveType === 'ลาป่วย' ? '#D32F2F' :
                                         (event as LeaveEvent).leaveType === 'ลาพักร้อน' ? '#1976D2' :
                                         (event as LeaveEvent).leaveType === 'ลากิจ' ? '#F57C00' : '#388E3C',
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>ระยะเวลา:</strong> {(event as LeaveEvent).duration} วัน
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>แผนก:</strong> {(event as LeaveEvent).unitDesc || 'ไม่ระบุ'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>รหัสพนักงาน:</strong> {(event as LeaveEvent).employeeId}
                            </Typography>
                            {(event as LeaveEvent).startTime && (event as LeaveEvent).endTime && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>เวลา:</strong> {(event as LeaveEvent).startTime} - {(event as LeaveEvent).endTime} น.
                              </Typography>
                            )}
                          </>
                        ) : (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000' }}>
                                {(event as HolidayEvent).title}
                              </Typography>
                              <Chip
                                label="วันหยุด"
                                size="small"
                                sx={{
                                  backgroundColor: '#FFF3E0',
                                  color: '#F57C00',
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>ประเภท:</strong> {(event as HolidayEvent).category}
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            ) : selectedDate ? (
              <Box sx={{ textAlign: 'center', mt: 6, color: '#999999' }}>
                <Typography variant="h6">
                  ไม่มีรายการกิจกรรมในวันที่ {format(selectedDate, 'd MMMM yyyy')}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', mt: 6, color: '#999999' }}>
                <Typography variant="h6">
                  เลือกวันที่เพื่อดูรายการกิจกรรม
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Bottom Navigation */}
        {/* <Box sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTop: `1px solid #E0E0E0`,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          py: 2
        }}>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            Today
          </Typography>
          <IconButton>
            <Calendar />
          </IconButton>
          <IconButton>
            <Mail />
          </IconButton>
        </Box> */}
      </Box>

    </Box>
  )
}

export default MobileCalendar
