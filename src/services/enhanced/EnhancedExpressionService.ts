import { UserScopedBaseService } from './BaseService'
import type { PaginatedResponse, FilterDto, CacheOptions } from './BaseService'
import type {
  Expression,
  CreateExpressionRequest,
  ExpressionFilters,
  ExpressionStats
} from '../../types/expression'

interface ExpressionWithMetadata extends Expression {
  from?: string
  to?: string
  department?: string
  position?: string
  fullContent?: string
  content?: string
}

export class EnhancedExpressionService extends UserScopedBaseService<
  Expression,
  CreateExpressionRequest,
  Partial<CreateExpressionRequest>
> {
  protected basePath = '/api/expressions'
  protected cacheTag = 'expressions'

  // Specialized methods for expressions
  async getReceivedExpressions(
    empId: string,
    filters?: ExpressionFilters,
    options?: { cache?: boolean; refresh?: boolean }
  ): Promise<PaginatedResponse<Expression>> {
    const cacheOptions: CacheOptions = {
      enabled: options?.cache !== false,
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: [this.cacheTag, `${this.cacheTag}:received:${empId}`],
      key: `received-${empId}-${JSON.stringify(filters)}`
    }

    // Force refresh by invalidating cache
    if (options?.refresh) {
      this.apiClient.invalidateCache(cacheOptions.key!)
    }

    const queryString = this.buildQueryString(filters)
    const url = `${this.basePath}/received/${empId}${queryString}`

    const response = await this.apiClient.get<PaginatedResponse<Expression>>(url, cacheOptions)

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch received expressions')
    }

    // Transform and validate data
    const transformedData = {
      ...response.data,
      data: response.data.data.map(expr => this.transformExpressionData(expr))
    }

    return transformedData
  }

  async getSentExpressions(
    empId: string,
    filters?: ExpressionFilters,
    options?: { cache?: boolean; refresh?: boolean }
  ): Promise<PaginatedResponse<Expression>> {
    const cacheOptions: CacheOptions = {
      enabled: options?.cache !== false,
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: [this.cacheTag, `${this.cacheTag}:sent:${empId}`],
      key: `sent-${empId}-${JSON.stringify(filters)}`
    }

    // Force refresh by invalidating cache
    if (options?.refresh) {
      this.apiClient.invalidateCache(cacheOptions.key!)
    }

    const queryString = this.buildQueryString(filters)
    const url = `${this.basePath}/sent/${empId}${queryString}`

    const response = await this.apiClient.get<PaginatedResponse<Expression>>(url, cacheOptions)

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch sent expressions')
    }

    // Transform and validate data
    const transformedData = {
      ...response.data,
      data: response.data.data.map(expr => this.transformExpressionData(expr))
    }

    return transformedData
  }

  // Optimistic updates with rollback
  async createExpressionOptimistic(
    data: CreateExpressionRequest,
    empId: string
  ): Promise<Expression> {
    // Create optimistic expression
    const optimisticExpression: Expression = this.createOptimisticExpression(data, empId)
    
    // Update cache immediately for better UX
    const sentCacheKey = `sent-${empId}-${JSON.stringify({})}`
    const currentSentData = await this.getCachedData<PaginatedResponse<Expression>>(sentCacheKey)
    
    if (currentSentData) {
      const updatedData = {
        ...currentSentData,
        data: [optimisticExpression, ...currentSentData.data],
        meta: {
          ...currentSentData.meta,
          total: currentSentData.meta.total + 1
        }
      }

      this.setCacheData(sentCacheKey, updatedData, [this.cacheTag, `${this.cacheTag}:sent:${empId}`])
    }

    try {
      // Perform actual API call
      const response = await this.apiClient.post<Expression>(this.basePath, data, {
        tags: [this.cacheTag, `${this.cacheTag}:sent:${empId}`]
      })

      if (!response.success) {
        // Rollback optimistic update
        this.rollbackOptimisticUpdate(sentCacheKey, optimisticExpression.EXP_ID)
        throw new Error(response.message || 'Failed to create expression')
      }

      // Update cache with real data
      const realExpression = this.transformExpressionData(response.data)

      this.updateOptimisticWithReal(sentCacheKey, optimisticExpression.EXP_ID, realExpression)

      return realExpression
    } catch (error) {
      // Rollback optimistic update on error
      this.rollbackOptimisticUpdate(sentCacheKey, optimisticExpression.EXP_ID)
      throw error
    }
  }

  // Statistics calculation with caching
  async getExpressionStats(
    empId: string,
    filters?: ExpressionFilters,
    useCache: boolean = true
  ): Promise<ExpressionStats> {
    const cacheKey = `stats-${empId}-${JSON.stringify(filters)}`
    
    if (useCache) {
      const cachedStats = await this.getCachedData<ExpressionStats>(cacheKey)

      if (cachedStats) return cachedStats
    }

    // Fetch expressions and calculate stats
    const [received, sent] = await Promise.all([
      this.getReceivedExpressions(empId, filters, { cache: useCache }),
      this.getSentExpressions(empId, filters, { cache: useCache })
    ])

    const allExpressions = [...received.data, ...sent.data]
    const stats = this.calculateStats(allExpressions)

    // Cache stats for 2 minutes
    this.setCacheData(cacheKey, stats, [`${this.cacheTag}:stats:${empId}`], 2 * 60 * 1000)

    return stats
  }

  // Advanced filtering and search
  async searchExpressions(
    empId: string,
    query: string,
    filters?: ExpressionFilters & { type?: 'received' | 'sent' | 'all' }
  ): Promise<PaginatedResponse<Expression>> {
    const searchFilters = {
      ...filters,
      q: query
    }

    const cacheKey = `search-${empId}-${JSON.stringify(searchFilters)}`
    const url = `${this.basePath}/search/${empId}${this.buildQueryString(searchFilters)}`

    const response = await this.apiClient.get<PaginatedResponse<Expression>>(url, {
      cache: true,
      cacheTTL: 2 * 60 * 1000, // 2 minutes for search results
      tags: [this.cacheTag, `${this.cacheTag}:search:${empId}`],
      cacheKey
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to search expressions')
    }

    return {
      ...response.data,
      data: response.data.data.map(expr => this.transformExpressionData(expr))
    }
  }

  // Bulk operations with progress tracking
  async bulkUpdateExpressions(
    updates: Array<{ id: string; data: Partial<CreateExpressionRequest> }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Expression[]> {
    const results: Expression[] = []
    let completed = 0

    // Process in batches of 5 to avoid overwhelming the server
    const batchSize = 5

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      const batchResults = await this.batchUpdate(batch)

      results.push(...batchResults)
      
      completed += batch.length
      onProgress?.(completed, updates.length)
    }

    // Invalidate relevant caches
    const userIds = new Set<string>()

    updates.forEach(update => {
      // Extract user IDs from the updates for cache invalidation
      if (update.data.recipient) userIds.add(update.data.recipient)
    })

    userIds.forEach(userId => {
      this.invalidateUserCache(userId)
    })

    return results
  }

  // Real-time synchronization methods
  async syncWithServer(empId: string): Promise<void> {
    // Invalidate all user-related caches
    this.invalidateUserCache(empId)
    
    // Warm cache with fresh data
    await Promise.all([
      this.getReceivedExpressions(empId, undefined, { cache: true, refresh: true }),
      this.getSentExpressions(empId, undefined, { cache: true, refresh: true })
    ])
  }

  // Private helper methods
  private transformExpressionData(expr: Expression): Expression {
    return {
      ...expr,

      // Ensure content fields are available with fallbacks
      EXP_DETAIL: expr.EXP_DETAIL || 'No content available',
      EXP_SUBJECT: expr.EXP_SUBJECT || 'No subject',
      
      // Ensure date fields are properly formatted
      date: expr.date || new Date(expr.EXP_DATE).toISOString().split('T')[0],
      time: expr.time || new Date(expr.EXP_DATE).toTimeString().slice(0, 5),
      
      // Transform type field
      TYPE: this.mapExpressionType(expr.EXP_TYPE),
      
      // Ensure attachments array exists
      attachments: expr.attachments || [],
      
      // Add computed fields
      month: new Date(expr.EXP_DATE).getMonth(),
      year: new Date(expr.EXP_DATE).getFullYear()
    }
  }

  private mapExpressionType(type: string): 'praise' | 'suggestion' {
    return type === 'praise' ? 'praise' : 'suggestion'
  }

  private createOptimisticExpression(
    data: CreateExpressionRequest,
    empId: string
  ): Expression {
    const now = new Date()

    
return {
      EXP_ID: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      EXP_TYPE: data.type,
      EXP_KIND: data.privacy === 'public' ? 'X' : 'Y',
      EXP_DATE: now.toISOString(),
      EXP_TO: data.recipient,
      EXP_SUBJECT: data.subject,
      EXP_DETAIL: data.content,
      STATUS: data.status === 'published' ? 'T' : 'P',
      CR_DATE: now.toISOString(),
      CR_OID: '',
      CR_UID: empId,
      TYPE: data.type,
      ISPUBLIC: data.privacy === 'public' ? '1' : '0',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      month: now.getMonth(),
      year: now.getFullYear(),
      attachments: data.attachments || []
    }
  }

  private calculateStats(expressions: Expression[]): ExpressionStats {
    return expressions.reduce((stats, expr) => {
      if (expr.TYPE === 'praise') stats.praise++
      if (expr.TYPE === 'suggestion') stats.suggestions++
      if (expr.ISPUBLIC === '1') stats.public++
      if (expr.ISPUBLIC === '0') stats.private++
      
return stats
    }, {
      praise: 0,
      suggestions: 0,
      public: 0,
      private: 0
    })
  }

  private async getCachedData<T>(key: string): Promise<T | null> {
    // This would typically use the cache from apiClient
    // For now, we'll implement a simple cache check
    return null // Placeholder
  }

  private setCacheData<T>(
    key: string,
    data: T,
    tags: string[],
    ttl?: number
  ): void {
    // Implementation would set data in cache
    // Placeholder for now
  }

  private rollbackOptimisticUpdate(cacheKey: string, tempId: string): void {
    // Implementation would remove optimistic update from cache
    // Placeholder for now
  }

  private updateOptimisticWithReal(
    cacheKey: string,
    tempId: string,
    realData: Expression
  ): void {
    // Implementation would replace optimistic data with real data
    // Placeholder for now
  }
}

export default new EnhancedExpressionService()