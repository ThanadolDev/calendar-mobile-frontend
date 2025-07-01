import ApiClient from './apiClient'
import type {
  ApiResponse,
  EmployeeListResponse,
  EmployeeResponse
} from '../types/employee'

class EmployeeService {
  private readonly basePath = '/api/employees'

  /**
   * Get all employees
   */
  async getAllEmployees(): Promise<ApiResponse<EmployeeListResponse>> {
    try {
      const response = await ApiClient.get<ApiResponse<EmployeeListResponse>>(
        this.basePath
      )

      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployee(empId: string): Promise<ApiResponse<EmployeeResponse>> {
    try {
      const response = await ApiClient.get<ApiResponse<EmployeeResponse>>(
        `${this.basePath}/${empId}`
      )

      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Search employees by name or ID
   */
  async searchEmployees(searchTerm: string): Promise<ApiResponse<EmployeeListResponse>> {
    try {
      const response = await ApiClient.get<ApiResponse<EmployeeListResponse>>(
        `${this.basePath}/search?q=${encodeURIComponent(searchTerm)}`
      )

      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get employee name by ID (utility function)
   */
  async getEmployeeName(empId: string): Promise<string> {
    try {
      const response = await this.getEmployee(empId)

      if (response.success && response.data.employee) {
        return response.data.employee.fullName
      }

      return empId // fallback to empId if not found
    } catch (error) {
      console.warn(`Could not fetch name for employee ${empId}:`, error)

      return empId // fallback to empId on error
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

export default new EmployeeService()
