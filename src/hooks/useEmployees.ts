import { useState, useEffect, useCallback, useMemo } from 'react'
import employeeService from '../services/employeeService'
import type { Employee } from '../types/employee'

interface UseEmployeesState {
  employees: Employee[]
  loading: boolean
  error: string | null
}

interface UseEmployeesActions {
  loadEmployees: () => Promise<void>
  searchEmployees: (searchTerm: string) => Promise<Employee[]>
  getEmployeeById: (empId: string) => Employee | undefined
  getEmployeeName: (empId: string) => string
  clearError: () => void
}

export function useEmployees(): UseEmployeesState & UseEmployeesActions {
  const [state, setState] = useState<UseEmployeesState>({
    employees: [],
    loading: false,
    error: null
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true)
      clearError()

      const response = await employeeService.getAllEmployees()

      if (response.success) {
        setState(prev => ({
          ...prev,
          employees: response.data.employees
        }))
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [setLoading, clearError, setError])

  const searchEmployees = useCallback(async (searchTerm: string): Promise<Employee[]> => {
    try {
      if (!searchTerm.trim()) {
        return state.employees
      }

      const response = await employeeService.searchEmployees(searchTerm)

      if (response.success) {
        return response.data.employees
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('Employee search error:', error)
      return []
    }
  }, [state.employees])

  // Memoized lookup functions
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>()
    state.employees.forEach(emp => {
      map.set(emp.empId, emp)
    })
    return map
  }, [state.employees])

  const getEmployeeById = useCallback((empId: string): Employee | undefined => {
    return employeeMap.get(empId)
  }, [employeeMap])

  const getEmployeeName = useCallback((empId: string): string => {
    const employee = employeeMap.get(empId)
    return employee ? employee.fullName : empId
  }, [employeeMap])

  // Auto-load employees on mount
  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  return {
    ...state,
    loadEmployees,
    searchEmployees,
    getEmployeeById,
    getEmployeeName,
    clearError
  }
}