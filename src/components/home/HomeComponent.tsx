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

  const [activeTab, setActiveTab] = useState(0)
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

  // Helper function to check if file is an image
  const isImageFile = (fileName: string, mimeType?: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    const mime = mimeType?.toLowerCase() || ''

    return mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(extension)
  }

  // Helper function to get file type icon (fallback)
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

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Validate file type
  const isValidFileType = (file: File) => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const mimeType = file.type.toLowerCase()

    // Check if file type is in allowed list
    for (const [allowedMime, allowedExtensions] of Object.entries(ALLOWED_FILE_TYPES)) {
      if (mimeType === allowedMime || allowedExtensions.includes(extension)) {
        return true
      }
    }

    return false
  }

  // Handle touch events
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

  // Navigation functions
  const navigateMonth = (direction: number) => {
    setPeriodLoading(true)
    const newMonth = currentMonth + direction

    console.log('navigateMonth - current:', currentMonth, 'direction:', direction, 'newMonth:', newMonth)

    if (newMonth > 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else if (newMonth < 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      // Safety check to ensure month is always valid
      const safeMonth = Math.max(0, Math.min(11, newMonth))

      setCurrentMonth(safeMonth)
    }
  }

  const navigateYear = (direction: number) => {
    setPeriodLoading(true)
    setCurrentYear(currentYear + direction)
  }

   const PublishConfirmationModal = () => {
    if (!showPublishConfirmation) return null

    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg max-w-sm w-full shadow-2xl border-2 border-gray-300'>
          <div className='p-6'>
            <div className='flex items-center justify-center mb-4'>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <AlertCircle className='w-6 h-6 text-blue-600' />
              </div>
            </div>

            <h3 className='text-lg font-bold text-gray-900 text-center mb-2'>
              ยืนยันการเผยแพร่
            </h3>

            <p className='text-sm text-gray-700 text-center mb-6 leading-relaxed'>
              คุณต้องการเผยแพร่ความคิดเห็นนี้หรือไม่?
            </p>

            <div className='flex gap-3'>
              <button
                onClick={() => setShowPublishConfirmation(false)}
                className='flex-1 py-3 px-4 border-2 border-gray-400 rounded-lg !text-gray-800 hover:!bg-gray-100 font-semibold transition-colors !bg-white'
                style={{ backgroundColor: '#ffffff', color: '#1f2937' }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setShowPublishConfirmation(false)

                  // Proceed with the actual publish action

                  if (editingExpression) {
                    handleUpdateExpression('published')
                  } else {
                    handleSaveExpression('published')
                  }
                }}
                className='flex-1 py-3 px-4 !bg-blue-600 !text-white rounded-lg hover:!bg-blue-700 font-semibold transition-colors border-2 border-blue-600 hover:border-blue-700'
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                disabled={createLoading}
              >
                {createLoading ? (
                  <div className='flex items-center justify-center gap-2'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    กำลังเผยแพร่...
                  </div>
                ) : (
                  'ยืนยันเผยแพร่'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Filter expressions based on time period
  const filteredExpressions = useMemo(() => {
    const filtered = expressions

    // Filter by time period
    // if (timePeriod === 'monthly') {
    //   filtered = filtered.filter(exp =>
    //     exp.month === currentMonth && exp.year === currentYear
    //   );
    // } else {
    //   filtered = filtered.filter(exp => exp.year === currentYear);
    // }

    return filtered
  }, [expressions, timePeriod, currentMonth, currentYear])

  const filteredMyExpressions = useMemo(() => {
    const filtered = myExpressions

    // if (timePeriod === 'monthly') {
    //   filtered = filtered.filter(exp =>
    //     exp.month === currentMonth && exp.year === currentYear
    //   );
    // } else {
    //   filtered = filtered.filter(exp => exp.year === currentYear);
    // }

    return filtered
  }, [myExpressions, timePeriod, currentMonth, currentYear])

  // Calculate stats for current time period
  const currentStats = useMemo(() => {
    return calculateStatsForPeriod(timePeriod, currentYear, currentMonth)
  }, [calculateStatsForPeriod, timePeriod, currentYear, currentMonth])

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

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) return

    // Validate file types first
    const invalidFiles = files.filter(file => !isValidFileType(file))

    if (invalidFiles.length > 0) {
      alert(
        `ไฟล์เหล่านี้ไม่ได้รับอนุญาต:\n${invalidFiles.map(f => f.name).join('\n')}\n\nอนุญาตเฉพาะไฟล์ภาพ, วิดีโอ และ PDF เท่านั้น`
      )

      if (event.target) {
        event.target.value = ''
      }

      return
    }

    // Check if adding these files would exceed the 10-file limit
    const currentFileCount = expressionData.attachments?.length ?? 0
    const totalAfterUpload = currentFileCount + files.length

    if (totalAfterUpload > 10) {
      alert(
        `ไม่สามารถเพิ่มไฟล์ได้ เนื่องจากจะเกินจำนวนสูงสุด 10 ไฟล์\n(ปัจจุบัน: ${currentFileCount} ไฟล์, พยายามเพิ่ม: ${files.length} ไฟล์)`
      )

      return
    }

    // Validate files (pass existing attachments to check for duplicates)
    const validation = fileUploadService.validateFiles(files, expressionData.attachments || [])

    if (!validation.valid) {
      // Create a more user-friendly error display
      const errorMessage = validation.errors.join('\n• ')

      alert(`ไม่สามารถอัปโหลดไฟล์ได้:\n• ${errorMessage}`)

      // Clear the input

      if (event.target) {
        event.target.value = ''
      }

      return
    }

    setUploadLoading(true)

    setUploadProgress(0)

    try {
      const uploadResult = await fileUploadService.uploadFiles(files, progress => {
        setUploadProgress(progress)
      })

      if (uploadResult.success && uploadResult.data?.files) {
        const newAttachments = uploadResult.data.files.map(file => ({
          fileId: file.fileId,
          fileName: file.fileName,
          type: 'FILE',
          mimeType: files.find(f => f.name === file.fileName)?.type
        }))

        setExpressionData({
          ...expressionData,
          attachments: [...(expressionData.attachments || []), ...newAttachments]
        })

        console.log('Files uploaded successfully:', uploadResult.data.files)
      } else {
        throw new Error(uploadResult.message || 'Upload failed')
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploadLoading(false)
      setUploadProgress(0)

      // Clear the input so the same file can be selected again

      if (event.target) {
        event.target.value = ''
      }
    }
  }

  // Handle saving expression
  const handleSaveExpression = async (status: 'draft' | 'published') => {
    if (!expressionData.recipient || !expressionData.content) {
      // Note: Error handling is managed by the useExpressions hook
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')

      return
    }

    try {
      const newExpressionData: CreateExpressionRequest = {
        ...expressionData,
        status
      }

      await createExpression(newExpressionData)

      // Close modal and reset form on success
      setNewExpressionOpen(false)
      setExpressionData({
        type: 'praise',
        recipient: '',
        content: '',
        attachments: [] as CreateExpressionRequest['attachments'],
        privacy: 'public',
        status: 'draft'
      })

      // Refresh the expressions data to show the new expression immediately
      if (userEmpId) {
        const filters = {
          timePeriod,
          year: currentYear,
          ...(timePeriod === 'monthly' && { month: currentMonth })
        }

        // Reload both received and sent expressions in the background to ensure consistency
        // Don't await here to make the UI feel more responsive
        Promise.all([loadReceivedExpressions(userEmpId, filters), loadSentExpressions(userEmpId, filters)]).catch(
          error => {
            console.error('Failed to refresh expressions after create:', error)
          }
        )
      }
    } catch (error) {
      // Error is already handled by the hook
      console.error('Failed to save expression:', error)
    }
  }

  // Handle editing a draft expression
  const handleEditExpression = (expression: Expression) => {
    setEditingExpression(expression)
    setExpressionData({
      type: expression.TYPE || 'praise',
      recipient: expression.EXP_TO || '',
      content: expression.EXP_DETAIL || '',
      privacy: expression.EXP_KIND === 'X' ? 'public' : 'private',
      status: 'draft',
      attachments: expression.attachments || []
    })
    setNewExpressionOpen(true)
  }

  // Handle deleting an expression (moves to status 'F' or soft delete)
  const handleDeleteExpression = async (expressionId: string) => {
    if (!confirm('คุณต้องการลบความคิดเห็นนี้หรือไม่?')) {
      return
    }

    try {
      await deleteExpression(expressionId)

      // Refresh expressions after soft delete
      if (userEmpId) {
        const filters = {
          timePeriod,
          year: currentYear,
          ...(timePeriod === 'monthly' && { month: currentMonth })
        }

        loadSentExpressions(userEmpId, filters)
      }
    } catch (error) {
      console.error('Failed to delete expression:', error)
      alert('ไม่สามารถลบความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง')
    }
  }

  // Handle updating an existing expression
  const handleUpdateExpression = async (status: 'draft' | 'published') => {
    if (!expressionData.recipient || !expressionData.content) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')

      return
    }

    if (!editingExpression) {
      // If not editing, create new expression
      return handleSaveExpression(status)
    }

    try {
      const updateData: Partial<CreateExpressionRequest> = {
        type: expressionData.type,
        recipient: expressionData.recipient,
        content: expressionData.content,
        privacy: expressionData.privacy,
        status,
        attachments: expressionData.attachments
      }

      await updateExpression(editingExpression.EXP_ID, updateData)

      // Close modal and reset form on success
      setNewExpressionOpen(false)
      setEditingExpression(null)
      setExpressionData({
        type: 'praise',
        recipient: '',
        content: '',
        attachments: [] as CreateExpressionRequest['attachments'],
        privacy: 'public',
        status: 'draft'
      })

      // Refresh expressions
      if (userEmpId) {
        const filters = {
          timePeriod,
          year: currentYear,
          ...(timePeriod === 'monthly' && { month: currentMonth })
        }

        Promise.all([loadReceivedExpressions(userEmpId, filters), loadSentExpressions(userEmpId, filters)]).catch(
          error => {
            console.error('Failed to refresh expressions after update:', error)
          }
        )
      }
    } catch (error) {
      console.error('Failed to update expression:', error)
    }
  }

  const removeAttachment = (index: number) => {
    const newAttachments = (expressionData.attachments || []).filter((_, i) => i !== index)

    setExpressionData({ ...expressionData, attachments: newAttachments })
  }

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Debug logging
  console.log('HomeComponent render - user:', user, 'userEmpId:', userEmpId, 'loading:', loading)
  console.log('Current date values - month:', currentMonth, 'year:', currentYear)

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
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className='mt-4 text-sm text-gray-700 bg-gray-100 p-3 rounded-lg'>
              <p>User: {user ? 'Available' : 'Not found'}</p>
              <p>UserEmpId: {userEmpId || 'Not found'}</p>
              <p>Loading: {loading ? 'True' : 'False'}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  interface StatCardProps {
    title: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    bgColor: string
    textColor: string
  }

const StatCard = ({ title, value, icon: Icon, bgColor, textColor }: StatCardProps) => (
  <div className='bg-white rounded-lg p-4 shadow-md border-2 border-gray-200'>
    <div className='flex items-start justify-between'>
      <div className='flex-1 pr-2'>
        <p className='text-sm text-gray-800 font-medium mb-1 leading-tight min-h-[2.5rem] flex items-end'>{title}</p>
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

  const ExpressionCardSkeleton = () => (
    <div className='bg-white rounded-lg p-4 shadow-md border-2 border-gray-200 mb-3 animate-pulse'>
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center'>
          <div className='w-10 h-10 bg-gray-200 rounded-full mr-3'></div>
          <div>
            <div className='h-4 bg-gray-300 rounded w-24 mb-1'></div>
            <div className='h-3 bg-gray-300 rounded w-16'></div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-6 bg-gray-300 rounded-full w-16'></div>
          <div className='h-4 w-4 bg-gray-300 rounded'></div>
        </div>
      </div>
      <div className='space-y-2 mb-3'>
        <div className='h-4 bg-gray-300 rounded w-full'></div>
        <div className='h-4 bg-gray-300 rounded w-3/4'></div>
      </div>
    </div>
  )

  interface ExpressionCardProps {
    expression: Expression & { from?: string; to?: string; status?: string; content?: string }
    showActions?: boolean
    clickable?: boolean
    showRecipient?: boolean
  }

  const ExpressionCard = ({
    expression,
    showActions = false,
    clickable = false,
    showRecipient = false
  }: ExpressionCardProps) => (
    <div
      className={`bg-white rounded-lg p-4 shadow-md border-2 border-gray-200 mb-3 ${
        clickable ? 'cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200' : ''
      }`}
      onClick={
        clickable
          ? () => {
              // If it's a draft or if we're in the "My Expressions" tab, open for editing
             if (expression.expressionStatus === 'draft' || expression.status === 'draft') {
              handleEditExpression(expression)
            } else {
              setSelectedExpression(expression)
            }
            }
          : undefined
      }
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()

                // If it's a draft or if we're in the "My Expressions" tab, open for editing
                if (expression.expressionStatus === 'draft' || expression.status === 'draft') {
              handleEditExpression(expression)
            } else {
              setSelectedExpression(expression)
            }
              }
            }
          : undefined
      }
      aria-label={
        clickable
          ? expression.expressionStatus === 'draft' || expression.status === 'draft' || (activeTab === 1 && showActions)
            ? `แก้ไขความคิดเห็น`
            : `ดูรายละเอียดความคิดเห็นจาก ${expression.from || expression.to}`
          : undefined
      }
    >
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center'>
          <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 border-2 border-blue-200'>
            <User className='w-5 h-5 text-blue-700' />
          </div>
          <div>
            <p className='font-semibold text-sm text-gray-900'>
              {getEmployeeName(showRecipient ? expression.EXP_TO || '' : expression.CR_UID || '')}
            </p>
            <p className='text-xs text-gray-700 font-medium'>{expression.date || expression.EXP_DATE}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              expression.TYPE === 'praise'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-orange-100 text-orange-800 border border-orange-300'
            }`}
          >
            {expression.TYPE === 'praise' ? 'ชื่นชม' : 'ต้องปรับปรุง'}
          </span>
        </div>
      </div>

      <p className='text-sm text-gray-800 mb-3 line-clamp-2 leading-relaxed'>
        {expression.EXP_DETAIL || expression.content}
      </p>

      {expression.attachments && expression.attachments.length > 0 && (
        <div className='flex flex-wrap gap-2 mb-3'>
          {/* Show first 2 attachments */}
          {expression.attachments.slice(0, 2).map((file, index) => (
            <button
              key={index}
              onClick={() => {
                if (typeof file === 'object' && file.fileId) {
                  const useFilePath = Boolean(file.url && file.url.length > 0)
                  const identifier = useFilePath ? file.url : file.fileId

                  // Add null check before calling viewFile
                  if (identifier) {
                    fileDownloadService.viewFile(identifier, useFilePath)
                  }
                }
              }}
              className='flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs text-gray-800 hover:text-gray-900 transition-colors cursor-pointer font-medium'
            >
              <div className='flex items-center gap-1'>
                {isImageFile(
                  typeof file === 'string' ? file : file.fileName,
                  typeof file === 'object' ? file.mimeType : undefined
                ) &&
                typeof file === 'object' &&
                file.fileId ? (
                  <>
                    <img
                      src={`http://192.168.55.37:18814/fileserver/displaythumb/${file.fileId}`}
                      alt={file.fileName}
                      className='w-6 h-6 object-cover rounded border'
                      onError={e => {
                        e.currentTarget.style.display = 'none'
                        const nextSibling = e.currentTarget.nextElementSibling as HTMLElement

                        if (nextSibling) {
                          nextSibling.style.display = 'block'
                        }
                      }}
                    />
                    <span className='hidden'>{getFileIcon(file.fileName, file.mimeType)}</span>
                  </>
                ) : (
                  <span className='text-sm'>
                    {typeof file === 'object' && file.mimeType ? getFileIcon(file.fileName, file.mimeType) : '📎'}
                  </span>
                )}
                <span className='truncate max-w-20'>{typeof file === 'string' ? file : file.fileName}</span>
              </div>
            </button>
          ))}

          {/* Show +X indicator if there are more than 2 attachments */}
          {expression.attachments.length > 2 && (
            <button
              onClick={() => {
                // If it's a draft or if we're in the "My Expressions" tab, open for editing
                if (expression.expressionStatus === 'draft' || expression.status === 'draft' || (activeTab === 1 && showActions)) {
                  handleEditExpression(expression)
                } else {
                  setSelectedExpression(expression)
                }
              }}
              className='flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs text-gray-600 hover:text-gray-800 transition-colors cursor-pointer font-medium'
            >
              <span className='text-sm'>+{expression.attachments.length - 2}</span>
              <span className='text-xs'>ไฟล์เพิ่มเติม</span>
            </button>
          )}
        </div>
      )}

      {/* Show action buttons for my expressions - updated condition */}
      {showActions && activeTab === 1 && (
        <div className='flex justify-end gap-2 pt-2 border-t border-gray-200'>
          {/* Edit button - show for all my expressions */}
          <button
            onClick={e => {
              e.stopPropagation()
              handleEditExpression(expression)
            }}
            className='w-10 h-10 text-gray-600 bg-white hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-gray-300 hover:border-blue-300'
            aria-label='แก้ไข'
          >
            <Edit3 className='w-4 h-4' />
          </button>
          {/* Delete button - show for all my expressions */}
          <button
            onClick={e => {
              e.stopPropagation()
              handleDeleteExpression(expression.EXP_ID)
            }}
            className='w-10 h-10 text-gray-600 bg-white hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-gray-300 hover:border-red-300'
            aria-label='ลบ'
          >
            <Trash2 className='w-4 h-4' />
          </button>
        </div>
      )}

      {(expression.expressionStatus || expression.status) && (
        <div className='mt-2 pt-2 border-t border-gray-200'>
          <span
            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
              (expression.expressionStatus || expression.status) === 'published'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            {(expression.expressionStatus || expression.status) === 'published' ? 'เผยแพร่แล้ว' : 'ร่าง'}
          </span>
        </div>
      )}
    </div>
  )

  interface ExpressionDetailModalProps {
    expression:
      | (Expression & {
          from?: string
          department?: string
          position?: string
          fullContent?: string
          content?: string
        })
      | null
    onClose: () => void
  }

  const ExpressionDetailModal = ({ expression, onClose }: ExpressionDetailModalProps) => {
    if (!expression) return null

    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center'>
        <div className='bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-lg md:max-h-[90vh] flex flex-col border-2 border-gray-300 shadow-2xl'>
          <div className='flex items-center justify-between p-4 border-b-2 border-gray-200 flex-shrink-0 bg-gray-50'>
            <h2 className='text-lg font-bold text-gray-900'>รายละเอียดความคิดเห็น</h2>
            <button
              onClick={onClose}
              className='!text-gray-600 hover:!text-gray-900 hover:!bg-gray-200 p-2 rounded-lg transition-colors'
              style={{ color: '#4b5563', backgroundColor: 'transparent' }}
              aria-label='ปิด'
            >
              <X className='w-6 h-6' />
            </button>
          </div>

          <div className='p-4 space-y-4 flex-1 overflow-y-auto'>
            <div className='flex justify-center'>
              <span
                className={`px-4 py-2 text-sm font-semibold rounded-full border-2 ${
                  expression.TYPE === 'praise'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-orange-100 text-orange-800 border-orange-300'
                }`}
              >
                {expression.TYPE === 'praise' ? 'ชื่นชม' : 'ต้องปรับปรุง'}
              </span>
            </div>

            <div>
              <label className='block text-sm font-bold text-gray-800 mb-2'>จาก</label>
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200'>
                <div>
                  <p className='font-bold text-gray-900'>{getEmployeeName(expression.CR_UID)}</p>
                </div>
              </div>
            </div>

            <div>
              <label className='block text-sm font-bold text-gray-800 mb-2'>วันที่และเวลา</label>
              <div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-800 border-2 border-gray-200'>
                <div className='flex items-center gap-1'>
                  <Calendar className='w-4 h-4 text-blue-600' />
                  <span className='font-medium'>{expression.date || expression.EXP_DATE}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Clock className='w-4 h-4 text-blue-600' />
                  <span className='font-medium'>{expression.time || ''}</span>
                </div>
              </div>
            </div>

            <div>
              <label className='block text-sm font-bold text-gray-800 mb-2'>เนื้อหา</label>
              <div className='p-4 bg-gray-50 rounded-lg border-2 border-gray-200'>
                <p className='text-gray-800 leading-relaxed font-medium'>
                  {expression.EXP_DETAIL || expression.fullContent || expression.content}
                </p>
              </div>
            </div>

            {expression.attachments && expression.attachments.length > 0 && (
              <div>
                <label className='block text-sm font-bold text-gray-800 mb-2'>ไฟล์แนบ</label>
                <div className='space-y-2'>
                  {expression.attachments.map((file, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (typeof file === 'object' && file.fileId) {
                          const useFilePath = Boolean(file.url && file.url.length > 0)
                          const identifier = useFilePath ? file.url : file.fileId

                          // Add null check before calling viewFile
                          if (identifier) {
                            fileDownloadService.viewFile(identifier, useFilePath)
                          }
                        }
                      }}
                      className='flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-gray-800 hover:text-gray-900 transition-colors cursor-pointer w-full'
                    >
                      <div className='flex-shrink-0'>
                        {isImageFile(
                          typeof file === 'string' ? file : file.fileName,
                          typeof file === 'object' ? file.mimeType : undefined
                        ) &&
                        typeof file === 'object' &&
                        file.fileId ? (
                          <>
                            <img
                              src={`http://192.168.55.37:18814/fileserver/displaythumb/${file.fileId}`}
                              alt={file.fileName}
                              className='w-12 h-12 object-cover rounded border'
                              onError={e => {
                                e.currentTarget.style.display = 'none'
                                const nextSibling = e.currentTarget.nextElementSibling as HTMLElement

                                if (nextSibling) {
                                  nextSibling.style.display = 'block'
                                }
                              }}
                            />
                            <span className='hidden text-xl'>
                              {typeof file === 'object' && file.mimeType
                                ? fileDownloadService.getFileIcon(file.mimeType)
                                : '📎'}
                            </span>
                          </>
                        ) : (
                          <span className='text-xl'>
                            {typeof file === 'object' && file.mimeType
                              ? fileDownloadService.getFileIcon(file.mimeType)
                              : '📎'}
                          </span>
                        )}
                      </div>
                      <div className='flex-1 min-w-0 text-left'>
                        <p className='text-gray-800 truncate font-medium'>
                          {typeof file === 'string' ? file : file.fileName}
                        </p>
                        {typeof file === 'object' && file.size && (
                          <p className='text-xs text-gray-600 font-medium'>{(file.size / 1024).toFixed(1)} KB</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='p-4 border-t-2 border-gray-200 bg-gray-50 flex-shrink-0'>
            <button
              onClick={onClose}
              className='w-full py-3 px-4 !bg-blue-600 !text-white rounded-lg hover:!bg-blue-700 transition-colors font-semibold border-2 border-blue-600 hover:border-blue-700'
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    )
  }

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

      {/* Stats Cards */}
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
              <StatCard
                title='ชื่นชม'
                value={currentStats.praise}
                icon={ThumbsUp}
                bgColor='bg-green-100'
                textColor='text-green-700'
              />
              <StatCard
                title='ต้องปรับปรุง'
                value={currentStats.suggestions}
                icon={MessageSquare}
                bgColor='bg-orange-100'
                textColor='text-orange-700'
              />
              <StatCard
                title='ชื่นชม (ทั้งหมด)'
                value={currentStats.public}
                icon={Eye}
                bgColor='bg-blue-100'
                textColor='text-blue-700'
              />
              <StatCard
                title='ต้องปรับปรุง (ทั้งหมด)'
                value={currentStats.private}
                icon={EyeOff}
                bgColor='bg-gray-100'
                textColor='text-gray-700'
              />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className=' mb-4 bg-white rounded-lg shadow-md border-2 border-gray-200'>
        <div className='flex border-b-2 border-gray-200'>
          <button
            onClick={() => setActiveTab(0)}
            className={`flex-1 py-4 px-4 text-sm font-semibold transition-colors ${
              activeTab === 0
                ? '!text-blue-700 border-b-2 border-blue-600 !bg-blue-50'
                : '!text-gray-700 hover:!text-gray-900 hover:!bg-gray-50'
            }`}
            style={
              activeTab === 0
                ? { color: '#1d4ed8', backgroundColor: '#eff6ff' }
                : { color: '#374151', backgroundColor: '#ffffff' }
            }
          >
            ที่ได้รับ ({filteredExpressions.length})
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 py-4 px-4 text-sm font-semibold transition-colors ${
              activeTab === 1
                ? '!text-blue-700 border-b-2 border-blue-600 !bg-blue-50'
                : '!text-gray-700 hover:!text-gray-900 hover:!bg-gray-50'
            }`}
            style={
              activeTab === 1
                ? { color: '#1d4ed8', backgroundColor: '#eff6ff' }
                : { color: '#374151', backgroundColor: '#ffffff' }
            }
          >
            ที่แสดงความคิดเห็น ({filteredMyExpressions.length})
          </button>
        </div>

        <div className='p-2'>
          {activeTab === 0 && (
            <div>
              <h3 className='text-lg font-bold mb-4 text-gray-900'>ความคิดเห็นที่ได้รับ</h3>
              {periodLoading ? (
                <>
                  <ExpressionCardSkeleton />
                  <ExpressionCardSkeleton />
                  <ExpressionCardSkeleton />
                </>
              ) : filteredExpressions.length === 0 ? (
                <div className='text-center py-8 text-gray-600 bg-gray-50 rounded-lg border-2 border-gray-200'>
                  <p className='font-medium'>ไม่มีความคิดเห็นในช่วงเวลานี้</p>
                </div>
              ) : (
                filteredExpressions.map(expression => (
                  <ExpressionCard
                    key={expression.EXP_ID}
                    expression={expression}
                    clickable={true}
                    showRecipient={false} // Show sender name (CR_UID)
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <h3 className='text-lg font-bold mb-4 text-gray-900'>ความคิดเห็นที่แสดง</h3>
              {periodLoading ? (
                <>
                  <ExpressionCardSkeleton />
                  <ExpressionCardSkeleton />
                  <ExpressionCardSkeleton />
                </>
              ) : filteredMyExpressions.length === 0 ? (
                <div className='text-center py-8 text-gray-600 bg-gray-50 rounded-lg border-2 border-gray-200'>
                  <p className='font-medium'>ไม่มีความคิดเห็นในช่วงเวลานี้</p>
                </div>
              ) : (
                filteredMyExpressions.map(expression => (
                  <ExpressionCard
                    key={expression.EXP_ID}
                    expression={expression}
                    showActions={true}
                    showRecipient={true} // Show recipient name (EXP_TO)
                    clickable={true}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setNewExpressionOpen(true)}
        className='fixed bottom-6 right-6 w-16 h-16 !bg-blue-600 !text-white rounded-full shadow-lg hover:!bg-blue-700 flex items-center justify-center transition-all duration-200 hover:scale-105 border-2 border-blue-600 hover:border-blue-700'
        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
        aria-label='แสดงความคิดเห็นใหม่'
      >
        <Plus className='w-7 h-7' />
      </button>

      {/* Expression Detail Modal */}
      {selectedExpression && (
        <ExpressionDetailModal expression={selectedExpression} onClose={() => setSelectedExpression(null)} />
      )}

      {/* New Expression Modal */}
      {newExpressionOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center'>
          <div className='bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-lg md:max-h-[90vh] flex flex-col border-2 border-gray-300 shadow-2xl'>
            <div className='flex items-center justify-between p-4 border-b-2 border-gray-200 flex-shrink-0 bg-gray-50'>
              <h2 className='text-lg font-bold text-gray-900'>
                {editingExpression ? 'แก้ไขความคิดเห็น' : 'แสดงความคิดเห็นใหม่'}
              </h2>
              <button
                onClick={() => setNewExpressionOpen(false)}
                className='!text-gray-600 hover:!text-gray-900 hover:!bg-gray-200 p-2 rounded-lg transition-colors'
                style={{ color: '#4b5563', backgroundColor: 'transparent' }}
                aria-label='ปิด'
              >
                <X className='w-6 h-6' />
              </button>
            </div>

            <div className='p-4 space-y-4 flex-1 overflow-y-auto'>
              <div>
                <label className='block text-sm font-bold text-gray-800 mb-2'>ประเภท</label>
                <div className='flex rounded-lg border-2 border-gray-300 overflow-hidden shadow-sm'>
                  <button
                    onClick={() => setExpressionData({ ...expressionData, type: 'praise' })}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                      expressionData.type === 'praise'
                        ? '!bg-green-600 !text-white'
                        : '!bg-white !text-gray-800 hover:!bg-green-50'
                    }`}
                    style={
                      expressionData.type === 'praise'
                        ? { backgroundColor: '#16a34a', color: '#ffffff' }
                        : { backgroundColor: '#ffffff', color: '#1f2937' }
                    }
                  >
                    <Heart className='w-4 h-4' />
                    ชื่นชม
                  </button>
                  <button
                    onClick={() => setExpressionData({ ...expressionData, type: 'suggestion' })}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                      expressionData.type === 'suggestion'
                        ? '!bg-orange-600 !text-white'
                        : '!bg-white !text-gray-800 hover:!bg-orange-50'
                    }`}
                    style={
                      expressionData.type === 'suggestion'
                        ? { backgroundColor: '#ea580c', color: '#ffffff' }
                        : { backgroundColor: '#ffffff', color: '#1f2937' }
                    }
                  >
                    <Lightbulb className='w-4 h-4' />
                    แนะให้แก้ไข
                  </button>
                </div>
              </div>

              <div>
                <label className='block text-sm font-bold text-gray-800 mb-2'>ถึง</label>
                <div
                  style={{ backgroundColor: '#ffffff', color: '#1f2937' }}
                  className='[&_*]:!bg-white [&_*]:!text-gray-900 [&_button]:!bg-white [&_button]:!text-gray-900 [&_select]:!bg-white [&_select]:!text-gray-900 [&_input]:!bg-white [&_input]:!text-gray-900'
                >
                  <EmployeeDropdown
                    value={expressionData.recipient}
                    onChange={empId => setExpressionData({ ...expressionData, recipient: empId })}
                    placeholder='เลือกผู้รับ'
                    disabled={loading}
                    excludeEmpId={userEmpId} // Exclude current user from selection
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-bold text-gray-800 mb-2'>เนื้อหา</label>
                <textarea
                  value={expressionData.content}
                  onChange={e => setExpressionData({ ...expressionData, content: e.target.value })}
                  placeholder='แสดงความคิดเห็น...'
                  rows={4}
                  className='w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 font-medium shadow-sm'
                />
              </div>

              <div>
                <label className='block text-sm font-bold text-gray-800 mb-2'>การเปิดเผย</label>
                <div className='flex rounded-lg border-2 border-gray-300 overflow-hidden shadow-sm'>
                  <button
                    onClick={() => setExpressionData({ ...expressionData, privacy: 'public' })}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                      expressionData.privacy === 'public'
                        ? '!bg-blue-600 !text-white'
                        : '!bg-white !text-gray-800 hover:!bg-blue-50'
                    }`}
                    style={
                      expressionData.privacy === 'public'
                        ? { backgroundColor: '#2563eb', color: '#ffffff' }
                        : { backgroundColor: '#ffffff', color: '#1f2937' }
                    }
                  >
                    <Eye className='w-4 h-4' />
                    เปิดเผย
                  </button>
                  <button
                    onClick={() => setExpressionData({ ...expressionData, privacy: 'private' })}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                      expressionData.privacy === 'private'
                        ? '!bg-gray-600 !text-white'
                        : '!bg-white !text-gray-800 hover:!bg-gray-50'
                    }`}
                    style={
                      expressionData.privacy === 'private'
                        ? { backgroundColor: '#4b5563', color: '#ffffff' }
                        : { backgroundColor: '#ffffff', color: '#1f2937' }
                    }
                  >
                    <EyeOff className='w-4 h-4' />
                    ไม่เปิดเผย
                  </button>
                </div>
              </div>

              <div>
                <input
                  type='file'
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileUpload}
                  className='hidden'
                  accept='image/*,video/*,.pdf'
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading || (expressionData.attachments?.length ?? 0) >= 10}
                  className={`w-full p-4 border-2 border-dashed border-gray-400 rounded-lg hover:border-blue-500 flex items-center justify-center gap-2 !text-gray-700 hover:!text-blue-700 font-medium transition-colors ${
                    uploadLoading || (expressionData.attachments?.length ?? 0) >= 10
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:!bg-blue-50 !bg-white'
                  }`}
                  style={{ backgroundColor: '#ffffff', color: '#374151' }}
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 className='w-5 h-5 animate-spin' />
                      กำลังอัปโหลด... {uploadProgress > 0 && `${uploadProgress}%`}
                    </>
                  ) : (
                    <>
                      <Paperclip className='w-5 h-5' />
                      แนบไฟล์ (รูปภาพ, วิดีโอ, PDF) ({expressionData.attachments?.length ?? 0}/10)
                    </>
                  )}
                </button>
                <p className='text-xs text-gray-700 mt-2 font-medium'>
                  อัปโหลดได้เฉพาะรูปภาพ, วิดีโอ, และ PDF เท่านั้น | สูงสุด 10 ไฟล์ ไฟล์ละไม่เกิน 10MB
                </p>
                {(expressionData.attachments?.length ?? 0) > 0 && (
                  <div className='mt-3 space-y-2'>
                    {(expressionData.attachments || []).map((file, index) => {
                      const fileName = typeof file === 'string' ? file : file.fileName
                      const fileSize = typeof file === 'object' && file.size ? file.size : null
                      const mimeType = typeof file === 'object' && file.mimeType ? file.mimeType : undefined
                      const fileId = typeof file === 'object' && file.fileId ? file.fileId : null

                      return (
                        <div
                          key={index}
                          className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200'
                        >
                          <div className='flex items-center gap-3 flex-1 min-w-0'>
                            <div className='flex-shrink-0'>
                              {isImageFile(fileName, mimeType) && fileId ? (
                                <>
                                  <img
                                    src={`http://192.168.55.37:18814/fileserver/displaythumb/${fileId}`}
                                    alt={fileName}
                                    className='w-8 h-8 object-cover rounded border'
                                    onError={e => {
                                      e.currentTarget.style.display = 'none'
                                      const nextSibling = e.currentTarget.nextElementSibling as HTMLElement

                                      if (nextSibling) {
                                        nextSibling.style.display = 'block'
                                      }
                                    }}
                                  />
                                  <span className='hidden'>{getFileIcon(fileName, mimeType)}</span>
                                </>
                              ) : (
                                getFileIcon(fileName, mimeType)
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='text-sm font-semibold text-gray-900 truncate'>{fileName}</div>
                              {fileSize && (
                                <div className='text-xs text-gray-700 font-medium'>{formatFileSize(fileSize)}</div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className='text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors border border-red-300 hover:border-red-400'
                            aria-label={`ลบไฟล์ ${fileName}`}
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className='p-4 border-t-2 border-gray-200 bg-gray-50 flex gap-3 flex-shrink-0'>
              <button
                onClick={() => {
                  setNewExpressionOpen(false)
                  setEditingExpression(null)
                   setShowPublishConfirmation(false)
                  setExpressionData({
                    type: 'praise',
                    recipient: '',
                    content: '',
                    attachments: [] as CreateExpressionRequest['attachments'],
                    privacy: 'public',
                    status: 'draft'
                  })
                }}
                className='flex-1 py-3 px-4 border-2 border-gray-400 rounded-lg !text-gray-800 hover:!bg-gray-100 font-semibold transition-colors !bg-white'
                style={{ backgroundColor: '#ffffff', color: '#1f2937' }}
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => setShowPublishConfirmation(true)}
                className='flex-1 py-3 px-4 !bg-blue-600 !text-white rounded-lg hover:!bg-blue-700 flex items-center justify-center gap-2 font-semibold transition-colors border-2 border-blue-600 hover:border-blue-700'
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                disabled={createLoading}
              >
                {createLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
                เผยแพร่
              </button>
            </div>
          </div>
        </div>
      )}

        <PublishConfirmationModal />
    </div>
  )
}

export default FeedbackDashboard
