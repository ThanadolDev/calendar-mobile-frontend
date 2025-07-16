// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import { 
  Box, 
  Typography, 
  IconButton, 
  Card, 
  CardContent, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Chip,
  Stack,
  AppBar,
  Toolbar
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// Icon Imports
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Menu,
  Calendar,
  Mail
} from 'lucide-react'

// Date utilities
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, getYear, setYear, setMonth } from 'date-fns'

// Sample events data
const sampleEvents = [
  {
    id: 1,
    title: 'Team Meeting',
    start: new Date(2024, 6, 15, 10, 0), // July 15, 2024 10:00 AM
    end: new Date(2024, 6, 15, 11, 0),
    description: 'Weekly team sync meeting',
    calendar: 'Work'
  },
  {
    id: 2,
    title: 'Doctor Appointment',
    start: new Date(2024, 6, 20, 14, 30), // July 20, 2024 2:30 PM
    end: new Date(2024, 6, 20, 15, 30),
    description: 'Annual health checkup',
    calendar: 'Personal'
  }
]

type MobileCalendarProps = {
  events?: any[]
}

type ViewMode = 'calendar' | 'month' | 'year'

const MobileCalendar = ({ events = sampleEvents }: MobileCalendarProps) => {
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')

  // Hooks
  const theme = useTheme()

  // Get events for selected date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return isSameDay(eventDate, date)
    })
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const dayEvents = getEventsForDate(date)
    setSelectedEvents(dayEvents)
    if (dayEvents.length > 0) {
      setShowEventDialog(true)
    }
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

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
    if (viewMode === 'calendar') {
      setViewMode('month')
    } else if (viewMode === 'month') {
      setViewMode('year')
    }
  }

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(setMonth(currentDate, monthIndex))
    setViewMode('calendar')
  }

  const handleYearSelect = (year: number) => {
    setCurrentDate(setYear(currentDate, year))
    setViewMode('month')
  }

  // Get day style
  const getDayStyle = (date: Date) => {
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isToday = isSameDay(date, new Date())
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const hasEvents = getEventsForDate(date).length > 0

    return {
      position: 'relative',
      opacity: isCurrentMonth ? 1 : 0.3,
      backgroundColor: isToday ? '#FF6B6B' : isSelected ? '#000000' : 'transparent',
      color: isToday ? '#FFFFFF' : isSelected ? '#FFFFFF' : theme.palette.text.primary,
      fontWeight: isToday || isSelected ? 'bold' : 'normal',
      borderRadius: isToday || isSelected ? '50%' : '0',
      width: '40px',
      height: '40px',
      aspectRatio: '1'
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#F8F9FA',
      padding: 0
    }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ 
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderBottom: `1px solid #E0E0E0`
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(viewMode === 'month' || viewMode === 'year') && (
              <IconButton onClick={handleBackClick}>
                <ChevronLeft />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {viewMode === 'calendar' && `${getYear(currentDate)} BE`}
              {viewMode === 'month' && `${getYear(currentDate)} BE`}
              {viewMode === 'year' && 'Select Year'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton>
              <Menu />
            </IconButton>
            <IconButton>
              <Search />
            </IconButton>
            <IconButton>
              <Plus />
            </IconButton>
          </Box>
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            mt: 2
          }}>
            {['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
              <Button
                key={month}
                onClick={() => handleMonthSelect(index)}
                variant={index === currentDate.getMonth() ? 'contained' : 'outlined'}
                sx={{ py: 2 }}
              >
                {month}
              </Button>
            ))}
          </Box>
        )}

        {viewMode === 'year' && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            mt: 2
          }}>
            {Array.from({ length: 20 }, (_, i) => getYear(currentDate) - 10 + i).map((year) => (
              <Button
                key={year}
                onClick={() => handleYearSelect(year)}
                variant={year === getYear(currentDate) ? 'contained' : 'outlined'}
                sx={{ py: 2 }}
              >
                {year}
              </Button>
            ))}
          </Box>
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
                          width: '4px',
                          height: '4px',
                          backgroundColor: '#FF6B6B',
                          borderRadius: '50%',
                          position: 'absolute',
                          bottom: '6px'
                        }} />
                      )}
                    </Box>
                  )
                })}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* No Events Message */}
        <Box sx={{ 
          textAlign: 'center', 
          mt: 6,
          color: '#999999'
        }}>
          <Typography variant="h6">
            No Events
          </Typography>
        </Box>

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

      {/* Event Details Dialog */}
      <Dialog
        open={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Events for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
        </DialogTitle>
        <DialogContent>
          {selectedEvents.length === 0 ? (
            <Typography>No events for this date</Typography>
          ) : (
            <Stack spacing={2}>
              {selectedEvents.map((event, index) => (
                <Card key={index} elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                    </Typography>
                    {event.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {event.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={event.calendar || 'General'} 
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MobileCalendar