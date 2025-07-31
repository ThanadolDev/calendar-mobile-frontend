import { EnhancedApiClient } from './EnhancedApiClient'

// Generic types for base service
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface FilterDto {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  [key: string]: any
}

interface CacheOptions {
  enabled?: boolean
  ttl?: number
  tags?: string[]
  key?: string
}

export abstract class BaseService<T, CreateDto, UpdateDto> {
  protected abstract basePath: string
  protected apiClient = EnhancedApiClient.getInstance()
  protected abstract cacheTag: string

  // CRUD Operations
  async findAll(filters?: FilterDto, cacheOptions?: CacheOptions): Promise<PaginatedResponse<T>> {
    const queryString = this.buildQueryString(filters)
    const url = `${this.basePath}${queryString}`
    
    const options = {
      cache: cacheOptions?.enabled !== false,
      cacheTTL: cacheOptions?.ttl,
      tags: cacheOptions?.tags || [this.cacheTag],
      cacheKey: cacheOptions?.key || `${this.basePath}:findAll:${queryString}`
    }

    const response = await this.apiClient.get<PaginatedResponse<T>>(url, options)
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch data')
    }
    
    return response.data
  }

  async findById(id: string, cacheOptions?: CacheOptions): Promise<T> {
    const url = `${this.basePath}/${id}`
    
    const options = {
      cache: cacheOptions?.enabled !== false,
      cacheTTL: cacheOptions?.ttl,
      tags: cacheOptions?.tags || [this.cacheTag, `${this.cacheTag}:${id}`],
      cacheKey: cacheOptions?.key || `${this.basePath}:findById:${id}`
    }

    const response = await this.apiClient.get<T>(url, options)
    
    if (!response.success) {
      throw new Error(response.message || `Failed to fetch ${this.basePath} with id ${id}`)
    }
    
    return response.data
  }

  async create(data: CreateDto): Promise<T> {
    const response = await this.apiClient.post<T>(this.basePath, data, {
      tags: [this.cacheTag] // Invalidate related cache
    })
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create data')
    }
    
    return response.data
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    const response = await this.apiClient.put<T>(`${this.basePath}/${id}`, data, {
      tags: [this.cacheTag, `${this.cacheTag}:${id}`] // Invalidate related cache
    })
    
    if (!response.success) {
      throw new Error(response.message || `Failed to update ${this.basePath} with id ${id}`)
    }
    
    return response.data
  }

  async delete(id: string): Promise<void> {
    const response = await this.apiClient.delete<void>(`${this.basePath}/${id}`, {
      tags: [this.cacheTag, `${this.cacheTag}:${id}`] // Invalidate related cache
    })
    
    if (!response.success) {
      throw new Error(response.message || `Failed to delete ${this.basePath} with id ${id}`)
    }
  }

  // Batch operations
  async batchCreate(items: CreateDto[]): Promise<T[]> {
    const requests = items.map(item => ({
      method: 'POST' as const,
      url: this.basePath,
      data: item,
      options: { tags: [this.cacheTag] }
    }))

    const responses = await this.apiClient.batch<T>(requests)
    
    return responses.map(response => {
      if (!response.success) {
        throw new Error(response.message || 'Failed to create batch data')
      }

      
return response.data
    })
  }

  async batchUpdate(updates: Array<{ id: string; data: UpdateDto }>): Promise<T[]> {
    const requests = updates.map(update => ({
      method: 'PUT' as const,
      url: `${this.basePath}/${update.id}`,
      data: update.data,
      options: { tags: [this.cacheTag, `${this.cacheTag}:${update.id}`] }
    }))

    const responses = await this.apiClient.batch<T>(requests)
    
    return responses.map(response => {
      if (!response.success) {
        throw new Error(response.message || 'Failed to update batch data')
      }

      
return response.data
    })
  }

  async batchDelete(ids: string[]): Promise<void> {
    const requests = ids.map(id => ({
      method: 'DELETE' as const,
      url: `${this.basePath}/${id}`,
      options: { tags: [this.cacheTag, `${this.cacheTag}:${id}`] }
    }))

    const responses = await this.apiClient.batch<void>(requests)
    
    responses.forEach(response => {
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete batch data')
      }
    })
  }

  // Cache management
  protected invalidateCache(pattern?: string): void {
    if (pattern) {
      this.apiClient.invalidateCache(pattern)
    } else {
      this.apiClient.invalidateCacheByTags([this.cacheTag])
    }
  }

  protected warmCache(keys: string[]): Promise<void[]> {
    const promises = keys.map(async (key) => {
      try {
        await this.findById(key, { enabled: true })
      } catch (error) {
        // Ignore errors during cache warming
        console.warn(`Failed to warm cache for key ${key}:`, error)
      }
    })
    
    return Promise.all(promises)
  }

  // Utility methods
  protected buildQueryString(filters?: FilterDto): string {
    if (!filters || Object.keys(filters).length === 0) return ''
    
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(`${key}[]`, String(v)))
        } else {
          params.append(key, String(value))
        }
      }
    })
    
    const queryString = params.toString()

    
return queryString ? `?${queryString}` : ''
  }

  protected transformData(data: any): T {
    // Override in subclasses for data transformation
    return data
  }

  protected validateData(data: any): boolean {
    // Override in subclasses for data validation
    return true
  }

  // Statistics and monitoring
  getServiceStats() {
    return {
      serviceName: this.constructor.name,
      basePath: this.basePath,
      cacheTag: this.cacheTag,
      ...this.apiClient.getRequestStats()
    }
  }
}

// Specialized base service for services with user-specific data
export abstract class UserScopedBaseService<T, CreateDto, UpdateDto> extends BaseService<T, CreateDto, UpdateDto> {
  // User-specific operations
  async findByUserId(userId: string, filters?: FilterDto, cacheOptions?: CacheOptions): Promise<PaginatedResponse<T>> {
    const queryString = this.buildQueryString(filters)
    const url = `${this.basePath}/user/${userId}${queryString}`
    
    const options = {
      cache: cacheOptions?.enabled !== false,
      cacheTTL: cacheOptions?.ttl,
      tags: cacheOptions?.tags || [this.cacheTag, `${this.cacheTag}:user:${userId}`],
      cacheKey: cacheOptions?.key || `${this.basePath}:findByUserId:${userId}:${queryString}`
    }

    const response = await this.apiClient.get<PaginatedResponse<T>>(url, options)
    
    if (!response.success) {
      throw new Error(response.message || `Failed to fetch ${this.basePath} for user ${userId}`)
    }
    
    return response.data
  }

  async createForUser(userId: string, data: CreateDto): Promise<T> {
    const response = await this.apiClient.post<T>(`${this.basePath}/user/${userId}`, data, {
      tags: [this.cacheTag, `${this.cacheTag}:user:${userId}`]
    })
    
    if (!response.success) {
      throw new Error(response.message || `Failed to create ${this.basePath} for user ${userId}`)
    }
    
    return response.data
  }

  // Override cache invalidation to include user-specific tags
  protected invalidateUserCache(userId: string): void {
    this.apiClient.invalidateCacheByTags([`${this.cacheTag}:user:${userId}`])
  }
}

export type { PaginatedResponse, FilterDto, CacheOptions }