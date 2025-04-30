import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2525'
const DIECUT_API_URL = process.env.NEXT_PUBLIC_API_URL // Add the diecut API URL

class ApiClient {
  private instance: AxiosInstance
  private static _instance: ApiClient

  private constructor() {
    this.instance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      config => {
        const token = this.getToken()

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors
    this.instance.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config

        // If error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = this.getRefreshToken()

            if (refreshToken) {
              const newTokens = await this.refreshAuthToken(refreshToken)

              if (typeof newTokens !== 'number') {
                this.setToken(newTokens.accessToken)
                this.setRefreshToken(newTokens.refreshToken)

                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`

                return this.instance(originalRequest)
              }
            }
          } catch (refreshError) {
            // If refresh fails, logout user
            this.clearTokens()

            // Redirect to login page
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }

            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  public static getInstance(): ApiClient {
    if (!ApiClient._instance) {
      ApiClient._instance = new ApiClient()
    }

    return ApiClient._instance
  }

  // Token management methods
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken')
    }

    return null
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken')
    }

    return null
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
    }
  }

  private setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token)
    }
  }

  public clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  // Auth methods
  public async refreshAuthToken(refreshToken: string) {
    try {
      const response = await axios.post<{ accessToken: string; refreshToken: string }>(
        'https://api.nitisakc.dev/auth/refresh',
        null,
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`
          }
        }
      )

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.status
      }

      throw error
    }
  }

  // Generic API methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const baseUrl = url.includes('diecuts') ? DIECUT_API_URL : API_BASE_URL
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
    const response: AxiosResponse<T> = await this.instance.get(fullUrl, config)

    return response.data
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const baseUrl = url.includes('diecuts') ? DIECUT_API_URL : API_BASE_URL
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
    const response: AxiosResponse<T> = await this.instance.post(fullUrl, data, config)

    return response.data
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const baseUrl = url.includes('diecuts') ? DIECUT_API_URL : API_BASE_URL
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
    const response: AxiosResponse<T> = await this.instance.put(fullUrl, data, config)

    return response.data
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const baseUrl = url.includes('diecuts') ? DIECUT_API_URL : API_BASE_URL
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
    const response: AxiosResponse<T> = await this.instance.delete(fullUrl, config)

    return response.data
  }
}

export default ApiClient.getInstance()
