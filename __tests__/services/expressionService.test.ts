import expressionService from '../../src/services/expressionService'
import ApiClient from '../../src/services/apiClient'

// Mock ApiClient
jest.mock('../../src/services/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}))

const mockApiClient = ApiClient as jest.Mocked<typeof ApiClient>

describe('ExpressionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getReceivedExpressions', () => {
    it('should transform data with missing fields', async () => {
      const mockResponse = {
        success: true,
        data: {
          expressions: [
            {
              EXP_ID: '1',
              EXP_DATE: '2025-06-30T10:00:00',
              // Missing EXP_DETAIL and EXP_SUBJECT
              CR_UID: 'USER001'
            }
          ]
        }
      }

      mockApiClient.get.mockResolvedValue(mockResponse)

      const result = await expressionService.getReceivedExpressions('DEV001')

      expect(result.data.expressions[0]).toEqual(
        expect.objectContaining({
          EXP_DETAIL: 'No content available',
          EXP_SUBJECT: 'No subject',
          content: 'No content available',
          subject: 'No subject'
        })
      )
    })

    it('should preserve existing content fields', async () => {
      const mockResponse = {
        success: true,
        data: {
          expressions: [
            {
              EXP_ID: '1',
              EXP_DETAIL: 'Existing content',
              EXP_SUBJECT: 'Existing subject',
              EXP_DATE: '2025-06-30T10:00:00'
            }
          ]
        }
      }

      mockApiClient.get.mockResolvedValue(mockResponse)

      const result = await expressionService.getReceivedExpressions('DEV001')

      expect(result.data.expressions[0]).toEqual(
        expect.objectContaining({
          EXP_DETAIL: 'Existing content',
          EXP_SUBJECT: 'Existing subject',
          content: 'Existing content',
          subject: 'Existing subject'
        })
      )
    })
  })

  describe('getSentExpressions', () => {
    it('should transform data with missing fields', async () => {
      const mockResponse = {
        success: true,
        data: {
          expressions: [
            {
              EXP_ID: '1',
              EXP_DATE: '2025-06-30T10:00:00'
              // Missing EXP_DETAIL and EXP_SUBJECT
            }
          ]
        }
      }

      mockApiClient.get.mockResolvedValue(mockResponse)

      const result = await expressionService.getSentExpressions('DEV001')

      expect(result.data.expressions[0]).toEqual(
        expect.objectContaining({
          EXP_DETAIL: 'No content available',
          EXP_SUBJECT: 'No subject',
          content: 'No content available',
          subject: 'No subject'
        })
      )
    })
  })

  describe('createExpression', () => {
    it('should create expression successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          expression: {
            EXP_ID: '1',
            EXP_DETAIL: 'Test content'
          }
        }
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      const data = {
        type: 'praise' as const,
        recipient: 'TEST001',
        content: 'Test content',
        privacy: 'public' as const,
        status: 'published' as const
      }

      const result = await expressionService.createExpression(data)

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/expressions', data)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('calculateStats', () => {
    it('should calculate expression statistics correctly', () => {
      const expressions = [
        { type: 'praise', isPublic: true },
        { type: 'praise', isPublic: false },
        { type: 'suggestion', isPublic: true },
        { type: 'suggestion', isPublic: false }
      ] as any[]

      const stats = expressionService.calculateStats(expressions)

      expect(stats).toEqual({
        praise: 2,
        suggestions: 2,
        public: 2,
        private: 2
      })
    })
  })

  describe('filterExpressionsByTime', () => {
    const expressions = [
      { year: 2025, month: 5 }, // June (0-indexed)
      { year: 2025, month: 4 }, // May
      { year: 2024, month: 5 }  // June 2024
    ] as any[]

    it('should filter by monthly correctly', () => {
      const filtered = expressionService.filterExpressionsByTime(
        expressions,
        'monthly',
        2025,
        5 // June (0-indexed)
      )

      expect(filtered).toHaveLength(1)
      expect(filtered[0]).toEqual({ year: 2025, month: 5 })
    })

    it('should filter by yearly correctly', () => {
      const filtered = expressionService.filterExpressionsByTime(
        expressions,
        'yearly',
        2025
      )

      expect(filtered).toHaveLength(2)
      expect(filtered.every(exp => exp.year === 2025)).toBe(true)
    })
  })
})