'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade in animation
    setIsVisible(true)

    // Auto-close timer
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300) // Wait for fade out animation
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-600' />
      case 'error':
        return <AlertCircle className='w-5 h-5 text-red-600' />
      case 'warning':
        return <AlertCircle className='w-5 h-5 text-orange-600' />
      case 'info':
      default:
        return <Info className='w-5 h-5 text-blue-600' />
    }
  }

  const getStyles = () => {
    const baseStyles = 'border-l-4 shadow-lg rounded-lg'
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400`
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400`
      case 'warning':
        return `${baseStyles} bg-orange-50 border-orange-400`
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-400`
    }
  }

  return (
    <div
      className={`
        ${getStyles()}
        p-4 mb-3 transition-all duration-300 transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full pointer-events-auto
      `}
      role="alert"
      aria-live="polite"
    >
      <div className='flex items-start'>
        <div className='flex-shrink-0'>
          {getIcon()}
        </div>
        <div className='ml-3 flex-1'>
          <p className='text-sm font-semibold text-gray-900'>{title}</p>
          {message && (
            <p className='mt-1 text-sm text-gray-700'>{message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className='ml-4 flex-shrink-0 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 p-1 transition-colors'
          aria-label='ปิดการแจ้งเตือน'
        >
          <X className='w-4 h-4 text-gray-600' />
        </button>
      </div>
    </div>
  )
}

// Toast Provider and Hook
interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast
    }
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className='fixed top-4 right-4 z-50 max-w-sm w-full'>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}