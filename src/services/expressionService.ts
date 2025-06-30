import ApiClient from './apiClient'
import type {
  Expression,
  CreateExpressionRequest,
  UpdateExpressionRequest,
  ExpressionFilters,
  ApiResponse,
  ExpressionListResponse,
  ExpressionResponse,
  ExpressionStats
} from '../types/expression'

class ExpressionService {
  private readonly basePath = '/api/expressions'

  /**
   * Create a new expression
   */
  async createExpression(data: CreateExpressionRequest): Promise<ApiResponse<ExpressionResponse>> {
    try {
      const response = await ApiClient.post<ApiResponse<ExpressionResponse>>(
        this.basePath,
        data
      )
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get all expressions
   */
  async getAllExpressions(): Promise<ApiResponse<ExpressionListResponse>> {
    try {
      const response = await ApiClient.get<ApiResponse<ExpressionListResponse>>(
        this.basePath
      )
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get single expression by ID
   */
  async getExpression(id: string): Promise<ApiResponse<ExpressionResponse>> {
    try {
      const response = await ApiClient.get<ApiResponse<ExpressionResponse>>(
        `${this.basePath}/${id}`
      )
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Update expression
   */
  async updateExpression(id: string, data: Partial<CreateExpressionRequest>): Promise<ApiResponse<ExpressionResponse>> {
    try {
      const response = await ApiClient.put<ApiResponse<ExpressionResponse>>(
        `${this.basePath}/${id}`,
        data
      )
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Delete expression
   */
  async deleteExpression(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await ApiClient.delete<ApiResponse<null>>(
        `${this.basePath}/${id}`
      )
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get received expressions for a user
   */
  async getReceivedExpressions(
    empId: string,
    filters?: ExpressionFilters
  ): Promise<ApiResponse<ExpressionListResponse>> {
    try {
      const params = new URLSearchParams()

      if (filters?.timePeriod) params.append('timePeriod', filters.timePeriod)
      if (filters?.year) params.append('year', filters.year.toString())
      if (filters?.month !== undefined) params.append('month', filters.month.toString())

      const queryString = params.toString()
      const url = `${this.basePath}/received/${empId}${queryString ? `?${queryString}` : ''}`

      const response = await ApiClient.get<ApiResponse<ExpressionListResponse>>(url)
      
      // Debug: Log the response to see the actual data structure
      console.log('getReceivedExpressions response:', JSON.stringify(response, null, 2))
      
      // Transform the data to ensure all required fields are present
      if (response.success && response.data?.expressions) {
        response.data.expressions = response.data.expressions.map(expr => ({
          ...expr,
          // Ensure content fields are available with fallbacks
          EXP_DETAIL: expr.EXP_DETAIL || expr.content || 'No content available',
          EXP_SUBJECT: expr.EXP_SUBJECT || expr.subject || 'No subject',
          // Ensure date fields are properly formatted
          date: expr.date || expr.EXP_DATE_STR || new Date(expr.EXP_DATE).toISOString().split('T')[0],
          time: expr.time || new Date(expr.EXP_DATE).toTimeString().slice(0, 5),
          // Ensure other required fields
          content: expr.EXP_DETAIL || expr.content || 'No content available',
          subject: expr.EXP_SUBJECT || expr.subject || 'No subject'
        }))
      }
      
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get sent expressions for a user
   */
  async getSentExpressions(
    empId: string,
    filters?: ExpressionFilters
  ): Promise<ApiResponse<ExpressionListResponse>> {
    try {
      const params = new URLSearchParams()

      if (filters?.timePeriod) params.append('timePeriod', filters.timePeriod)
      if (filters?.year) params.append('year', filters.year.toString())
      if (filters?.month !== undefined) params.append('month', filters.month.toString())

      const queryString = params.toString()
      const url = `${this.basePath}/sent/${empId}${queryString ? `?${queryString}` : ''}`

      const response = await ApiClient.get<ApiResponse<ExpressionListResponse>>(url)
      
      // Debug: Log the response to see the actual data structure
      console.log('getSentExpressions response:', JSON.stringify(response, null, 2))
      
      // Transform the data to ensure all required fields are present
      if (response.success && response.data?.expressions) {
        response.data.expressions = response.data.expressions.map(expr => ({
          ...expr,
          // Ensure content fields are available with fallbacks
          EXP_DETAIL: expr.EXP_DETAIL || expr.content || 'No content available',
          EXP_SUBJECT: expr.EXP_SUBJECT || expr.subject || 'No subject',
          // Ensure date fields are properly formatted
          date: expr.date || expr.EXP_DATE_STR || new Date(expr.EXP_DATE).toISOString().split('T')[0],
          time: expr.time || new Date(expr.EXP_DATE).toTimeString().slice(0, 5),
          // Ensure other required fields
          content: expr.EXP_DETAIL || expr.content || 'No content available',
          subject: expr.EXP_SUBJECT || expr.subject || 'No subject'
        }))
      }
      
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Calculate stats from expressions array
   */
  calculateStats(expressions: Expression[]): ExpressionStats {
    return expressions.reduce((stats, expr) => {
      // Count by type
      if (expr.type === 'praise') stats.praise++
      if (expr.type === 'suggestion') stats.suggestions++

      // Count by visibility
      if (expr.isPublic === true) stats.public++
      if (expr.isPublic === false) stats.private++

      return stats
    }, {
      praise: 0,
      suggestions: 0,
      public: 0,
      private: 0
    })
  }

  /**
   * Filter expressions by time period
   */
  filterExpressionsByTime(
    expressions: Expression[],
    timePeriod: 'monthly' | 'yearly',
    currentYear: number,
    currentMonth?: number
  ): Expression[] {
    return expressions.filter(expr => {
      if (timePeriod === 'monthly') {
        return expr.year === currentYear && expr.month === currentMonth
      } else {
        return expr.year === currentYear
      }
    })
  }

  /**
   * Transform expression data for display
   */
  transformExpressionForDisplay(expr: Expression) {
    return {
      ...expr,
      content: expr.EXP_DETAIL,
      fullContent: expr.EXP_DETAIL,
      from: expr.CR_UID, // You might want to get actual employee name
      to: expr.EXP_TO,
      subject: expr.EXP_SUBJECT,
      tags: [], // You might want to extract tags from content or add a tags field
      department: '', // You might want to fetch this from employee data
      position: '' // You might want to fetch this from employee data
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message)
    }

    if (error.message) {
      return new Error(error.message)
    }

    return new Error('An unexpected error occurred')
  }
}

export default new ExpressionService()
