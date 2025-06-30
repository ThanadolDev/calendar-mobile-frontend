import { renderHook, act } from '@testing-library/react'
import { useExpressions } from '../../src/hooks/useExpressions'
import expressionService from '../../src/services/expressionService'

// Mock the expression service
jest.mock('../../src/services/expressionService', () => ({
  getReceivedExpressions: jest.fn(),
  getSentExpressions: jest.fn(),
  createExpression: jest.fn(),
  updateExpression: jest.fn(),
  deleteExpression: jest.fn(),
  calculateStats: jest.fn(),
  filterExpressionsByTime: jest.fn()
}))

const mockExpressionService = expressionService as jest.Mocked<typeof expressionService>

describe('useExpressions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useExpressions())

    expect(result.current.expressions).toEqual([])
    expect(result.current.myExpressions).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.stats).toEqual({
      praise: 0,
      suggestions: 0,
      public: 0,
      private: 0
    })
  })

  it('should load received expressions successfully', async () => {
    const mockExpressions = [
      { EXP_ID: '1', EXP_DETAIL: 'Test content' }
    ]
    const mockStats = { praise: 1, suggestions: 0, public: 1, private: 0 }

    mockExpressionService.getReceivedExpressions.mockResolvedValue({
      success: true,
      data: { expressions: mockExpressions }
    } as any)

    mockExpressionService.calculateStats.mockReturnValue(mockStats)

    const { result } = renderHook(() => useExpressions())

    await act(async () => {
      await result.current.loadReceivedExpressions('DEV001')
    })

    expect(result.current.expressions).toEqual(mockExpressions)
    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should handle API errors gracefully', async () => {
    mockExpressionService.getReceivedExpressions.mockRejectedValue(
      new Error('API Error')
    )

    const { result } = renderHook(() => useExpressions())

    await act(async () => {
      await result.current.loadReceivedExpressions('DEV001')
    })

    expect(result.current.error).toBe('API Error')
    expect(result.current.loading).toBe(false)
  })

  it('should load sent expressions successfully', async () => {
    const mockExpressions = [
      { EXP_ID: '1', EXP_DETAIL: 'My expression' }
    ]

    mockExpressionService.getSentExpressions.mockResolvedValue({
      success: true,
      data: { expressions: mockExpressions }
    } as any)

    const { result } = renderHook(() => useExpressions())

    await act(async () => {
      await result.current.loadSentExpressions('DEV001')
    })

    expect(result.current.myExpressions).toEqual(mockExpressions)
  })

  it('should create expression and update state', async () => {
    const newExpression = { EXP_ID: '2', EXP_DETAIL: 'New expression' }

    mockExpressionService.createExpression.mockResolvedValue({
      success: true,
      data: { expression: newExpression }
    } as any)

    const { result } = renderHook(() => useExpressions())

    // Set initial state
    act(() => {
      result.current.myExpressions = [{ EXP_ID: '1', EXP_DETAIL: 'Old' } as any]
    })

    await act(async () => {
      await result.current.createExpression({
        type: 'praise',
        recipient: 'TEST001',
        content: 'New expression',
        privacy: 'public',
        status: 'published'
      })
    })

    expect(result.current.myExpressions[0]).toEqual(newExpression)
  })

  it('should auto-load data when empId changes', async () => {
    mockExpressionService.getReceivedExpressions.mockResolvedValue({
      success: true,
      data: { expressions: [] }
    } as any)

    mockExpressionService.getSentExpressions.mockResolvedValue({
      success: true,
      data: { expressions: [] }
    } as any)

    mockExpressionService.calculateStats.mockReturnValue({
      praise: 0,
      suggestions: 0,
      public: 0,
      private: 0
    })

    const { rerender } = renderHook(
      ({ empId }) => useExpressions(empId),
      { initialProps: { empId: undefined } }
    )

    expect(mockExpressionService.getReceivedExpressions).not.toHaveBeenCalled()

    rerender({ empId: 'DEV001' })

    // Wait for effects
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockExpressionService.getReceivedExpressions).toHaveBeenCalledWith('DEV001')
    expect(mockExpressionService.getSentExpressions).toHaveBeenCalledWith('DEV001')
  })
})