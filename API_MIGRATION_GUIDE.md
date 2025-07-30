# 🚀 API Migration Guide - Enhanced API Architecture

## 📋 **Migration Overview**

This guide provides a step-by-step approach to migrate from the current API architecture to the enhanced, performance-optimized system.

---

## 🎯 **Migration Strategy**

### **Phase 1: Foundation Setup (Days 1-2)**

#### **1. Install Enhanced API Client**
```typescript
// Current usage
import ApiClient from './services/apiClient'
import expressionService from './services/expressionService'

// Enhanced usage
import { EnhancedApiClient } from './services/enhanced/EnhancedApiClient'
import enhancedExpressionService from './services/enhanced/EnhancedExpressionService'
```

#### **2. Update Environment Configuration**
```bash
# Add to .env.local
NEXT_PUBLIC_API_CACHE_ENABLED=true
NEXT_PUBLIC_API_RETRY_ATTEMPTS=3
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_WS_URL=ws://localhost:2525/ws
```

---

### **Phase 2: Service Migration (Days 3-5)**

#### **Before: Current Expression Service Usage**
```typescript
// Current implementation in useExpressions hook
const loadReceivedExpressions = useCallback(async (empId: string, filters?: ExpressionFilters) => {
  try {
    setLoading(true)
    clearError()

    const response = await expressionService.getReceivedExpressions(empId, filters)

    if (response.success) {
      setState(prev => ({
        ...prev,
        expressions: response.data.expressions,
        stats: expressionService.calculateStats(response.data.expressions)
      }))
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Failed to load received expressions')
  } finally {
    setLoading(false)
  }
}, [setLoading, clearError, setError])
```

#### **After: Enhanced Service Usage**
```typescript
// Enhanced implementation with caching and error handling
const loadReceivedExpressions = useCallback(async (
  empId: string, 
  filters?: ExpressionFilters,
  options?: { refresh?: boolean }
) => {
  try {
    setLoading(true)
    clearError()

    // Enhanced service with automatic caching, retry, and error handling
    const response = await enhancedExpressionService.getReceivedExpressions(
      empId, 
      filters,
      { 
        cache: true,     // Enable caching
        refresh: options?.refresh // Force refresh if needed
      }
    )

    setState(prev => ({
      ...prev,
      expressions: response.data,
      stats: await enhancedExpressionService.getExpressionStats(empId, filters)
    }))

  } catch (error) {
    // Enhanced error handling with categorization
    if (error instanceof ApiError) {
      setError(`${error.type}: ${error.message}`)
    } else {
      setError(error instanceof Error ? error.message : 'Failed to load received expressions')
    }
  } finally {
    setLoading(false)
  }
}, [setLoading, clearError, setError])
```

---

### **Phase 3: Component Integration (Days 6-7)**

#### **Enhanced HomeComponent with Optimistic Updates**
```typescript
// Before: Basic create expression
const handleSaveExpression = async (status: 'draft' | 'published') => {
  if (!expressionData.recipient || !expressionData.content) {
    showToast({
      type: 'warning',
      title: 'ข้อมูลไม่ครบถ้วน',
      message: 'กรุณากรอกผู้รับและเนื้อหาให้ครบถ้วน'
    })
    return
  }

  try {
    const newExpressionData: CreateExpressionRequest = {
      ...expressionData,
      status
    }

    await createExpression(newExpressionData)
    
    // Close modal and reset form on success
    setNewExpressionOpen(false)
    // ... reset form logic
    
  } catch (error) {
    // Error already handled by hook
  }
}

// After: Enhanced with optimistic updates
const handleSaveExpression = async (status: 'draft' | 'published') => {
  if (!expressionData.recipient || !expressionData.content) {
    showToast({
      type: 'warning',
      title: 'ข้อมูลไม่ครบถ้วน',
      message: 'กรุณากรอกผู้รับและเนื้อหาให้ครบถ้วน'
    })
    return
  }

  try {
    const newExpressionData: CreateExpressionRequest = {
      ...expressionData,
      status
    }

    // Optimistic update - UI updates immediately
    const result = await enhancedExpressionService.createExpressionOptimistic(
      newExpressionData,
      userEmpId!
    )

    // Show success immediately
    showToast({
      type: 'success',
      title: 'บันทึกสำเร็จ',
      message: status === 'published' ? 'เผยแพร่ความคิดเห็นแล้ว' : 'บันทึกร่างแล้ว'
    })
    
    // Close modal and reset form
    setNewExpressionOpen(false)
    // ... reset form logic
    
  } catch (error) {
    // Enhanced error handling with automatic rollback
    if (error instanceof ApiError) {
      showToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: error.message,
        duration: 5000
      })
    }
  }
}
```

---

### **Phase 4: Performance Optimization (Days 8-10)**

#### **1. Implement Cache Warming**
```typescript
// Add to app initialization
useEffect(() => {
  const warmCache = async () => {
    if (userEmpId) {
      // Pre-load common data
      await Promise.all([
        enhancedExpressionService.getReceivedExpressions(userEmpId, { 
          timePeriod: 'monthly',
          year: new Date().getFullYear(),
          month: new Date().getMonth()
        }),
        enhancedExpressionService.getExpressionStats(userEmpId),
        employeeService.getEmployeeList() // If available
      ])
    }
  }

  warmCache().catch(console.error)
}, [userEmpId])
```

#### **2. Add Real-time Synchronization**
```typescript
// Add to main component
useEffect(() => {
  const realtimeService = new RealtimeService()
  
  const unsubscribe = realtimeService.subscribe('expressions:updated', (data) => {
    // Invalidate cache and refresh data
    enhancedExpressionService.syncWithServer(userEmpId!)
    
    showToast({
      type: 'info',
      title: 'ข้อมูลใหม่',
      message: 'มีการอัปเดตความคิดเห็นใหม่'
    })
  })

  return unsubscribe
}, [userEmpId])
```

