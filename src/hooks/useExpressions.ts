
import { useState, useCallback } from 'react'

import expressionService from '../services/expressionService'
import type {
  Expression,
  CreateExpressionRequest,
  ExpressionFilters,
  ExpressionStats
} from '../types/expression'

interface UseExpressionsState {
  expressions: Expression[]
  myExpressions: Expression[]
  loading: boolean
  createLoading: boolean
  error: string | null
  stats: ExpressionStats
}

interface UseExpressionsActions {
  createExpression: (data: CreateExpressionRequest) => Promise<void>
  loadReceivedExpressions: (empId: string, filters?: ExpressionFilters) => Promise<void>
  loadSentExpressions: (empId: string, filters?: ExpressionFilters) => Promise<void>
  updateExpression: (id: string, data: Partial<CreateExpressionRequest>) => Promise<void>
  deleteExpression: (id: string) => Promise<void>
  clearError: () => void
  calculateStatsForPeriod: (
    timePeriod: 'monthly' | 'yearly',
    currentYear: number,
    currentMonth?: number
  ) => ExpressionStats
}

export function useExpressions(): UseExpressionsState & UseExpressionsActions {
  const [state, setState] = useState<UseExpressionsState>({
    expressions: [],
    myExpressions: [],
    loading: false,
    createLoading: false,
    error: null,
    stats: {
      praise: 0,
      suggestions: 0,
      public: 0,
      private: 0
    }
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  const setCreateLoading = useCallback((createLoading: boolean) => {
    setState(prev => ({ ...prev, createLoading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  const createExpression = useCallback(async (data: CreateExpressionRequest) => {
    try {
      setCreateLoading(true)
      clearError()

      const response = await expressionService.createExpression(data)

      if (response.success) {
        // Add to myExpressions if it's the current user
        setState(prev => ({
          ...prev,
          myExpressions: [response.data.expression, ...prev.myExpressions]
        }))
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create expression')
      throw error
    } finally {
      setCreateLoading(false)
    }
  }, [setCreateLoading, clearError, setError])

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

  const loadSentExpressions = useCallback(async (empId: string, filters?: ExpressionFilters) => {
    try {
      setLoading(true)
      clearError()

      const response = await expressionService.getSentExpressions(empId, filters)

      if (response.success) {
        setState(prev => ({
          ...prev,
          myExpressions: response.data.expressions
        }))
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load sent expressions')
    } finally {
      setLoading(false)
    }
  }, [setLoading, clearError, setError])

  const updateExpression = useCallback(async (id: string, data: Partial<CreateExpressionRequest>) => {
    try {
      setLoading(true)
      clearError()

      const response = await expressionService.updateExpression(id, data)

      if (response.success) {
        setState(prev => ({
          ...prev,
          myExpressions: prev.myExpressions.map(expr =>
            expr.EXP_ID === id ? response.data.expression : expr
          )
        }))
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update expression')
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, clearError, setError])

  const deleteExpression = useCallback(async (id: string) => {
    try {
      setLoading(true)
      clearError()

      const response = await expressionService.deleteExpression(id)

      if (response.success) {
        setState(prev => ({
          ...prev,
          myExpressions: prev.myExpressions.filter(expr => expr.EXP_ID !== id)
        }))
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete expression')
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, clearError, setError])

  const calculateStatsForPeriod = useCallback((
    timePeriod: 'monthly' | 'yearly',
    currentYear: number,
    currentMonth?: number
  ): ExpressionStats => {
    const filteredExpressions = expressionService.filterExpressionsByTime(
      state.expressions,
      timePeriod,
      currentYear,
      currentMonth
    )

    return expressionService.calculateStats(filteredExpressions)
  }, [state.expressions])

  // Auto-load data when empId changes
  // useEffect(() => {
  //   if (empId) {
  //     loadReceivedExpressions(empId)
  //     loadSentExpressions(empId)
  //   }
  // }, [empId, loadReceivedExpressions, loadSentExpressions])

  return {
    ...state,
    createExpression,
    loadReceivedExpressions,
    loadSentExpressions,
    updateExpression,
    deleteExpression,
    clearError,
    calculateStatsForPeriod
  }
}
