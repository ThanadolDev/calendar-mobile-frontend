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

// ============================================================================
// Holiday & Non-Work Day Types
// ============================================================================

export interface HolidayEvent {
  id: string
  date: string // DD/MM/YYYY format
  title: string
  type: 'holiday'
  category: 'holiday' | 'weekend' | 'non_work'
  isRecurring: boolean
  dayName: string
  isAllDay: boolean
  color: string
}

export interface LeaveEvent {
  id: string
  leaveId: number
  employeeId: string
  employeeName: string
  unitId?: string
  unitDesc?: string
  date: string // DD/MM/YYYY format
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  duration: number
  leaveType: string
  medicalStatus?: string
  approvalStatus: 'approved' | 'pending' | 'rejected'
  color: string
  isAllDay: boolean
  type: 'leave'
}

export interface UnifiedCalendarDay {
  date: string // DD/MM/YYYY format
  dayName: string
  isWeekend: boolean
  isHoliday: boolean
  eventsSummary?: string
  counts: {
    holidays: number
    leaves: number
    events: number
    total: number
  }
  hasEvents: boolean
}

export interface LeaveBalance {
  employeeId: string
  employeeName: string
  employmentStart: string
  year: number
  leaveTypes: {
    holiday: LeaveTypeBalance
    sick: LeaveTypeBalance
    business: LeaveTypeBalance
  }
  holidayImpact: {
    workingDaysLost: number
    description: string
  }
}

export interface LeaveTypeBalance {
  entitlement: number
  used: number
  remaining: number
  utilizationRate: number
}

export interface MonthCalendarData {
  year: number
  month: number
  monthName: string
  holidays: Array<{
    date: string
    title: string
    type: string
    color: string
  }>
  leaves: Array<{
    date: string
    employeeName: string
    leaveType: string
    duration: number
    color: string
    type: string
  }>
  summary: {
    holidayCount: number
    leaveCount: number
  }
}

// Mobile Calendar Event Union Type
export type MobileCalendarEvent = HolidayEvent | LeaveEvent | CalendarEvent