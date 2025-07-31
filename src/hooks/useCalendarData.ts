import { useState, useEffect } from 'react'
import calendarHolidayService from '../services/calendarHolidayService'
import type { LeaveEvent, HolidayEvent } from '../types/calendar'

interface CalendarData {
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
        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0)
        
        // Format dates as DD/MM/YYYY for backend API (as expected by the calendar service)
        const formatDateForApi = (date: Date): string => {
          const day = date.getDate().toString().padStart(2, '0')
          const month = (date.getMonth() + 1).toString().padStart(2, '0')
          const year = date.getFullYear()
          return `${day}/${month}/${year}`
        }
        
        const startDateStr = formatDateForApi(startDate)
        const endDateStr = formatDateForApi(endDate)

        // Fetch data from the mobile calendar endpoint
        const result = await calendarHolidayService.getMobileCalendarEvents({
          startDate: startDateStr,
          endDate: endDateStr,
          employeeId
        })

        if (result.success && result.data) {
          setLeaves(result.data.leaves)
          setHolidays(result.data.holidays)
        } else {
          setError(result.message || 'Failed to fetch calendar data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCalendarData()
  }, [year, month, employeeId])

  return {
    leaves,
    holidays,
    loading,
    error
  }
}