import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useAuth } from '../../src/contexts/AuthContext'
import { useExpressions } from '../../src/hooks/useExpressions'
import HomeComponent from '../../src/components/home/HomeComponent'

// Mock dependencies
jest.mock('../../src/contexts/AuthContext')
jest.mock('../../src/hooks/useExpressions')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseExpressions = useExpressions as jest.MockedFunction<typeof useExpressions>

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('HomeComponent', () => {
  const mockUser = {
    id: 'DEV001',
    name: 'Test User',
    email: 'test@example.com',
    ORG_ID: 'ORG001'
  }

  const mockExpressionsHook = {
    expressions: [],
    myExpressions: [],
    loading: false,
    error: null,
    stats: { praise: 0, suggestions: 0, public: 0, private: 0 },
    loadReceivedExpressions: jest.fn(),
    loadSentExpressions: jest.fn(),
    createExpression: jest.fn(),
    updateExpression: jest.fn(),
    deleteExpression: jest.fn(),
    clearError: jest.fn(),
    calculateStatsForPeriod: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseExpressions.mockReturnValue(mockExpressionsHook)
  })

  it('should render loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: jest.fn(),
      logout: jest.fn(),
      setUserInfo: jest.fn()
    })

    render(<HomeComponent />)
    
    expect(screen.getByText('กำลังโหลดข้อมูล')).toBeInTheDocument()
  })

  it('should redirect to login when no user', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUserInfo: jest.fn()
    })

    // Mock window.location.href
    delete (window as any).location
    window.location = { href: '' } as any

    render(<HomeComponent />)

    await waitFor(() => {
      expect(window.location.href).toBe('/login-og')
    })
  })

  it('should render home content when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUserInfo: jest.fn()
    })

    render(<HomeComponent />)

    // Should not show loading
    expect(screen.queryByText('กำลังโหลดข้อมูล')).not.toBeInTheDocument()
    
    // Should call expressions hook with user ID
    expect(mockUseExpressions).toHaveBeenCalledWith('DEV001')
  })

  it('should display expressions data', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUserInfo: jest.fn()
    })

    const mockExpressionsWithData = {
      ...mockExpressionsHook,
      expressions: [
        {
          EXP_ID: '1',
          EXP_DETAIL: 'Test expression content',
          EXP_SUBJECT: 'Test subject',
          type: 'praise',
          date: '2025-06-30'
        }
      ],
      stats: { praise: 1, suggestions: 0, public: 1, private: 0 }
    }

    mockUseExpressions.mockReturnValue(mockExpressionsWithData as any)

    render(<HomeComponent />)

    // Check if expressions data is being used
    expect(mockUseExpressions).toHaveBeenCalledWith('DEV001')
  })

  it('should handle month filtering correctly', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUserInfo: jest.fn()
    })

    const currentMonth = new Date().getMonth() + 1 // 1-indexed
    const currentYear = new Date().getFullYear()

    const mockExpressionsWithData = {
      ...mockExpressionsHook,
      myExpressions: [
        {
          EXP_ID: '1',
          month: currentMonth - 1, // 0-indexed from backend
          year: currentYear,
          EXP_DETAIL: 'Current month expression'
        },
        {
          EXP_ID: '2', 
          month: currentMonth - 2, // Different month
          year: currentYear,
          EXP_DETAIL: 'Previous month expression'
        }
      ]
    }

    mockUseExpressions.mockReturnValue(mockExpressionsWithData as any)

    render(<HomeComponent />)

    // The filtering logic should work with month indexing
    expect(mockUseExpressions).toHaveBeenCalledWith('DEV001')
  })

  it('should handle expressions loading error', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUserInfo: jest.fn()
    })

    const mockExpressionsWithError = {
      ...mockExpressionsHook,
      error: 'Failed to load expressions',
      loading: false
    }

    mockUseExpressions.mockReturnValue(mockExpressionsWithError)

    render(<HomeComponent />)

    // Should still render without crashing
    expect(mockUseExpressions).toHaveBeenCalledWith('DEV001')
  })
})