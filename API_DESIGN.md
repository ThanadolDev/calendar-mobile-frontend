# 📡 API Architecture Design - Calendar Mobile Application

## 🏗️ **Current Architecture Analysis**

### **Service Layer Structure**
```typescript
├── apiClient.ts         // Singleton HTTP client with auth
├── expressionService.ts // Expression CRUD operations
├── apiService.ts        // General API utilities
├── auth.ts             // Authentication services
├── employeeService.ts   // Employee data
├── fileUploadService.ts // File handling
├── fileDownloadService.ts
└── calendarService.ts   // Calendar operations
```

### **Current Data Flow**
```
UI Components → Custom Hooks → Service Layer → ApiClient → Backend APIs
     ↓              ↓              ↓           ↓
HomeComponent → useExpressions → expressionService → ApiClient → /api/expressions
```

---

## 🎯 **API Design Patterns & Best Practices**

### **1. Centralized API Client Architecture**

#### **Enhanced ApiClient Design**
```typescript
interface ApiClientConfig {
  baseURL: string
  timeout: number
  retries: number
  retryDelay: number
  enableCache: boolean
  enableLogging: boolean
}

class EnhancedApiClient {
  private instance: AxiosInstance
  private cache: Map<string, CacheEntry>
  private requestQueue: Map<string, Promise<any>>
  
  // Singleton pattern with configuration
  public static getInstance(config?: Partial<ApiClientConfig>): EnhancedApiClient
  
  // Request methods with built-in caching
  public async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>
  public async post<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>
  public async put<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>
  public async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>
  
  // Advanced features
  public async batch<T>(requests: BatchRequest[]): Promise<BatchResponse<T>[]>
  public invalidateCache(pattern?: string): void
  public getRequestStats(): RequestStats
}
```

#### **Request/Response Interceptors**
```typescript
// Request interceptor with retry logic
instance.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() }
    config.headers['X-Request-ID'] = generateRequestId()
    return addAuthToken(config)
  }
)

// Response interceptor with caching
instance.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime
    logApiRequest(response.config, response, duration)
    
    if (isCacheable(response.config)) {
      cacheResponse(response)
    }
    
    return response
  },
  (error) => handleApiError(error)
)
```

---

### **2. Service Layer Patterns**

#### **Generic Base Service**
```typescript
abstract class BaseService<T, CreateDto, UpdateDto> {
  protected abstract basePath: string
  protected apiClient = ApiClient.getInstance()
  
  async findAll(filters?: FilterDto): Promise<PaginatedResponse<T>> {
    const queryString = this.buildQueryString(filters)
    return this.apiClient.get(`${this.basePath}${queryString}`)
  }
  
  async findById(id: string): Promise<T> {
    return this.apiClient.get(`${this.basePath}/${id}`)
  }
  
  async create(data: CreateDto): Promise<T> {
    return this.apiClient.post(this.basePath, data)
  }
  
  async update(id: string, data: UpdateDto): Promise<T> {
    return this.apiClient.put(`${this.basePath}/${id}`, data)
  }
  
  async delete(id: string): Promise<void> {
    return this.apiClient.delete(`${this.basePath}/${id}`)
  }
  
  protected buildQueryString(filters?: any): string {
    if (!filters) return ''
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.append(key, String(value))
    })
    return params.toString() ? `?${params.toString()}` : ''
  }
}
```

#### **Enhanced Expression Service**
```typescript
class ExpressionService extends BaseService<Expression, CreateExpressionRequest, UpdateExpressionRequest> {
  protected basePath = '/api/expressions'
  
  // Specialized methods with caching
  async getReceivedExpressions(
    empId: string, 
    filters?: ExpressionFilters,
    options?: { cache?: boolean, refresh?: boolean }
  ): Promise<PaginatedResponse<Expression>> {
    const cacheKey = `received-${empId}-${JSON.stringify(filters)}`
    
    if (options?.refresh) {
      this.apiClient.invalidateCache(cacheKey)
    }
    
    return this.apiClient.get(
      `${this.basePath}/received/${empId}${this.buildQueryString(filters)}`,
      { cache: options?.cache !== false, cacheKey }
    )
  }
  
  async getSentExpressions(
    empId: string, 
    filters?: ExpressionFilters
  ): Promise<PaginatedResponse<Expression>> {
    return this.apiClient.get(
      `${this.basePath}/sent/${empId}${this.buildQueryString(filters)}`,
      { cache: true }
    )
  }
  
  // Optimistic updates
  async createExpression(data: CreateExpressionRequest): Promise<Expression> {
    const optimisticExpression = this.createOptimisticExpression(data)
    
    try {
      const result = await this.apiClient.post(this.basePath, data)
      this.updateCache('sent', result)
      return result
    } catch (error) {
      this.removeOptimisticExpression(optimisticExpression.id)
      throw error
    }
  }
  
  // Batch operations
  async batchUpdate(updates: BatchUpdateRequest[]): Promise<BatchResponse<Expression>> {
    return this.apiClient.batch(
      updates.map(update => ({
        method: 'PUT',
        url: `${this.basePath}/${update.id}`,
        data: update.data
      }))
    )
  }
}
```

