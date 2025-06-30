import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { useRouter } from 'next/router'
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext'

// Mock Next.js router
const mockReplace = jest.fn()
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <button onClick={login} data-testid="login">Login</button>
      <button onClick={logout} data-testid="logout">Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      pathname: '/',
      query: {},
      asPath: '/'
    } as any)

    // Clear localStorage
    localStorage.clear()
    
    // Clear environment variables
    delete process.env.REACT_APP_URLMAIN_LOGIN
  })

  it('should initialize with no user and not loading', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
  })

  it('should handle login in development mode (no external auth URL)', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    act(() => {
      screen.getByTestId('login').click()
    })

    // Should redirect to login page in development mode
    expect(mockReplace).toHaveBeenCalledWith('/login-og')
  })

  it('should handle logout in development mode', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    act(() => {
      screen.getByTestId('logout').click()
    })

    // Should redirect to login page since no external auth URL
    expect(mockReplace).toHaveBeenCalledWith('/login-og')
  })

  it('should redirect to external auth when URL is configured', () => {
    process.env.REACT_APP_URLMAIN_LOGIN = 'https://external-auth.com'
    
    // Mock window.location
    const mockLocation = {
      href: 'http://localhost:3000/home',
      origin: 'http://localhost:3000'
    }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    act(() => {
      screen.getByTestId('login').click()
    })

    const expectedUrl = 'https://external-auth.com/login?ogwebsite=http://localhost:3000/home&redirectWebsite=http://localhost:3000/home'
    expect(mockReplace).toHaveBeenCalledWith(expectedUrl)
  })

  it('should handle logout with external auth URL', () => {
    process.env.REACT_APP_URLMAIN_LOGIN = 'https://external-auth.com'
    
    const mockLocation = {
      href: 'http://localhost:3000/home',
      origin: 'http://localhost:3000'
    }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    act(() => {
      screen.getByTestId('logout').click()
    })

    const expectedUrl = 'https://external-auth.com/logout?ogwebsite=http://localhost:3000/home&redirectWebsite=http://localhost:3000/home'
    expect(mockReplace).toHaveBeenCalledWith(expectedUrl)
  })

  it('should persist user data in localStorage', () => {
    const mockUser = {
      id: 'TEST001',
      name: 'Test User',
      email: 'test@example.com',
      ORG_ID: 'ORG001',
      accessToken: 'token123',
      refreshToken: 'refresh123',
      sessionId: 'session123',
      role: 'Manager',
      positionId: 'POS001',
      image_id: ''
    }

    const TestSetUser = () => {
      const { setUserInfo } = useAuth()
      
      React.useEffect(() => {
        setUserInfo(mockUser)
      }, [setUserInfo])
      
      return <TestComponent />
    }

    render(
      <AuthProvider>
        <TestSetUser />
      </AuthProvider>
    )

    // Check localStorage
    const storedUser = localStorage.getItem('user')
    expect(storedUser).toBeTruthy()
    expect(JSON.parse(storedUser!)).toEqual(mockUser)
  })

  it('should load user from localStorage on initialization', () => {
    const mockUser = {
      id: 'TEST001',
      name: 'Test User',
      email: 'test@example.com',
      ORG_ID: 'ORG001',
      accessToken: 'token123',
      refreshToken: 'refresh123',
      sessionId: 'session123',
      role: 'Manager',
      positionId: 'POS001',
      image_id: ''
    }

    // Pre-populate localStorage
    localStorage.setItem('user', JSON.stringify(mockUser))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('Test User')
  })

  it('should clear user data on logout', () => {
    const mockUser = {
      id: 'TEST001',
      name: 'Test User',
      email: 'test@example.com',
      ORG_ID: 'ORG001',
      accessToken: 'token123',
      refreshToken: 'refresh123',
      sessionId: 'session123',
      role: 'Manager',
      positionId: 'POS001',
      image_id: ''
    }

    localStorage.setItem('user', JSON.stringify(mockUser))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // User should be loaded
    expect(screen.getByTestId('user')).toHaveTextContent('Test User')

    act(() => {
      screen.getByTestId('logout').click()
    })

    // User should be cleared
    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(localStorage.getItem('user')).toBeNull()
  })
})