export interface Employee {
  orgId: string
  empId: string
  firstName: string
  lastName: string
  fullName: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface EmployeeListResponse {
  employees: Employee[]
}

export interface EmployeeResponse {
  employee: Employee
}