---

### **3. Smart Caching Strategy**

#### **Cache Implementation**
```typescript
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
  etag?: string
}

class ApiCache {
  private cache = new Map<string, CacheEntry>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes
  
  set<T>(key: string, data: T, ttl?: number, tags?: string[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      tags: tags || []
    })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key)
      }
    }
  }
  
  // Intelligent cache warming
  async warmCache(keys: string[]): Promise<void> {
    const warmingPromises = keys.map(async (key) => {
      if (!this.get(key)) {
        // Trigger cache population
        await this.loadData(key)
      }
    })
    
    await Promise.all(warmingPromises)
  }
}
```

#### **Cache Tags Strategy**
```typescript
const CACHE_TAGS = {
  EXPRESSIONS: 'expressions',
  USER_EXPRESSIONS: (userId: string) => `user-expressions-${userId}`,
  EMPLOYEES: 'employees',
  STATS: 'stats'
} as const

// Usage in services
await apiClient.get('/api/expressions/received/123', {
  cache: true,
  tags: [CACHE_TAGS.EXPRESSIONS, CACHE_TAGS.USER_EXPRESSIONS('123')]
})
```

---

### **4. Error Handling Strategy**

#### **Unified Error Types**
```typescript
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
```

#### **Error Recovery Patterns**
```typescript
class ErrorRecoveryService {
  private retryQueue = new Map<string, RetryConfig>()
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = defaultRetryConfig
  ): Promise<T> {
    let lastError: ApiError
    
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = this.normalizeError(error)
        
        if (!lastError.retryable || attempt === config.maxRetries) {
          throw lastError
        }
        
        await this.delay(config.retryDelay * Math.pow(2, attempt - 1))
      }
    }
    
    throw lastError!
  }
  
  // Circuit breaker pattern
  private circuitBreakers = new Map<string, CircuitBreaker>()
  
  async executeWithCircuitBreaker<T>(
    endpoint: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(endpoint)
    return breaker.execute(operation)
  }
}
```

---

### **5. Real-time Updates & Synchronization**

#### **WebSocket Integration**
```typescript
class RealtimeService {
  private ws: WebSocket | null = null
  private subscriptions = new Map<string, Set<Function>>()
  
  connect(): void {
    this.ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!)
    
    this.ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data)
      this.handleMessage(type, data)
    }
  }
  
  subscribe(event: string, callback: Function): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set())
    }
    
    this.subscriptions.get(event)!.add(callback)
    
    return () => {
      this.subscriptions.get(event)?.delete(callback)
    }
  }
  
  private handleMessage(type: string, data: any): void {
    const callbacks = this.subscriptions.get(type)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
    
    // Update cache with real-time data
    this.updateCacheFromRealtime(type, data)
  }
}
```

#### **Optimistic Updates with Rollback**
```typescript
class OptimisticUpdateManager {
  private pendingUpdates = new Map<string, PendingUpdate>()
  
  async optimisticUpdate<T>(
    cacheKey: string,
    optimisticData: T,
    serverUpdate: () => Promise<T>
  ): Promise<T> {
    const updateId = generateId()
    
    // Apply optimistic update
    const originalData = cache.get(cacheKey)
    cache.set(cacheKey, optimisticData, undefined, ['optimistic'])
    
    this.pendingUpdates.set(updateId, {
      cacheKey,
      originalData,
      timestamp: Date.now()
    })
    
    try {
      const result = await serverUpdate()
      cache.set(cacheKey, result)
      this.pendingUpdates.delete(updateId)
      return result
    } catch (error) {
      // Rollback on failure
      if (originalData) {
        cache.set(cacheKey, originalData)
      } else {
        cache.delete(cacheKey)
      }
      this.pendingUpdates.delete(updateId)
      throw error
    }
  }
}
```