#### **3. Implement Progressive Loading**
```typescript
// Enhanced loading pattern
const [loadingState, setLoadingState] = useState({
  expressions: false,
  stats: false,
  initialLoad: true
})

const loadDataProgressive = useCallback(async () => {
  if (!userEmpId) return

  try {
    // Load critical data first
    setLoadingState(prev => ({ ...prev, expressions: true }))
    
    const expressions = await enhancedExpressionService.getReceivedExpressions(
      userEmpId,
      { timePeriod, year: currentYear, month: currentMonth },
      { cache: true }
    )
    
    setExpressions(expressions.data)
    setLoadingState(prev => ({ ...prev, expressions: false, initialLoad: false }))
    
    // Load secondary data
    setLoadingState(prev => ({ ...prev, stats: true }))
    
    const stats = await enhancedExpressionService.getExpressionStats(
      userEmpId,
      { timePeriod, year: currentYear, month: currentMonth }
    )
    
    setStats(stats)
    setLoadingState(prev => ({ ...prev, stats: false }))
    
  } catch (error) {
    handleError(error)
  }
}, [userEmpId, timePeriod, currentYear, currentMonth])
```

---

## 🔧 **Configuration Examples**

### **Enhanced API Client Configuration**
```typescript
// services/enhanced/config.ts
export const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2525',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  cache: {
    enabled: process.env.NEXT_PUBLIC_API_CACHE_ENABLED === 'true',
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // Max cache entries
  },
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    level: 'info'
  }
}
```

### **Service-Specific Configuration**
```typescript
// Enhanced Expression Service with custom config
class ConfigurableExpressionService extends EnhancedExpressionService {
  constructor(config?: Partial<ServiceConfig>) {
    super()
    
    // Override default cache TTL for expressions
    this.defaultCacheTTL = config?.cacheTTL || 10 * 60 * 1000 // 10 minutes
    
    // Set batch size for bulk operations
    this.batchSize = config?.batchSize || 5
    
    // Configure optimistic updates
    this.optimisticUpdatesEnabled = config?.optimisticUpdates !== false
  }
}
```

---

## 📊 **Performance Monitoring**

### **1. Add Performance Metrics**
```typescript
// Monitor API performance
useEffect(() => {
  const interval = setInterval(() => {
    const stats = enhancedExpressionService.getServiceStats()
    const cacheStats = EnhancedApiClient.getInstance().getCacheStats()
    
    if (process.env.NODE_ENV === 'development') {
      console.table({
        'Total Requests': stats.totalRequests,
        'Cache Hit Rate': `${cacheStats.hitRate.toFixed(1)}%`,
        'Average Response Time': `${stats.avgResponseTime.toFixed(0)}ms`,
        'Error Rate': `${((stats.errors / stats.totalRequests) * 100).toFixed(1)}%`,
        'Cache Size': cacheStats.size
      })
    }
  }, 30000) // Every 30 seconds

  return () => clearInterval(interval)
}, [])
```

### **2. Performance Alerts**
```typescript
// Add performance monitoring
const monitorPerformance = () => {
  const stats = enhancedExpressionService.getServiceStats()
  
  // Alert on high error rate
  if (stats.errors / stats.totalRequests > 0.05) { // 5% error rate
    showToast({
      type: 'warning',
      title: 'ประสิทธิภาพลดลง',
      message: 'ระบบมีข้อผิดพลาดสูงกว่าปกติ'
    })
  }
  
  // Alert on slow response times
  if (stats.avgResponseTime > 2000) { // 2 seconds
    showToast({
      type: 'info',
      title: 'การเชื่อมต่อช้า',
      message: 'ระบบตอบสนองช้ากว่าปกติ'
    })
  }
}
```

---

## ✅ **Migration Checklist**

### **Pre-Migration**
- [ ] Review current API usage patterns
- [ ] Identify critical user flows
- [ ] Set up development environment
- [ ] Create backup of current implementation

### **Phase 1: Foundation**
- [ ] Install enhanced API client
- [ ] Configure environment variables
- [ ] Set up error monitoring
- [ ] Test basic connectivity

### **Phase 2: Service Migration**
- [ ] Migrate expression service
- [ ] Update hook implementations  
- [ ] Add cache configuration
- [ ] Test CRUD operations

### **Phase 3: Component Integration**
- [ ] Update HomeComponent
- [ ] Add optimistic updates
- [ ] Enhance error handling
- [ ] Test user interactions

### **Phase 4: Performance**
- [ ] Implement cache warming
- [ ] Add real-time sync
- [ ] Set up monitoring
- [ ] Performance testing

### **Post-Migration**
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Optimize based on usage patterns
- [ ] Document new patterns

---

## 🚨 **Rollback Plan**

If issues arise during migration:

1. **Immediate Rollback**
   ```bash
   git checkout previous-stable-branch
   npm install
   npm run build
   ```

2. **Partial Rollback**
   ```typescript
   // Temporarily switch back to old service
   const useOldService = process.env.REACT_APP_USE_OLD_API === 'true'
   const expressionService = useOldService 
     ? oldExpressionService 
     : enhancedExpressionService
   ```

3. **Gradual Migration**
   ```typescript
   // Feature flag approach
   const useEnhancedAPI = useFeatureFlag('enhanced-api', userEmpId)
   ```

This migration guide ensures a smooth transition to the enhanced API architecture while maintaining system stability and user experience.