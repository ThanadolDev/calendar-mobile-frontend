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
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

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

const MobileCalendar = ({ events = sampleEvents }: MobileCalendarProps) => {
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<any[]>([])

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

  // Get day style
  const getDayStyle = (date: Date) => {
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isToday = isSameDay(date, new Date())
    const hasEvents = getEventsForDate(date).length > 0

    return {
      opacity: isCurrentMonth ? 1 : 0.3,
      backgroundColor: isToday ? '#FF6B6B' : 'transparent',
      color: isToday ? '#FFFFFF' : theme.palette.text.primary,
      fontWeight: isToday ? 'bold' : 'normal',
      border: hasEvents ? `2px solid #FF6B6B` : 'none',
      borderRadius: isToday ? '50%' : hasEvents ? '8px' : '0'
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
            <IconButton>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              2569 BE
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
        {/* Month Navigation */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <IconButton onClick={goToPreviousMonth} sx={{ p: 1 }}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000000' }}>
            {format(currentDate, 'MMMM')}
          </Typography>
          <IconButton onClick={goToNextMonth} sx={{ p: 1 }}>
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Calendar Grid */}
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
              {calendarDays.map((date, index) => (
                <Box
                  key={index}
                  onClick={() => handleDateClick(date)}
                  sx={{
                    ...getDayStyle(date),
                    textAlign: 'center',
                    py: 2,
                    cursor: 'pointer',
                    minHeight: '48px',
                    display: 'flex',
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
                  {format(date, 'd')}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

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
        <Box sx={{ 
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
        </Box>
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