---

### **6. Performance Optimization Patterns**

#### **Request Deduplication**
```typescript
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()
  
  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }
    
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })
    
    this.pendingRequests.set(key, promise)
    return promise
  }
}
```

#### **Batch Request Processing**
```typescript
class BatchProcessor {
  private batchQueue: BatchRequest[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private readonly batchSize = 10
  private readonly batchDelay = 100 // ms
  
  async addToBatch<T>(request: BatchRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ ...request, resolve, reject })
      
      if (this.batchQueue.length >= this.batchSize) {
        this.processBatch()
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.batchDelay)
      }
    })
  }
  
  private async processBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    
    const currentBatch = this.batchQueue.splice(0, this.batchSize)
    
    try {
      const results = await this.apiClient.batch(currentBatch)
      currentBatch.forEach((request, index) => {
        request.resolve(results[index])
      })
    } catch (error) {
      currentBatch.forEach(request => {
        request.reject(error)
      })
    }
  }
}
```

---

### **7. Type-Safe API Contracts**

#### **Runtime Type Validation**
```typescript
import { z } from 'zod'

const ExpressionSchema = z.object({
  EXP_ID: z.string(),
  EXP_TYPE: z.string(),
  EXP_DATE: z.string(),
  TYPE: z.enum(['praise', 'suggestion']),
  attachments: z.array(z.object({
    fileId: z.string(),
    fileName: z.string(),
    mimeType: z.string().optional()
  }))
})

class TypeSafeApiClient {
  async get<T>(
    url: string, 
    schema: z.ZodSchema<T>,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.apiClient.get(url, options)
    return schema.parse(response) // Runtime validation
  }
}
```

#### **API Contract Generation**
```typescript
// Generated from OpenAPI spec
interface ApiContract {
  '/api/expressions': {
    GET: {
      params: ExpressionFilters
      response: PaginatedResponse<Expression>
    }
    POST: {
      body: CreateExpressionRequest
      response: Expression
    }
  }
  '/api/expressions/{id}': {
    PUT: {
      params: { id: string }
      body: UpdateExpressionRequest
      response: Expression
    }
    DELETE: {
      params: { id: string }
      response: void
    }
  }
}
```

---

## 📊 **Implementation Priority & Metrics**

### **Phase 1: Foundation (Week 1)**
- ✅ Enhanced ApiClient with retry logic
- ✅ Unified error handling system
- ✅ Basic caching implementation
- ✅ Request/response logging

### **Phase 2: Performance (Week 2)**
- 🔄 Request deduplication
- 🔄 Batch processing
- 🔄 Cache invalidation strategies
- 🔄 Optimistic updates

### **Phase 3: Advanced Features (Week 3)**
- 📋 Real-time synchronization
- 📋 Circuit breaker patterns
- 📋 Runtime type validation
- 📋 Performance monitoring

### **Success Metrics**
- **API Response Time**: <200ms average
- **Cache Hit Rate**: >70%
- **Error Rate**: <1%
- **Request Deduplication**: 30% reduction in duplicate requests
- **Bundle Size Impact**: <50KB additional overhead

---

## 🔧 **Usage Examples**

### **Basic Service Usage**
```typescript
// Service layer with caching
const expressions = await expressionService.getReceivedExpressions(
  'user123',
  { timePeriod: 'monthly', year: 2024, month: 10 },
  { cache: true, refresh: false }
)

// Optimistic updates
await expressionService.createExpression({
  type: 'praise',
  recipient: 'employee456',
  content: 'Great work!',
  privacy: 'public',
  status: 'published'
})
```

### **Advanced Features**
```typescript
// Batch operations
const results = await expressionService.batchUpdate([
  { id: '1', data: { status: 'published' } },
  { id: '2', data: { privacy: 'private' } }
])

// Real-time subscriptions
const unsubscribe = realtimeService.subscribe('expressions:updated', (data) => {
  // Update local state
  updateExpressionCache(data)
})
```

This comprehensive API design provides a robust, performant, and maintainable foundation for the calendar mobile application's data layer.