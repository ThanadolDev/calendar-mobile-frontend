// api.js - Auth-aware fetch implementation

import { getUserInfo } from '@/utils/userInfo'

/**
 * Configure base API settings
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'
const AUTH_VERIFY_URL = 'https://api.nitisakc.dev/auth/verify'
const AUTH_REFRESH_URL = 'https://api.nitisakc.dev/auth/refresh'
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const currentUrl = `${window.location.origin}/toolingmanage/login-og`
const redirectUrl = window.location.href

/**
 * Error class for API responses
 */
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Verify token validity
 */
const verifyToken = async token => {
  try {
    const response = await fetch(AUTH_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Token verification failed')
    }

    return true
  } catch (error) {
    return false
  }
}

/**
 * Refresh authentication token
 */
const refreshToken = async () => {
  const userInfo = getUserInfo()
  const refreshToken = userInfo?.refreshToken

  if (!refreshToken) {
    throw new ApiError('No refresh token available', 401)
  }

  try {
    const response = await fetch(AUTH_REFRESH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()

    // Update user info with new tokens
    const updatedUserInfo = {
      ...userInfo,
      token: data.accessToken,
      refreshToken: data.refreshToken || refreshToken
    }

    // Store updated tokens (implement this function in userInfo.js)
    // This is a placeholder - you'll need to implement the actual storage
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))

    return updatedUserInfo.token
  } catch (error) {
    // If refresh fails, redirect to login
    window.location.href = `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}`
    throw new ApiError('Authentication expired', 401)
  }
}

const createFetchOptions = async (method, data, customHeaders = {}) => {
  let userInfo = getUserInfo()
  let token = userInfo?.token

  if (!token) {
    throw new ApiError('Authentication required', 401)
  }

  const isValid = await verifyToken(token)

  if (!isValid) {
    token = await refreshToken()
    userInfo = getUserInfo()
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...customHeaders
  }

  const options = {
    method,
    headers,
    credentials: 'include'
  }

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data)
  }

  return options
}

const handleResponse = async response => {
  const contentType = response.headers.get('content-type')
  const isJson = contentType && contentType.includes('application/json')

  // Parse response based on content type
  const data = isJson ? await response.json() : await response.text()

  // Handle error responses
  if (!response.ok) {
    const message = isJson && data.message ? data.message : `API error: ${response.status}`

    // Handle specific error codes
    if (response.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}&redirectWebsite=${redirectUrl}`
    }

    throw new ApiError(message, response.status, data)
  }

  return data
}

const fetchWithTimeout = (url, options, timeout = DEFAULT_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new ApiError('Request timeout', 408)), timeout))
  ])
}

export const apiRequest = async (endpoint, method = 'GET', data = null, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    const fetchOptions = await createFetchOptions(method, data, options.headers)

    // Add request timeout
    const response = await fetchWithTimeout(url, fetchOptions, options.timeout)

    return await handleResponse(response)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      window.location.href = `${process.env.REACT_APP_URLMAIN_LOGIN}/logout?ogwebsite=${currentUrl}&redirectWebsite=${redirectUrl}`
      throw error
    }

    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError(error.message || 'Network error', error.status || 0)
  }
}

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, 'GET', null, options),
  post: (data, endpoint, options = {}) => apiRequest(endpoint, 'POST', data, options),
  put: (data, endpoint, options = {}) => apiRequest(endpoint, 'PUT', data, options),
  patch: (data, endpoint, options = {}) => apiRequest(endpoint, 'PATCH', data, options),
  delete: (endpoint, options = {}) => apiRequest(endpoint, 'DELETE', null, options)
}

// Example usage in your component:
//
// const fetchData = useCallback(async () => {
//   setLoading(true)
//   setError(null)
//
//   try {
//     const result = await api.get(`/requests?userId=${userInfo?.id}&orgId=${userInfo?.ORG_ID}`)
//     setData(result.data || [])
//   } catch (error) {
//     console.error('Error fetching data:', error)
//     setError(error.message)
//     setSnackbar({
//       open: true,
//       message: error.message,
//       severity: 'error'
//     })
//   } finally {
//     setLoading(false)
//   }
// }, [userInfo])
