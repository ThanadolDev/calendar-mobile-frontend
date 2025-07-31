import React, { Component, ReactNode } from 'react'
import { Box, Typography, Button, Alert } from '@mui/material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })
    
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          p: 3,
          textAlign: 'center'
        }}>
          <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              เกิดข้อผิดพลาดที่ไม่คาดคิด
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {this.state.error?.message || 'Something went wrong'}
            </Typography>
          </Alert>
          
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            รีโหลดหน้า
          </Button>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box sx={{ mt: 3, textAlign: 'left', maxWidth: 600, overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>
                Error Details (Development):
              </Typography>
              <pre style={{ 
                fontSize: '12px', 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </Box>
          )}
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary