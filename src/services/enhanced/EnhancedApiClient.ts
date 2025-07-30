import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

// Types and Interfaces
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
  etag?: string
}

interface RequestOptions extends AxiosRequestConfig {
  cache?: boolean
  cacheKey?: string
  cacheTTL?: number
  tags?: string[]
  retry?: number
  timeout?: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

interface BatchRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  data?: any
  options?: RequestOptions
}

interface RetryConfig {
  maxRetries: number
  retryDelay: number
  retryCondition?: (error: any) => boolean
}

enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public message: string,
    public statusCode?: number,
    public originalError?: any,
    public requestId?: string,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class EnhancedApiClient {
  private instance: AxiosInstance
  private static _instance: EnhancedApiClient
  private cache = new Map<string, CacheEntry>()
  private pendingRequests = new Map<string, Promise<any>>()
  private requestStats = {
    totalRequests: 0,
    cacheHits: 0,
    errors: 0,
    avgResponseTime: 0
  }

  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      return error.response?.status >= 500 || error.code === 'NETWORK_ERROR'
    }
  }

  private constructor() {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2525'
    
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
    this.startCacheCleanup()
  }

  public static getInstance(): EnhancedApiClient {
    if (!EnhancedApiClient._instance) {
      EnhancedApiClient._instance = new EnhancedApiClient()
    }
    return EnhancedApiClient._instance
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const startTime = Date.now()
        const requestId = this.generateRequestId()
        
        config.metadata = { startTime, requestId }
        config.headers['X-Request-ID'] = requestId
        
        // Add auth token
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        this.requestStats.totalRequests++
        
        return config
      },
      (error) => Promise.reject(this.normalizeError(error))
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime
        this.updateResponseTimeStats(duration)
        
        return response
      },
      async (error) => {
        const originalRequest = error.config
        
        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          
          try {
            await this.refreshToken()
            const token = this.getToken()
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return this.instance(originalRequest)
            }
          } catch (refreshError) {
            this.clearTokens()
            this.redirectToLogin()
            return Promise.reject(refreshError)
          }
        }
        
        this.requestStats.errors++
        return Promise.reject(this.normalizeError(error))
      }
    )
  }

  // Enhanced HTTP methods with caching and retry
  public async get<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const cacheKey = options.cacheKey || `GET:${url}:${JSON.stringify(options.params || {})}`
    
    // Check cache first
    if (options.cache !== false) {
      const cached = this.getFromCache<ApiResponse<T>>(cacheKey)
      if (cached) {
        this.requestStats.cacheHits++
        return cached
      }
    }

    // Check for duplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)
    }

    const requestPromise = this.executeWithRetry<ApiResponse<T>>(
      () => this.instance.get(url, options),
      options.retry
    ).then(response => {
      const result = this.normalizeResponse<T>(response)
      
      // Cache successful responses
      if (options.cache !== false && result.success) {
        this.setCache(cacheKey, result, options.cacheTTL, options.tags)
      }
      
      return result
    }).finally(() => {
      this.pendingRequests.delete(cacheKey)
    })

    this.pendingRequests.set(cacheKey, requestPromise)
    return requestPromise
  }

  public async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const result = await this.executeWithRetry<ApiResponse<T>>(
      () => this.instance.post(url, data, options),
      options.retry
    ).then(response => this.normalizeResponse<T>(response))

    // Invalidate related cache entries
    if (options.tags) {
      this.invalidateCacheByTags(options.tags)
    }

    return result
  }

  public async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const result = await this.executeWithRetry<ApiResponse<T>>(
      () => this.instance.put(url, data, options),
      options.retry
    ).then(response => this.normalizeResponse<T>(response))

    // Invalidate related cache entries
    if (options.tags) {
      this.invalidateCacheByTags(options.tags)
    }

    return result
  }

  public async delete<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const result = await this.executeWithRetry<ApiResponse<T>>(
      () => this.instance.delete(url, options),
      options.retry
    ).then(response => this.normalizeResponse<T>(response))

    // Invalidate related cache entries
    if (options.tags) {
      this.invalidateCacheByTags(options.tags)
    }

    return result
  }

  // Batch processing
  public async batch<T>(requests: BatchRequest[]): Promise<ApiResponse<T>[]> {
    const promises = requests.map(request => {
      switch (request.method) {
        case 'GET':
          return this.get<T>(request.url, request.options)
        case 'POST':
          return this.post<T>(request.url, request.data, request.options)
        case 'PUT':
          return this.put<T>(request.url, request.data, request.options)
        case 'DELETE':
          return this.delete<T>(request.url, request.options)
        default:
          throw new Error(`Unsupported method: ${request.method}`)
      }
    })

    return Promise.all(promises)
  }

  // Cache management
  private setCache<T>(key: string, data: T, ttl?: number, tags?: string[]): void {
    const defaultTTL = 5 * 60 * 1000 // 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || defaultTTL,
      tags: tags || []
    })
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  public invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const regex = new RegExp(pattern)
    for (const [key] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  public invalidateCacheByTags(tags: string[]): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key)
      }
    }
  }

  // Retry logic with exponential backoff
  private async executeWithRetry<T>(
    operation: () => Promise<AxiosResponse>,
    retries?: number
  ): Promise<AxiosResponse> {
    const maxRetries = retries || this.defaultRetryConfig.maxRetries
    let lastError: ApiError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = this.normalizeError(error)
        
        if (!lastError.retryable || attempt === maxRetries) {
          throw lastError
        }

        // Exponential backoff
        const delay = this.defaultRetryConfig.retryDelay * Math.pow(2, attempt - 1)
        await this.delay(delay)
      }
    }

    throw lastError!
  }

  // Utility methods
  private normalizeResponse<T>(response: AxiosResponse): ApiResponse<T> {
    // Handle different response formats
    if (response.data && typeof response.data === 'object') {
      if ('success' in response.data) {
        return response.data
      }
      
      return {
        success: response.status >= 200 && response.status < 300,
        data: response.data,
        message: response.statusText
      }
    }

    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText
    }
  }

  private normalizeError(error: any): ApiError {
    if (error.code === 'ECONNABORTED') {
      return new ApiError(ApiErrorType.TIMEOUT, 'Request timeout', 408, error, undefined, true)
    }

    if (!error.response) {
      return new ApiError(ApiErrorType.NETWORK_ERROR, 'Network error', 0, error, undefined, true)
    }

    const { status, data } = error.response
    const message = data?.message || error.message || 'Unknown error'

    switch (status) {
      case 400:
        return new ApiError(ApiErrorType.VALIDATION_ERROR, message, status, error)
      case 401:
        return new ApiError(ApiErrorType.AUTHENTICATION_ERROR, message, status, error, undefined, true)
      case 403:
        return new ApiError(ApiErrorType.AUTHORIZATION_ERROR, message, status, error)
      case 404:
        return new ApiError(ApiErrorType.NOT_FOUND, message, status, error)
      case 429:
        return new ApiError(ApiErrorType.RATE_LIMIT_ERROR, message, status, error, undefined, true)
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiError(ApiErrorType.SERVER_ERROR, message, status, error, undefined, true)
      default:
        return new ApiError(ApiErrorType.SERVER_ERROR, message, status, error)
    }
  }

  // Token management
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken')
    }
    return null
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) throw new Error('No refresh token available')

    const response = await axios.post('https://api.nitisakc.dev/auth/refresh', null, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    })

    localStorage.setItem('accessToken', response.data.accessToken)
    localStorage.setItem('refreshToken', response.data.refreshToken)
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  private redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // Utility functions
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private updateResponseTimeStats(duration: number): void {
    const { totalRequests, avgResponseTime } = this.requestStats
    this.requestStats.avgResponseTime = 
      (avgResponseTime * (totalRequests - 1) + duration) / totalRequests
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key)
        }
      }
    }, 60000) // Clean up every minute
  }

  // Public API for monitoring
  public getRequestStats() {
    return { ...this.requestStats }
  }

  public getCacheStats() {
    return {
      size: this.cache.size,
      hitRate: this.requestStats.totalRequests > 0 
        ? (this.requestStats.cacheHits / this.requestStats.totalRequests) * 100 
        : 0
    }
  }
}

export default EnhancedApiClient.getInstance()