
import { useState, useEffect } from 'react'


import calendarHolidayService from '../services/calendarHolidayService'
import type { LeaveEvent, HolidayEvent } from '../types/calendar'

interface CalendarData {
  events: Array<HolidayEvent | LeaveEvent>
  leaves: LeaveEvent[]
  holidays: HolidayEvent[]
  loading: boolean
  error: string | null
}

interface UseCalendarDataProps {
  year: number
  month: number
  employeeId?: string
}

export const useCalendarData = ({ year, month, employeeId }: UseCalendarDataProps): CalendarData => {
  const [leaves, setLeaves] = useState<LeaveEvent[]>([])
  const [holidays, setHolidays] = useState<HolidayEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Validate input parameters
        if (!year || !month || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
          setError('Invalid year or month parameters')

          return
        }

        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0)


        // Validate date objects
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          setError('Invalid date calculation')

          return
        }

        // Format dates as DD/MM/YYYY for backend API (as expected by the calendar service)
        const formatDateForApi = (date: Date): string => {
          const day = date.getDate().toString().padStart(2, '0')
          const month = (date.getMonth() + 1).toString().padStart(2, '0')
          const year = date.getFullYear()

          return `${day}/${month}/${year}`
        }

        const startDateStr = formatDateForApi(startDate)
        const endDateStr = formatDateForApi(endDate)

        // Validate formatted dates
        if (!startDateStr || !endDateStr) {
          setError('Failed to format dates for API')

          return
        }

        // Fetch data from the mobile calendar endpoint
        const result = await calendarHolidayService.getMobileCalendarEvents({
          startDate: startDateStr,
          endDate: endDateStr,
          employeeId: employeeId || undefined
        })

        if (result.success && result.data) {
          setLeaves(result.data.leaves)
          setHolidays(result.data.holidays)

          // Debug logging
          if (process.env.NODE_ENV === 'development') {
            console.log('useCalendarData - Received data:', {
              leaves: result.data.leaves,
              holidays: result.data.holidays,
              year,
              month,
              employeeId
            })
          }
        } else {
          setError(result.message || 'Failed to fetch calendar data')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'

        setError(errorMessage)

        // Log detailed error in development only
        if (process.env.NODE_ENV === 'development') {
          console.error('useCalendarData error:', {
            error: err,
            year,
            month,
            employeeId
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCalendarData()
  }, [year, month, employeeId])

  // Combine events for backward compatibility
  const events = [...holidays, ...leaves]

  return {
    events,
    leaves,
    holidays,
    loading,
    error
  }
}
