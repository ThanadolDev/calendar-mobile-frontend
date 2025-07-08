/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable padding-line-between-statements */
/* eslint-disable newline-before-return */
'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'

import {
  Plus,
  ThumbsUp,
  MessageSquare,
  User,
  Calendar,
  Eye,
  EyeOff,
  Paperclip,
  Send,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Lightbulb,
  Clock,
  Loader2,
  AlertCircle,
  FileText,
  Image,
  Video
} from 'lucide-react'

import { useExpressions } from '../../hooks/useExpressions'
import { useAuth } from '../../contexts/AuthContext'
import type { CreateExpressionRequest, Expression } from '../../types/expression'
import fileUploadService from '../../services/fileUploadService'
import fileDownloadService from '../../services/fileDownloadService'
import { useEmployees } from '../../hooks/useEmployees'
import EmployeeDropdown from '../ui/EmployeeDropdown'

// Constants
const SWIPE_THRESHOLD = 50

const MONTH_NAMES = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม'
]

// Allowed file types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
  'video/mp4': ['.mp4'],
  'video/avi': ['.avi'],
  'video/mov': ['.mov'],
  'video/wmv': ['.wmv'],
  'video/webm': ['.webm'],
  'video/mkv': ['.mkv'],
  'application/pdf': ['.pdf']
}

