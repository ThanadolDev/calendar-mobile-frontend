import apiClient from './apiClient'
import type {
  CalendarEvent,
  CreateEventRequest,
  UpdateEventRequest,
  EventQueryOptions,
  StatsQueryOptions,
  CalendarApiResponse,
  EventsResponse,
  MonthlyEventsResponse,
  TodayEventsResponse,
  UpcomingEventsResponse,
  StatsResponse,
  ServiceResponse,
  CalendarApiError
} from '../types/calendar'

class CalendarService {
  private readonly baseUrl = '/api/calendar'

  /**
   * Create a new calendar event
   */
  async createEvent(eventData: CreateEventRequest): Promise<ServiceResponse<CalendarEvent>> {
    try {
      const response = await apiClient.post<CalendarApiResponse<{ event: CalendarEvent }>>(
        `${this.baseUrl}/events`,
        eventData
      )

      return {
        success: true,
        data: response.data.event,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get events by date range or other filters
   */
  async getEvents(options: EventQueryOptions = {}): Promise<ServiceResponse<EventsResponse>> {
    try {
      const queryParams = new URLSearchParams()
      
      if (options.startDate) queryParams.set('startDate', options.startDate)
      if (options.endDate) queryParams.set('endDate', options.endDate)
      if (options.category) queryParams.set('category', options.category)
      if (options.status) queryParams.set('status', options.status)
      if (options.limit) queryParams.set('limit', options.limit.toString())

      const response = await apiClient.get<CalendarApiResponse<EventsResponse>>(
        `${this.baseUrl}/events?${queryParams.toString()}`
      )

      return {
        success: true,
        data: response.data,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get events for a specific month
   */
  async getEventsByMonth(year: number, month: number): Promise<ServiceResponse<MonthlyEventsResponse>> {
    try {
      const response = await apiClient.get<CalendarApiResponse<MonthlyEventsResponse>>(
        `${this.baseUrl}/events/month/${year}/${month}`
      )

      return {
        success: true,
        data: response.data,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get a single event by ID
   */
  async getEvent(id: number): Promise<ServiceResponse<CalendarEvent>> {
    try {
      const response = await apiClient.get<CalendarApiResponse<{ event: CalendarEvent }>>(
        `${this.baseUrl}/events/${id}`
      )

      return {
        success: true,
        data: response.data.event,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: number, eventData: UpdateEventRequest): Promise<ServiceResponse<CalendarEvent>> {
    try {
      const response = await apiClient.put<CalendarApiResponse<{ event: CalendarEvent }>>(
        `${this.baseUrl}/events/${id}`,
        eventData
      )

      return {
        success: true,
        data: response.data.event,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: number): Promise<ServiceResponse<null>> {
    try {
      const response = await apiClient.delete<CalendarApiResponse<null>>(
        `${this.baseUrl}/events/${id}`
      )

      return {
        success: true,
        data: null,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get today's events
   */
  async getTodayEvents(): Promise<ServiceResponse<TodayEventsResponse>> {
    try {
      const response = await apiClient.get<CalendarApiResponse<TodayEventsResponse>>(
        `${this.baseUrl}/events/today`
      )

      return {
        success: true,
        data: response.data,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get upcoming events (next 7 days by default)
   */
  async getUpcomingEvents(days: number = 7): Promise<ServiceResponse<UpcomingEventsResponse>> {
    try {
      const response = await apiClient.get<CalendarApiResponse<UpcomingEventsResponse>>(
        `${this.baseUrl}/events/upcoming?days=${days}`
      )

      return {
        success: true,
        data: response.data,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get calendar statistics for a user
   */
  async getStats(options: StatsQueryOptions = {}): Promise<ServiceResponse<StatsResponse>> {
    try {
      const queryParams = new URLSearchParams()
      
      if (options.year) queryParams.set('year', options.year.toString())
      if (options.month) queryParams.set('month', options.month.toString())

      const response = await apiClient.get<CalendarApiResponse<StatsResponse>>(
        `${this.baseUrl}/stats?${queryParams.toString()}`
      )

      return {
        success: true,
        data: response.data,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Get events for current week
   */
  async getWeekEvents(date: Date = new Date()): Promise<ServiceResponse<EventsResponse>> {
    const startOfWeek = new Date(date)

    startOfWeek.setDate(date.getDate() - date.getDay()) // Go to Sunday
    
    const endOfWeek = new Date(startOfWeek)

    endOfWeek.setDate(startOfWeek.getDate() + 6) // Go to Saturday

    return this.getEvents({
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0]
    })
  }

  /**
   * Get events for a specific date
   */
  async getDateEvents(date: Date): Promise<ServiceResponse<EventsResponse>> {
    const dateString = date.toISOString().split('T')[0]
    
    return this.getEvents({
      startDate: dateString,
      endDate: dateString
    })
  }

  /**
   * Search events by title or description
   */
  async searchEvents(query: string, options: EventQueryOptions = {}): Promise<ServiceResponse<EventsResponse>> {
    try {
      // Note: This assumes your backend supports text search
      // You may need to implement this endpoint in your backend
      const queryParams = new URLSearchParams({ q: query })
      
      if (options.startDate) queryParams.set('startDate', options.startDate)
      if (options.endDate) queryParams.set('endDate', options.endDate)
      if (options.category) queryParams.set('category', options.category)
      if (options.status) queryParams.set('status', options.status)
      if (options.limit) queryParams.set('limit', options.limit.toString())

      const response = await apiClient.get<CalendarApiResponse<EventsResponse>>(
        `${this.baseUrl}/events/search?${queryParams.toString()}`
      )

      return {
        success: true,
        data: response.data,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Utility: Format date for API consumption
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Utility: Format time for API consumption
   */
  static formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5) // HH:MM format
  }

  /**
   * Utility: Create Date object from API date/time strings
   */
  static parseDateTime(dateString: string, timeString?: string): Date {
    if (timeString) {
      return new Date(`${dateString}T${timeString}:00`)
    }

    
return new Date(dateString)
  }

  /**
   * Utility: Check if event is today
   */
  static isToday(event: CalendarEvent): boolean {
    const today = new Date().toISOString().split('T')[0]

    
return event.startDate === today
  }

  /**
   * Utility: Check if event is upcoming (within next 7 days)
   */
  static isUpcoming(event: CalendarEvent, days: number = 7): boolean {
    const today = new Date()
    const futureDate = new Date()

    futureDate.setDate(today.getDate() + days)
    
    const eventDate = new Date(event.startDate)

    
return eventDate >= today && eventDate <= futureDate
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any): ServiceResponse<any> {
    console.error('Calendar API Error:', error)

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

    const apiError: CalendarApiError = {
      message: errorMessage,
      status,
      code: error.code
    }

    return {
      success: false,
      error: apiError,
      message: errorMessage
    }
  }
}

// Export singleton instance
export default new CalendarService()