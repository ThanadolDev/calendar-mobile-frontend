import { useState, useEffect, useCallback } from 'react'
import calendarService from '../services/calendarService'
import type {
  CalendarEvent,
  CreateEventRequest,
  UpdateEventRequest,
  EventQueryOptions,
  StatsQueryOptions,
  CalendarStats,
  EventsResponse,
  CalendarApiError
} from '../types/calendar'

interface UseCalendarState {
  events: CalendarEvent[]
  stats: CalendarStats | null
  loading: boolean
  createLoading: boolean
  error: string | null
}

interface UseCalendarReturn extends UseCalendarState {
  // Event management
  createEvent: (eventData: CreateEventRequest) => Promise<CalendarEvent | null>
  updateEvent: (id: number, eventData: UpdateEventRequest) => Promise<CalendarEvent | null>
  deleteEvent: (id: number) => Promise<boolean>
  
  // Data fetching
  loadEvents: (options?: EventQueryOptions) => Promise<void>
  loadEventsByMonth: (year: number, month: number) => Promise<void>
  loadTodayEvents: () => Promise<void>
  loadUpcomingEvents: (days?: number) => Promise<void>
  loadStats: (options?: StatsQueryOptions) => Promise<void>
  
  // Utilities
  refreshEvents: () => Promise<void>
  clearError: () => void
  getEventById: (id: number) => CalendarEvent | null
}

export const useCalendar = (): UseCalendarReturn => {
  const [state, setState] = useState<UseCalendarState>({
    events: [],
    stats: null,
    loading: false,
    createLoading: false,
    error: null
  })

  const [lastQuery, setLastQuery] = useState<EventQueryOptions | null>(null)

  // Error handling utility
  const handleError = useCallback((error: CalendarApiError | string) => {
    const errorMessage = typeof error === 'string' ? error : error.message
    setState(prev => ({ ...prev, error: errorMessage, loading: false, createLoading: false }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Create new event
  const createEvent = useCallback(async (eventData: CreateEventRequest): Promise<CalendarEvent | null> => {
    setState(prev => ({ ...prev, createLoading: true, error: null }))

    try {
      const result = await calendarService.createEvent(eventData)
      
      if (result.success && result.data) {
        // Add new event to current events list
        setState(prev => ({
          ...prev,
          events: [...prev.events, result.data!],
          createLoading: false
        }))
        return result.data
      } else {
        handleError(result.error || result.message || 'Failed to create event')
        return null
      }
    } catch (error) {
      handleError(error as CalendarApiError)
      return null
    }
  }, [handleError])

  // Update existing event
  const updateEvent = useCallback(async (id: number, eventData: UpdateEventRequest): Promise<CalendarEvent | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await calendarService.updateEvent(id, eventData)
      
      if (result.success && result.data) {
        // Update event in current events list
        setState(prev => ({
          ...prev,
          events: prev.events.map(event => 
            event.id === id ? result.data! : event
          ),
          loading: false
        }))
        return result.data
      } else {
        handleError(result.error || result.message || 'Failed to update event')
        return null
      }
    } catch (error) {
      handleError(error as CalendarApiError)
      return null
    }
  }, [handleError])

  // Delete event
  const deleteEvent = useCallback(async (id: number): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await calendarService.deleteEvent(id)
      
      if (result.success) {
        // Remove event from current events list
        setState(prev => ({
          ...prev,
          events: prev.events.filter(event => event.id !== id),
          loading: false
        }))
        return true
      } else {
        handleError(result.error || result.message || 'Failed to delete event')
        return false
      }
    } catch (error) {
      handleError(error as CalendarApiError)
      return false
    }
  }, [handleError])

  // Load events with options
  const loadEvents = useCallback(async (options: EventQueryOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    setLastQuery(options)

    try {
      const result = await calendarService.getEvents(options)
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          events: result.data!.events,
          loading: false
        }))
      } else {
        handleError(result.error || result.message || 'Failed to load events')
      }
    } catch (error) {
      handleError(error as CalendarApiError)
    }
  }, [handleError])

  // Load events by month
  const loadEventsByMonth = useCallback(async (year: number, month: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    setLastQuery({ startDate: `${year}-${month.toString().padStart(2, '0')}-01` })

    try {
      const result = await calendarService.getEventsByMonth(year, month)
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          events: result.data!.events,
          loading: false
        }))
      } else {
        handleError(result.error || result.message || 'Failed to load monthly events')
      }
    } catch (error) {
      handleError(error as CalendarApiError)
    }
  }, [handleError])

  // Load today's events
  const loadTodayEvents = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    const today = new Date().toISOString().split('T')[0]
    setLastQuery({ startDate: today, endDate: today })

    try {
      const result = await calendarService.getTodayEvents()
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          events: result.data!.events,
          loading: false
        }))
      } else {
        handleError(result.error || result.message || 'Failed to load today\'s events')
      }
    } catch (error) {
      handleError(error as CalendarApiError)
    }
  }, [handleError])

  // Load upcoming events
  const loadUpcomingEvents = useCallback(async (days: number = 7) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    setLastQuery({ limit: 20 })

    try {
      const result = await calendarService.getUpcomingEvents(days)
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          events: result.data!.events,
          loading: false
        }))
      } else {
        handleError(result.error || result.message || 'Failed to load upcoming events')
      }
    } catch (error) {
      handleError(error as CalendarApiError)
    }
  }, [handleError])

  // Load statistics
  const loadStats = useCallback(async (options: StatsQueryOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await calendarService.getStats(options)
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          stats: result.data!.stats,
          loading: false
        }))
      } else {
        handleError(result.error || result.message || 'Failed to load statistics')
      }
    } catch (error) {
      handleError(error as CalendarApiError)
    }
  }, [handleError])

  // Refresh current events
  const refreshEvents = useCallback(async () => {
    if (lastQuery) {
      await loadEvents(lastQuery)
    } else {
      await loadEvents()
    }
  }, [loadEvents, lastQuery])

  // Get event by ID from current events
  const getEventById = useCallback((id: number): CalendarEvent | null => {
    return state.events.find(event => event.id === id) || null
  }, [state.events])

  return {
    // State
    events: state.events,
    stats: state.stats,
    loading: state.loading,
    createLoading: state.createLoading,
    error: state.error,

    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
    loadEventsByMonth,
    loadTodayEvents,
    loadUpcomingEvents,
    loadStats,
    refreshEvents,
    clearError,
    getEventById
  }
}

export default useCalendar