const FeedbackDashboard = () => {
  // Get authenticated user data
  const { user } = useAuth()
  const userEmpId = user?.id

  // Employee management
  const { getEmployeeName } = useEmployees()

  // Use the expressions hook for API integration
  const {
    expressions,
    myExpressions,
    loading,
    createLoading,
    error,
    createExpression,
    loadReceivedExpressions,
    loadSentExpressions,
    updateExpression,
    deleteExpression,
    clearError,
    calculateStatsForPeriod
  } = useExpressions()

  // Changed from activeTab (0,1) to string-based tabs for clarity
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [timePeriod, setTimePeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const [currentMonth, setCurrentMonth] = useState(() => {
    const month = new Date().getMonth()
    console.log('Initial month:', month, new Date())
    return month
  })

  const [newExpressionOpen, setNewExpressionOpen] = useState(false)
  const [periodLoading, setPeriodLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false)

  const [selectedExpression, setSelectedExpression] = useState<
    | (Expression & {
        from?: string
        department?: string
        position?: string
        fullContent?: string
        content?: string
      })
    | null
  >(null)

  const [editingExpression, setEditingExpression] = useState<Expression | null>(null)

  const [expressionData, setExpressionData] = useState<CreateExpressionRequest>({
    type: 'praise',
    recipient: '',
    content: '',
    attachments: [] as CreateExpressionRequest['attachments'],
    privacy: 'public',
    status: 'draft'
  })

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper functions (keeping original implementations)
  const isImageFile = (fileName: string, mimeType?: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    const mime = mimeType?.toLowerCase() || ''
    return mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(extension)
  }

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    const mime = mimeType?.toLowerCase() || ''

    if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(extension)) {
      return <Image className='w-4 h-4 text-blue-600' />
    }

    if (mime.startsWith('video/') || ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.mkv'].includes(extension)) {
      return <Video className='w-4 h-4 text-red-600' />
    }

    if (extension === '.pdf' || mime === 'application/pdf') {
      return <FileText className='w-4 h-4 text-red-600' />
    }

    return <FileText className='w-4 h-4 text-gray-700' />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const isValidFileType = (file: File) => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const mimeType = file.type.toLowerCase()

    for (const [allowedMime, allowedExtensions] of Object.entries(ALLOWED_FILE_TYPES)) {
      if (mimeType === allowedMime || allowedExtensions.includes(extension)) {
        return true
      }
    }
    return false
  }

  // Navigation functions
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return

    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > SWIPE_THRESHOLD
    const isRightSwipe = distance < -SWIPE_THRESHOLD

    if (timePeriod === 'monthly') {
      if (isLeftSwipe) {
        navigateMonth(1)
      } else if (isRightSwipe) {
        navigateMonth(-1)
      }
    } else {
      if (isLeftSwipe) {
        navigateYear(1)
      } else if (isRightSwipe) {
        navigateYear(-1)
      }
    }
  }

  const navigateMonth = (direction: number) => {
    setPeriodLoading(true)
    const newMonth = currentMonth + direction

    React.startTransition(() => {
      if (newMonth > 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else if (newMonth < 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        const safeMonth = Math.max(0, Math.min(11, newMonth))
        setCurrentMonth(safeMonth)
      }
    })
  }

  const navigateYear = (direction: number) => {
    setPeriodLoading(true)
    React.startTransition(() => {
      setCurrentYear(currentYear + direction)
    })
  }

  // Calculate stats for current time period based on active tab
  const currentStats = useMemo(() => {
    const baseStats = calculateStatsForPeriod(timePeriod, currentYear, currentMonth)

    if (activeTab === 'received') {
      // For received expressions, show what we received
      return {
        praisePublic: baseStats.praise || 0,
        suggestionPublic: baseStats.suggestions || 0,
        praisePrivate: baseStats.public || 0, // You might need to adjust this mapping
        suggestionPrivate: baseStats.private || 0 // You might need to adjust this mapping
      }
    } else {
      // For sent expressions, show what we sent
      return {
        praisePublic: baseStats.praise || 0,
        suggestionPublic: baseStats.suggestions || 0,
        praisePrivate: baseStats.public || 0, // You might need to adjust this mapping
        suggestionPrivate: baseStats.private || 0 // You might need to adjust this mapping
      }
    }
  }, [calculateStatsForPeriod, timePeriod, currentYear, currentMonth, activeTab])

  // Handle clicking on stat cards
  const handleStatCardClick = (type: 'praise' | 'suggestion', privacy: 'public' | 'private') => {
    // Check if card is disabled (private cards when in received mode)
    if (activeTab === 'received' && privacy === 'private') {
      alert('ไม่สามารถดูรายการความคิดเห็นส่วนตัวได้')
      return
    }

    // Navigate to expression list page with filters
    const params = new URLSearchParams({
      tab: activeTab,
      type: type,
      privacy: privacy,
      timePeriod: timePeriod,
      year: currentYear.toString(),
      ...(timePeriod === 'monthly' && { month: currentMonth.toString() })
    })

    // Replace with your actual navigation logic
    window.location.href = `/expressions/list?${params.toString()}`
  }

  // Handle adding new expression
  const handleAddExpression = () => {
    // Navigate to add expression page
    window.location.href = '/expressions/add'
  }

  // Filter expressions based on time period
  const filteredExpressions = useMemo(() => {
    return expressions
  }, [expressions, timePeriod, currentMonth, currentYear])

  const filteredMyExpressions = useMemo(() => {
    return myExpressions
  }, [myExpressions, timePeriod, currentMonth, currentYear])

  // Reload data when time period changes
  useEffect(() => {
    if (userEmpId) {
      const filters = {
        timePeriod,
        year: currentYear,
        ...(timePeriod === 'monthly' && { month: currentMonth })
      }

      const loadData = async () => {
        try {
          await Promise.all([loadReceivedExpressions(userEmpId, filters), loadSentExpressions(userEmpId, filters)])
        } finally {
          setPeriodLoading(false)
        }
      }

      loadData()
    }
  }, [userEmpId, timePeriod, currentYear, currentMonth, loadReceivedExpressions, loadSentExpressions])

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // If no user and not loading, redirect to login
  React.useEffect(() => {
    if (!user && !loading) {
      console.log('HomeComponent: No user found, redirecting to login')
      window.location.href = '/handbookmanage/login-og'
    }
  }, [user, loading])

  // Show loading if expressions are loading or if we're redirecting
  if (loading || !user || !userEmpId) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <p className='mt-2 text-gray-800 font-medium'>
            {!user ? 'กำลังตรวจสอบการเข้าสู่ระบบ...' : 'กำลังโหลดข้อมูล...'}
          </p>
        </div>
      </div>
    )
  }

  // Stat Card Component
  interface StatCardProps {
    title: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    bgColor: string
    textColor: string
    onClick?: () => void
    disabled?: boolean
  }

  const StatCard = ({ title, value, icon: Icon, bgColor, textColor, onClick, disabled }: StatCardProps) => (
    <div
      className={`bg-white rounded-lg p-4 shadow-md border-2 border-gray-200 transition-all duration-200 ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-50'
          : 'cursor-pointer hover:shadow-lg hover:border-blue-300'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className='flex items-start justify-between'>
        <div className='flex-1 pr-2'>
          <p className='text-sm text-gray-800 font-medium mb-1 leading-tight min-h-[2.5rem] flex items-end'>
            {title}
          </p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${bgColor} flex-shrink-0 shadow-sm flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>
    </div>
  )

  const StatCardSkeleton = () => (
    <div className='bg-white rounded-lg p-4 shadow-md border-2 border-gray-200 animate-pulse'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='h-4 bg-gray-300 rounded w-20 mb-2'></div>
          <div className='h-8 bg-gray-300 rounded w-8'></div>
        </div>
        <div className='p-3 rounded-full bg-gray-200'>
          <div className='w-6 h-6 bg-gray-300 rounded'></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className='min-h-screen bg-gray-100'>
      {/* Error Message */}
      {error && (
        <div className='mx-4 mt-4 p-4 bg-red-50 border-2 border-red-300 text-red-800 rounded-lg flex items-center gap-2 shadow-md'>
          <AlertCircle className='w-5 h-5' />
          <span className='font-medium'>{error}</span>
        </div>
      )}

      {/* Time Period Toggle */}
      <div className='p-4 bg-white border-b-2 border-gray-200 shadow-sm'>
        <div className='flex rounded-lg border-2 border-gray-300 overflow-hidden shadow-sm'>
          <button
            onClick={() => {
              setPeriodLoading(true)
              setTimePeriod('monthly')
            }}
            className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
              timePeriod === 'monthly' ? '!bg-blue-600 !text-white' : '!bg-white !text-gray-800 hover:!bg-blue-50'
            }`}
            disabled={periodLoading}
            style={
              timePeriod === 'monthly'
                ? { backgroundColor: '#2563eb', color: '#ffffff' }
                : { backgroundColor: '#ffffff', color: '#1f2937' }
            }
          >
            รายเดือน
          </button>
          <button
            onClick={() => {
              setPeriodLoading(true)
              setTimePeriod('yearly')
            }}
            className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
              timePeriod === 'yearly' ? '!bg-blue-600 !text-white' : '!bg-white !text-gray-800 hover:!bg-blue-50'
            }`}
            disabled={periodLoading}
            style={
              timePeriod === 'yearly'
                ? { backgroundColor: '#2563eb', color: '#ffffff' }
                : { backgroundColor: '#ffffff', color: '#1f2937' }
            }
          >
            รายปี
          </button>
        </div>

        {/* Month/Year Selector */}
        <div
          className='mt-3 flex items-center justify-between bg-gray-50 rounded-lg p-4 border-2 border-gray-200'
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => (timePeriod === 'monthly' ? navigateMonth(-1) : navigateYear(-1))}
            className='p-3 hover:!bg-white rounded-full transition-colors border border-gray-300 hover:border-gray-400 !bg-gray-50 !text-gray-700'
            style={{ backgroundColor: '#f9fafb', color: '#374151' }}
            aria-label={timePeriod === 'monthly' ? 'เดือนก่อนหน้า' : 'ปีก่อนหน้า'}
          >
            <ChevronLeft className='w-5 h-5 text-gray-700' />
          </button>

          <div className='text-center'>
            <p className='text-lg font-bold text-gray-900'>
              {timePeriod === 'monthly' ? `${MONTH_NAMES[currentMonth]} ${currentYear + 543}` : `${currentYear + 543}`}
            </p>
            <p className='text-xs text-gray-700 mt-1 font-medium'>
              {timePeriod === 'monthly' ? 'เลื่อนซ้าย-ขวาเพื่อเปลี่ยนเดือน' : 'เลื่อนซ้าย-ขวาเพื่อเปลี่ยนปี'}
            </p>
          </div>

          <button
            onClick={() => (timePeriod === 'monthly' ? navigateMonth(1) : navigateYear(1))}
            className='p-3 hover:!bg-white rounded-full transition-colors border border-gray-300 hover:border-gray-400 !bg-gray-50 !text-gray-700'
            style={{ backgroundColor: '#f9fafb', color: '#374151' }}
            aria-label={timePeriod === 'monthly' ? 'เดือนถัดไป' : 'ปีถัดไป'}
          >
            <ChevronRight className='w-5 h-5 text-gray-700' />
          </button>
        </div>
      </div>

      {/* Tab Section */}
      <div className='bg-white border-b-2 border-gray-200 shadow-sm'>
        <div className='flex'>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-4 px-4 text-sm font-semibold transition-colors ${
              activeTab === 'received'
                ? '!text-blue-700 border-b-2 border-blue-600 !bg-blue-50'
                : '!text-gray-700 hover:!text-gray-900 hover:!bg-gray-50'
            }`}
            style={
              activeTab === 'received'
                ? { color: '#1d4ed8', backgroundColor: '#eff6ff' }
                : { color: '#374151', backgroundColor: '#ffffff' }
            }
          >
            ที่ได้รับ ({filteredExpressions.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-4 px-4 text-sm font-semibold transition-colors ${
              activeTab === 'sent'
                ? '!text-blue-700 border-b-2 border-blue-600 !bg-blue-50'
                : '!text-gray-700 hover:!text-gray-900 hover:!bg-gray-50'
            }`}
            style={
              activeTab === 'sent'
                ? { color: '#1d4ed8', backgroundColor: '#eff6ff' }
                : { color: '#374151', backgroundColor: '#ffffff' }
            }
          >
            ที่แสดงความคิดเห็น ({filteredMyExpressions.length})
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className='p-4'>
        <div className='grid grid-cols-2 gap-4'>
          {periodLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Top Left: Public Praise */}
              <StatCard
                title='ชื่นชม (เปิดเผย)'
                value={currentStats.praisePublic}
                icon={ThumbsUp}
                bgColor='bg-green-100'
                textColor='text-green-700'
                onClick={() => handleStatCardClick('praise', 'public')}
              />

              {/* Top Right: Public Suggestions */}
              <StatCard
                title='ต้องปรับปรุง (เปิดเผย)'
                value={currentStats.suggestionPublic}
                icon={MessageSquare}
                bgColor='bg-orange-100'
                textColor='text-orange-700'
                onClick={() => handleStatCardClick('suggestion', 'public')}
              />

              {/* Bottom Left: Private Praise */}
              <StatCard
                title='ชื่นชม (ไม่เปิดเผย)'
                value={currentStats.praisePrivate}
                icon={Eye}
                bgColor='bg-blue-100'
                textColor='text-blue-700'
                onClick={() => handleStatCardClick('praise', 'private')}
                disabled={activeTab === 'received'}
              />

              {/* Bottom Right: Private Suggestions */}
              <StatCard
                title='ต้องปรับปรุง (ไม่เปิดเผย)'
                value={currentStats.suggestionPrivate}
                icon={EyeOff}
                bgColor='bg-gray-100'
                textColor='text-gray-700'
                onClick={() => handleStatCardClick('suggestion', 'private')}
                disabled={activeTab === 'received'}
              />
            </>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleAddExpression}
        className='fixed bottom-6 right-6 w-16 h-16 !bg-blue-600 !text-white rounded-full shadow-lg hover:!bg-blue-700 flex items-center justify-center transition-all duration-200 hover:scale-105 border-2 border-blue-600 hover:border-blue-700'
        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
        aria-label='แสดงความคิดเห็นใหม่'
      >
        <Plus className='w-7 h-7' />
      </button>
    </div>
  )
}

export default FeedbackDashboard
