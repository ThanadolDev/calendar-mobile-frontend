// Calendar Event Types
export interface CalendarEvent {
  id: number
  title: string
  description?: string
  startDate: string // YYYY-MM-DD format
  endDate: string   // YYYY-MM-DD format
  startTime?: string // HH:MM format
  endTime?: string   // HH:MM format
  isAllDay: boolean
  recurrence?: RecurrencePattern
  location?: string
  attendees: string[]
  category: EventCategory
  priority: EventPriority
  status: EventStatus
  createdBy: string
  createdDate: string
  updatedDate?: string
}

// Request types for creating/updating events
export interface CreateEventRequest {
  title: string
  description?: string
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  isAllDay?: boolean
  recurrence?: RecurrencePattern
  location?: string
  attendees?: string[]
  category?: EventCategory
  priority?: EventPriority
  status?: EventStatus
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  // All fields are optional for updates
}

// Enums
export type EventCategory = 
  | 'general' 
  | 'meeting' 
  | 'task' 
  | 'event' 
  | 'reminder' 
  | 'appointment'

export type EventPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent'

export type EventStatus = 
  | 'confirmed' 
  | 'pending' 
  | 'cancelled' 
  | 'completed'

export type RecurrencePattern = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'yearly'

// API Response types
export interface CalendarApiResponse<T = any> {
  success: boolean
  message: string
  data: T
}

export interface EventsResponse {
  events: CalendarEvent[]
  count: number
}

export interface MonthlyEventsResponse extends EventsResponse {
  year: number
  month: number
}

export interface TodayEventsResponse extends EventsResponse {
  date: string
}

export interface UpcomingEventsResponse extends EventsResponse {
  dateRange: {
    start: string
    end: string
  }
}

export interface CalendarStats {
  totalEvents: number
  confirmedEvents: number
  pendingEvents: number
  cancelledEvents: number
  meetings: number
  tasks: number
  events: number
}

export interface StatsResponse {
  stats: CalendarStats
}

// Query options
export interface EventQueryOptions {
  startDate?: string
  endDate?: string
  category?: EventCategory
  status?: EventStatus
  limit?: number
}

export interface StatsQueryOptions {
  year?: number
  month?: number
}

// UI-specific types
export interface CalendarViewMode {
  type: 'month' | 'week' | 'day' | 'list'
  date: Date
}

export interface EventFormData extends CreateEventRequest {
  // Additional UI-specific fields can be added here
}

// Error types
export interface CalendarApiError {
  message: string
  status?: number
  code?: string
}

// Service response wrapper
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: CalendarApiError
}