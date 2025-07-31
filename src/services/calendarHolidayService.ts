import apiClient from './apiClient'
import type {
  HolidayEvent,
  LeaveEvent,
  UnifiedCalendarDay,
  LeaveBalance,
  MonthCalendarData,
  CalendarApiResponse,
  ServiceResponse
} from '../types/calendar'

/**
 * Calendar Holiday Service
 * Handles API calls for holidays, leaves, and unified calendar data
 */
class CalendarHolidayService {
  private readonly baseUrl = '/api/calendar'

  /**
   * Get holidays for a specific year or date range
   */
  async getHolidays(params: {
    year: number
    startDate?: string
    endDate?: string
  }): Promise<ServiceResponse<{ holidays: HolidayEvent[], count: number }>> {
    try {
      const queryParams = new URLSearchParams({
        year: params.year.toString()
      })
      
      if (params.startDate) queryParams.set('startDate', params.startDate)
      if (params.endDate) queryParams.set('endDate', params.endDate)

      const response = await apiClient.get<CalendarApiResponse<{ 
        holidays: any[], 
        count: number,
        year: number,
        dateRange: { start: string, end: string }
      }>>(
        `${this.baseUrl}/holidays?${queryParams.toString()}`
      )

      // Transform backend data to frontend format
      const holidays: HolidayEvent[] = response.data.holidays.map(holiday => ({
        id: holiday.id,
        date: holiday.date,
        title: holiday.title,
        type: holiday.type,
        category: holiday.category,
        isRecurring: holiday.isRecurring,
        dayName: holiday.dayName,
        isAllDay: holiday.isAllDay,
        color: holiday.color
      }))

      return {
        success: true,
        data: {
          holidays,
          count: response.data.count
        },
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get employee leave events for calendar display
   */
  async getLeaveEvents(params: {
    year: number
    startDate?: string
    endDate?: string
    employeeId?: string
  }): Promise<ServiceResponse<{ leaves: LeaveEvent[], count: number }>> {
    try {
      const queryParams = new URLSearchParams({
        year: params.year.toString()
      })
      
      if (params.startDate) queryParams.set('startDate', params.startDate)
      if (params.endDate) queryParams.set('endDate', params.endDate)
      if (params.employeeId) queryParams.set('employeeId', params.employeeId)

      const response = await apiClient.get<CalendarApiResponse<{
        leaves: any[],
        count: number,
        employeeFilter: string
      }>>(
        `${this.baseUrl}/leaves?${queryParams.toString()}`
      )

      // Transform backend data to frontend format
      const leaves: LeaveEvent[] = response.data.leaves.map(leave => ({
        id: leave.id,
        leaveId: leave.leaveId,
        employeeId: leave.employeeId,
        employeeName: leave.employeeName,
        date: leave.date,
        startDate: leave.startDate,
        endDate: leave.endDate,
        startTime: leave.startTime,
        endTime: leave.endTime,
        duration: leave.duration,
        leaveType: leave.leaveType,
        medicalStatus: leave.medicalStatus,
        approvalStatus: leave.approvalStatus,
        color: leave.color,
        isAllDay: leave.isAllDay,
        type: leave.type
      }))

      return {
        success: true,
        data: {
          leaves,
          count: response.data.count
        },
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get unified calendar view with holidays, leaves, and events
   */
  async getUnifiedCalendar(params: {
    startDate: string
    endDate: string
    userId?: string
  }): Promise<ServiceResponse<{ 
    calendar: UnifiedCalendarDay[], 
    summary: {
      totalDays: number
      weekends: number
      holidays: number
      daysWithEvents: number
    }
  }>> {
    try {
      const queryParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate
      })
      
      if (params.userId) queryParams.set('userId', params.userId)

      const response = await apiClient.get<CalendarApiResponse<{
        calendar: any[],
        summary: any
      }>>(
        `${this.baseUrl}/unified?${queryParams.toString()}`
      )

      // Transform backend data to frontend format
      const calendar: UnifiedCalendarDay[] = response.data.calendar.map(day => ({
        date: day.date,
        dayName: day.dayName,
        isWeekend: day.isWeekend,
        isHoliday: day.isHoliday,
        eventsSummary: day.eventsSummary,
        counts: {
          holidays: day.counts.holidays,
          leaves: day.counts.leaves,
          events: day.counts.events,
          total: day.counts.total
        },
        hasEvents: day.hasEvents
      }))

      return {
        success: true,
        data: {
          calendar,
          summary: response.data.summary
        },
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get employee leave balance with holiday impact
   */
  async getLeaveBalance(
    employeeId: string,
    year?: number
  ): Promise<ServiceResponse<LeaveBalance>> {
    try {
      const queryParams = new URLSearchParams()

      if (year) queryParams.set('year', year.toString())

      const response = await apiClient.get<CalendarApiResponse<any>>(
        `${this.baseUrl}/leave-balance/${employeeId}?${queryParams.toString()}`
      )

      // Transform backend data to frontend format
      const leaveBalance: LeaveBalance = {
        employeeId: response.data.employeeId,
        employeeName: response.data.employeeName,
        employmentStart: response.data.employmentStart,
        year: response.data.year,
        leaveTypes: {
          holiday: {
            entitlement: response.data.leaveTypes.holiday.entitlement,
            used: response.data.leaveTypes.holiday.used,
            remaining: response.data.leaveTypes.holiday.remaining,
            utilizationRate: response.data.leaveTypes.holiday.utilizationRate
          },
          sick: {
            entitlement: response.data.leaveTypes.sick.entitlement,
            used: response.data.leaveTypes.sick.used,
            remaining: response.data.leaveTypes.sick.remaining,
            utilizationRate: response.data.leaveTypes.sick.utilizationRate
          },
          business: {
            entitlement: response.data.leaveTypes.business.entitlement,
            used: response.data.leaveTypes.business.used,
            remaining: response.data.leaveTypes.business.remaining,
            utilizationRate: response.data.leaveTypes.business.utilizationRate
          }
        },
        holidayImpact: {
          workingDaysLost: response.data.holidayImpact.workingDaysLost,
          description: response.data.holidayImpact.description
        }
      }

      return {
        success: true,
        data: leaveBalance,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get month calendar data with holidays and leaves (mobile optimized)
   */
  async getMonthCalendar(params: {
    year: number
    month: number
    includeLeaves?: boolean
    includeHolidays?: boolean
  }): Promise<ServiceResponse<MonthCalendarData>> {
    try {
      const queryParams = new URLSearchParams()

      if (params.includeLeaves !== undefined) {
        queryParams.set('includeLeaves', params.includeLeaves.toString())
      }

      if (params.includeHolidays !== undefined) {
        queryParams.set('includeHolidays', params.includeHolidays.toString())
      }

      const response = await apiClient.get<CalendarApiResponse<any>>(
        `${this.baseUrl}/month/${params.year}/${params.month}?${queryParams.toString()}`
      )

      // Transform backend data to frontend format
      const monthCalendarData: MonthCalendarData = {
        year: response.data.year,
        month: response.data.month,
        monthName: response.data.monthName,
        holidays: response.data.holidays?.map((h: any) => ({
          date: h.date,
          title: h.title,
          type: h.type,
          color: h.color
        })) || [],
        leaves: response.data.leaves?.map((l: any) => ({
          date: l.date,
          employeeName: l.employeeName,
          leaveType: l.leaveType,
          duration: l.duration,
          color: l.color,
          type: l.type
        })) || [],
        summary: {
          holidayCount: response.data.summary.holidayCount,
          leaveCount: response.data.summary.leaveCount
        }
      }

      return {
        success: true,
        data: monthCalendarData,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get calendar events for mobile calendar component
   * Combines holidays and leaves for a specific date range
   */
  async getMobileCalendarEvents(params: {
    startDate: string
    endDate: string
    employeeId?: string
  }): Promise<ServiceResponse<{
    events: Array<HolidayEvent | LeaveEvent>
    holidays: HolidayEvent[]
    leaves: LeaveEvent[]
  }>> {
    try {
      // Get year from start date for API calls
      const year = new Date(params.startDate).getFullYear()

      // Fetch holidays and leaves in parallel
      const [holidaysResult, leavesResult] = await Promise.all([
        this.getHolidays({
          year,
          startDate: params.startDate,
          endDate: params.endDate
        }),
        this.getLeaveEvents({
          year,
          startDate: params.startDate,
          endDate: params.endDate,
          employeeId: params.employeeId
        })
      ])

      if (!holidaysResult.success) {
        return holidaysResult as any
      }

      if (!leavesResult.success) {
        return leavesResult as any
      }

      // Combine events
      const events = [
        ...holidaysResult.data.holidays,
        ...leavesResult.data.leaves
      ]

      return {
        success: true,
        data: {
          events,
          holidays: holidaysResult.data.holidays,
          leaves: leavesResult.data.leaves
        },
        message: 'Mobile calendar events retrieved successfully'
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Check if a specific date is a holiday or non-work day
   */
  async isHoliday(date: string): Promise<ServiceResponse<{
    isHoliday: boolean
    holidayInfo?: HolidayEvent
  }>> {
    try {
      const year = new Date(date).getFullYear()
      
      const result = await this.getHolidays({
        year,
        startDate: date,
        endDate: date
      })

      if (!result.success) {
        return result as any
      }

      const holidayInfo = result.data.holidays.find(h => h.date === date)

      return {
        success: true,
        data: {
          isHoliday: !!holidayInfo,
          holidayInfo
        },
        message: 'Holiday check completed'
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any): ServiceResponse<any> {
    console.error('Calendar Holiday API Error:', error)

    let errorMessage = 'An unexpected error occurred'
    let status = 500

    if (error.response) {
      // Server responded with error status
      status = error.response.status
      errorMessage = error.response.data?.message || error.response.statusText || errorMessage
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error - please check your connection'
      status = 0
    } else {
      // Other error
      errorMessage = error.message || errorMessage
    }

    return {
      success: false,
      error: {
        message: errorMessage,
        status,
        code: error.code
      },
      message: errorMessage
    }
  }
}

// Export singleton instance
export default new CalendarHolidayService()