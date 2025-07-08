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
import { formatDate, formatTime } from '../../utils/formatters'

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
    updateLoading,
    deleteLoading,
    statsLoading,
    error,
    createExpression,
    loadReceivedExpressions,
    loadSentExpressions,
    updateExpression,
    deleteExpression,
    clearError,
    calculateStatsForPeriod
  } = useExpressions()

  // New flow state management
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => {
    const month = new Date().getMonth()
    console.log('Initial month:', month, new Date())
    return month
  })
  const [timePeriod, setTimePeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [activeTab, setActiveTab] = useState(0)
  const [periodLoading, setPeriodLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Combined loading state for better UX
  const isAnyLoading = loading || createLoading || updateLoading || deleteLoading || statsLoading || periodLoading || uploadLoading
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false)
  const [newExpressionOpen, setNewExpressionOpen] = useState(false)

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

  // Modal states
  const [expressionListModal, setExpressionListModal] = useState<{
    isOpen: boolean
    type: 'all_good' | 'all_improve' | 'private_good' | 'private_improve' | null
    title: string
  }>({
    isOpen: false,
    type: null,
    title: ''
  })

  const [searchTerm, setSearchTerm] = useState('')

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
        navigateMonth(-1)
      } else if (isRightSwipe) {
        navigateMonth(1)
      }
    } else {
      if (isLeftSwipe) {
        navigateYear(-1)
      } else if (isRightSwipe) {
        navigateYear(1)
      }
    }
  }

  // Navigation functions
  const navigateMonth = (direction: number) => {
    setPeriodLoading(true)
    const newMonth = currentMonth + direction

    console.log('navigateMonth - current:', currentMonth, 'direction:', direction, 'newMonth:', newMonth)

    // Use React.startTransition to ensure state updates are batched properly
    React.startTransition(() => {
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
    })
  }

  const navigateYear = (direction: number) => {
    setPeriodLoading(true)
    React.startTransition(() => {
      setCurrentYear(currentYear + direction)
    })
  }

  const PublishConfirmationModal = () => {
    if (!showPublishConfirmation) return null

    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300'>
        <div className='bg-white rounded-lg max-w-sm w-full shadow-2xl border-2 border-gray-300 animate-in zoom-in-95 duration-300'>
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
                  if (editingExpression) {
                    handleUpdateExpression('published')
                  } else {
                    handleSaveExpression('published')
                  }
                }}
                className='flex-1 py-3 px-4 !bg-blue-600 !text-white rounded-lg hover:!bg-blue-700 font-semibold transition-colors border-2 border-blue-600 hover:border-blue-700'
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                disabled={createLoading || updateLoading}
              >
                {(createLoading || updateLoading) ? (
                  <div className='flex items-center justify-center gap-2'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    {editingExpression ? 'กำลังอัปเดต...' : 'กำลังเผยแพร่...'}
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
    return filtered
  }, [expressions, timePeriod, currentMonth, currentYear])

  const filteredMyExpressions = useMemo(() => {
    const filtered = myExpressions
    return filtered
  }, [myExpressions, timePeriod, currentMonth, currentYear])

  // Calculate stats for current time period based on active tab
  const currentStats = useMemo(() => {
    const baseExpressions = activeTab === 0 ? expressions : myExpressions

    // Calculate stats based on current expressions and active tab
    // Backend uses: TYPE='praise'/'suggestion' and EXP_KIND='X'(public)/'H'(private)
    const praisePublic = baseExpressions.filter(exp => exp.TYPE === 'praise' && exp.EXP_KIND === 'X').length
    const praisePrivate = baseExpressions.filter(exp => exp.TYPE === 'praise' && exp.EXP_KIND === 'H').length
    const suggestionsPublic = baseExpressions.filter(exp => exp.TYPE === 'suggestion' && exp.EXP_KIND === 'X').length
    const suggestionsPrivate = baseExpressions.filter(exp => exp.TYPE === 'suggestion' && exp.EXP_KIND === 'H').length

    return {
      praise: praisePublic,
      suggestions: suggestionsPublic,
      private: praisePrivate,
      public: suggestionsPrivate
    }
  }, [expressions, myExpressions, activeTab])

  // Calculate statistics for new flow (keeping for backward compatibility)
  const stats = useMemo(() => {
    return currentStats
  }, [currentStats])

  // Filter expressions for modal
  const filteredExpressionsForModal = useMemo(() => {
    if (!expressionListModal.type) return []

    let baseExpressions = activeTab === 0 ? expressions : myExpressions

    // Filter by type and visibility
    // Backend uses: TYPE='praise'/'suggestion' and EXP_KIND='X'(public)/'H'(private)
    switch (expressionListModal.type) {
      case 'all_good':
        baseExpressions = baseExpressions.filter(exp => exp.TYPE === 'praise' && exp.EXP_KIND === 'X')
        break
      case 'all_improve':
        baseExpressions = baseExpressions.filter(exp => exp.TYPE === 'suggestion' && exp.EXP_KIND === 'X')
        break
      case 'private_good':
        baseExpressions = baseExpressions.filter(exp => exp.TYPE === 'praise' && exp.EXP_KIND === 'H')
        break
      case 'private_improve':
        baseExpressions = baseExpressions.filter(exp => exp.TYPE === 'suggestion' && exp.EXP_KIND === 'H')
        break
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      baseExpressions = baseExpressions.filter(exp =>
        getEmployeeName(exp.CR_UID)?.toLowerCase().includes(searchLower) ||
        getEmployeeName(exp.EXP_TO)?.toLowerCase().includes(searchLower) ||
        exp.TYPE?.toLowerCase().includes(searchLower) ||
        exp.EXP_DETAIL?.toLowerCase().includes(searchLower)
      )
    }

    return baseExpressions
  }, [expressionListModal.type, activeTab, expressions, myExpressions, searchTerm, getEmployeeName])

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
          mimeType: files.find(f => f.name === file.fileName)?.type,
          isExisting: false // Mark as new file
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

      if (event.target) {
        event.target.value = ''
      }
    }
  }

  // Handle saving expression
  const handleSaveExpression = async (status: 'draft' | 'published') => {
    if (!expressionData.recipient || !expressionData.content) {
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

        Promise.all([loadReceivedExpressions(userEmpId, filters), loadSentExpressions(userEmpId, filters)]).catch(
          error => {
            console.error('Failed to refresh expressions after create:', error)
          }
        )
      }
    } catch (error) {
      console.error('Failed to save expression:', error)
    }
  }

  // Handle editing a draft expression
  // const handleEditExpression = (expression: Expression) => {
  //   setEditingExpression(expression)
  //   setExpressionData({
  //     type: expression.TYPE || 'praise',
  //     recipient: expression.EXP_TO || '',
  //     content: expression.EXP_DETAIL || '',
  //     privacy: expression.EXP_KIND === 'X' ? 'public' : 'private',
  //     status: 'draft',
  //     // Mark existing attachments so we don't re-upload them
  //     attachments: (expression.attachments || []).map(att => ({
  //       ...att,
  //       isExisting: true // Flag to indicate this is an existing file
  //     }))
  //   })
  //   setNewExpressionOpen(true)
  // }

  // Handle deleting an expression (moves to status 'F' or soft delete)
  // const handleDeleteExpression = async (expressionId: string) => {
  //   if (!confirm('คุณต้องการลบความคิดเห็นนี้หรือไม่?')) {
  //     return
  //   }

  //   try {
  //     await deleteExpression(expressionId)

  //     // Refresh expressions after soft delete
  //     if (userEmpId) {
  //       const filters = {
  //         timePeriod,
  //         year: currentYear,
  //         ...(timePeriod === 'monthly' && { month: currentMonth })
  //       }
  //       loadSentExpressions(userEmpId, filters)
  //     }
  //   } catch (error) {
  //     console.error('Failed to delete expression:', error)
  //     alert('ไม่สามารถลบความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง')
  //   }
  // }

  // Handle updating an existing expression
  const handleUpdateExpression = async (status: 'draft' | 'published') => {
    if (!expressionData.recipient || !expressionData.content) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    if (!editingExpression) {
      return handleSaveExpression(status)
    }

    try {
      // Separate existing attachments from new ones
      const existingAttachments = (expressionData.attachments || []).filter(att =>
        typeof att === 'object' && att.isExisting
      ).map(att => {
        // Remove the isExisting flag before sending to backend
        const { isExisting, ...cleanAtt } = att
        return cleanAtt
      })

      // Get new attachments (files uploaded during edit)
      const newAttachments = (expressionData.attachments || []).filter(att =>
        typeof att === 'object' && !att.isExisting
      )

      // Combine existing and new attachments
      const allAttachments = [...existingAttachments, ...newAttachments]

      const updateData: Partial<CreateExpressionRequest> = {
        type: expressionData.type,
        recipient: expressionData.recipient,
        content: expressionData.content,
        privacy: expressionData.privacy,
        status,
        attachments: allAttachments // Send both existing and new attachments
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

  // Handle editing a draft expression
  const handleEditExpression = (expression: Expression) => {
    // Close the list modal first
    setExpressionListModal({
      isOpen: false,
      type: null,
      title: ''
    })
    setSearchTerm('')

    setEditingExpression(expression)
    setExpressionData({
      type: expression.TYPE || 'praise',
      recipient: expression.EXP_TO || '',
      content: expression.EXP_DETAIL || '',
      privacy: expression.EXP_KIND === 'X' ? 'public' : 'private',
      status: 'draft',
      attachments: (expression.attachments || []).map(att => ({
        ...att,
        isExisting: true // Flag to indicate this is an existing file
      }))
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

  // Handle card clicks
  const handleCardClick = (type: 'all_good' | 'all_improve' | 'private_good' | 'private_improve') => {
    // Check if card should be disabled
    const isPrivateCard = type.includes('private')
    const isDisabled = activeTab === 0 && isPrivateCard

    if (isDisabled) return

    const titles = {
      all_good: 'ความคิดเห็นชื่นชม (สาธารณะ)',
      all_improve: 'ความคิดเห็นต้องปรับปรุง (สาธารณะ)',
      private_good: 'ความคิดเห็นชื่นชม (ส่วนตัว)',
      private_improve: 'ความคิดเห็นต้องปรับปรุง (ส่วนตัว)'
    }

    setExpressionListModal({
      isOpen: true,
      type,
      title: titles[type]
    })
  }

  // Handle modal close
  const handleModalClose = () => {
    setExpressionListModal({
      isOpen: false,
      type: null,
      title: ''
    })
    setSearchTerm('')
  }

  // Calculate if cards should be disabled
  const isPrivateCardDisabled = activeTab === 0

  // Loading Skeleton Component
  const StatCardSkeleton = () => (
    <div className='bg-white rounded-2xl p-8 shadow-sm border border-gray-100'>
      <div className='flex flex-col items-center text-center space-y-4 animate-pulse'>
        <div className='w-20 h-20 rounded-full bg-gray-200'></div>
        <div>
          <div className='h-10 w-20 bg-gray-200 rounded mb-2'></div>
          <div className='h-5 w-28 bg-gray-200 rounded'></div>
        </div>
      </div>
    </div>
  )

  // Stat Card Component
  interface StatCardProps {
    title: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    bgColor: string
    textColor: string
    onClick: () => void
    disabled?: boolean
    loading?: boolean
  }

  const StatCard = ({ title, value, icon: Icon, bgColor, textColor, onClick, disabled = false, loading = false }: StatCardProps) => {
    if (loading) {
      return <StatCardSkeleton />
    }

    return (
      <div
        className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 ${
          disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100' : ''
        }`}
        onClick={!disabled ? onClick : undefined}
      >
        <div className='flex flex-col items-center text-center space-y-4'>
          <div className={`w-20 h-20 rounded-full ${bgColor} flex items-center justify-center shadow-sm`}>
            <Icon className={`w-10 h-10 ${textColor}`} />
          </div>
          <div>
            <p className={`text-4xl font-bold ${textColor} mb-2`}>{value}</p>
            <p className='text-base text-gray-700 font-medium leading-relaxed'>{title}</p>
          </div>
        </div>
      </div>
    )
  }

  // Expression List Modal Component
  interface ExpressionListModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    expressions: Expression[]
    loading: boolean
    searchTerm: string
    onSearchChange: (term: string) => void
    onExpressionClick?: (expression: Expression) => void
    showActions?: boolean
  }

  const ExpressionListModal = ({
    isOpen,
    onClose,
    title,
    expressions,
    loading,
    searchTerm,
    onSearchChange,
    onExpressionClick,
    showActions = false
  }: ExpressionListModalProps) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center animate-in fade-in duration-300">
        <div className="bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-lg md:max-h-[90vh] flex flex-col border-2 border-gray-300 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
          <div className="flex items-center justify-between p-4 border-b-2 border-gray-200 flex-shrink-0 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="!text-gray-600 hover:!text-gray-900 hover:!bg-gray-200 p-2 rounded-lg transition-colors"
              style={{ color: '#4b5563', backgroundColor: 'transparent' }}
              aria-label="ปิด"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 border-b-2 border-gray-200 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาตามชื่อพนักงานหรือประเภท..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 font-medium shadow-sm"
              />
              <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : expressions.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-700">ไม่พบข้อมูล</p>
                <p className="text-sm text-gray-500 mt-1">ไม่มีความคิดเห็นในหมวดหมู่นี้</p>
              </div>
            ) : (
              expressions.map((expression) => (
                <div
                  key={expression.EXP_ID}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200"
                  onClick={() => onExpressionClick?.(expression)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onExpressionClick?.(expression)
                    }
                  }}
                  aria-label={`ดูรายละเอียดความคิดเห็นจาก ${getEmployeeName(expression.CR_UID)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 border-2 border-blue-200">
                        <User className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {getEmployeeName(activeTab === 0 ? expression.CR_UID || '' : expression.EXP_TO || '')}
                        </p>
                        <p className="text-xs text-gray-700 font-medium">{expression.EXP_DATE}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          expression.TYPE === 'praise'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-orange-100 text-orange-800 border border-orange-300'
                        }`}
                      >
                        {expression.TYPE === 'praise' ? 'ชื่นชม' : 'ต้องปรับปรุง'}
                      </span>
                      {expression.EXP_KIND === 'H' && (
                        <EyeOff className="w-4 h-4 text-gray-400" title="ส่วนตัว" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 mb-3 line-clamp-2 leading-relaxed">
                    {expression.EXP_DETAIL}
                  </p>

                  {expression.attachments && expression.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* Show first 2 attachments */}
                      {expression.attachments.slice(0, 2).map((file, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (typeof file === 'object' && file.fileId) {
                              const useFilePath = Boolean(file.url && file.url.length > 0)
                              const identifier = useFilePath ? file.url : file.fileId

                              if (identifier) {
                                fileDownloadService.viewFile(identifier, useFilePath)
                              }
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs text-gray-800 hover:text-gray-900 transition-colors cursor-pointer font-medium"
                        >
                          <div className="flex items-center gap-1">
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
                                  className="w-6 h-6 object-cover rounded border"
                                  onError={e => {
                                    e.currentTarget.style.display = 'none'
                                    const nextSibling = e.currentTarget.nextElementSibling as HTMLElement
                                    if (nextSibling) {
                                      nextSibling.style.display = 'block'
                                    }
                                  }}
                                />
                                <span className="hidden">{getFileIcon(file.fileName, file.mimeType)}</span>
                              </>
                            ) : (
                              <span className="text-sm">
                                {typeof file === 'object' && file.mimeType ? getFileIcon(file.fileName, file.mimeType) : '📎'}
                              </span>
                            )}
                            <span className="truncate max-w-20">{typeof file === 'string' ? file : file.fileName}</span>
                          </div>
                        </button>
                      ))}

                      {/* Show +X indicator if there are more than 2 attachments */}
                      {expression.attachments.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onExpressionClick?.(expression)
                          }}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs text-gray-600 hover:text-gray-800 transition-colors cursor-pointer font-medium"
                        >
                          <span className="text-sm">+{expression.attachments.length - 2}</span>
                          <span className="text-xs">ไฟล์เพิ่มเติม</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Show action buttons for my expressions when showActions is true */}
                  {showActions && (
                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 mt-3">
                      {/* Edit button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditExpression(expression)
                        }}
                        disabled={updateLoading || deleteLoading}
                        className={`w-10 h-10 text-gray-600 bg-white hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-gray-300 hover:border-blue-300 ${
                          updateLoading || deleteLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        aria-label="แก้ไข"
                      >
                        {updateLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Edit3 className="w-4 h-4" />
                        )}
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteExpression(expression.EXP_ID)
                        }}
                        disabled={updateLoading || deleteLoading}
                        className={`w-10 h-10 text-gray-600 bg-white hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-gray-300 hover:border-red-300 ${
                          updateLoading || deleteLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        aria-label="ลบ"
                      >
                        {deleteLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Expression Detail Modal Component (from HomeComponent)
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
      <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center animate-in fade-in duration-300'>
        <div className='bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-lg md:max-h-[90vh] flex flex-col border-2 border-gray-300 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300'>
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
                  <span className='font-medium'>{formatDate(expression.date || expression.EXP_DATE)}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Clock className='w-4 h-4 text-blue-600' />
                  <span className='font-medium'>{formatTime(expression.EXP_DATE) || expression.time || ''}</span>
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
                              {getFileIcon(file.fileName, file.mimeType)}
                            </span>
                          </>
                        ) : (
                          <span className='text-xl'>
                            {getFileIcon(file.fileName, file.mimeType)}
                          </span>
                        )}
                      </div>
                      <div className='flex-1 min-w-0 text-left'>
                        <p className='text-gray-800 truncate font-medium'>
                          {typeof file === 'string' ? file : file.fileName}
                        </p>
                        {typeof file === 'object' && file.size && (
                          <p className='text-xs text-gray-600 font-medium'>{formatFileSize(file.size)}</p>
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
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      {/* Error Message */}
      {error && (
        <div className='mx-4 mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 shadow-sm'>
          <AlertCircle className='w-5 h-5' />
          <span className='font-medium'>{error}</span>
        </div>
      )}

      {/* Loading Status Bar */}
      {isAnyLoading && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl flex items-center gap-2 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">
            {uploadLoading && `กำลังอัปโหลดไฟล์... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}`}
            {createLoading && !uploadLoading && 'กำลังสร้างความคิดเห็น...'}
            {updateLoading && !uploadLoading && 'กำลังอัปเดตความคิดเห็น...'}
            {deleteLoading && !uploadLoading && 'กำลังลบความคิดเห็น...'}
            {loading && !uploadLoading && !createLoading && !updateLoading && !deleteLoading && 'กำลังโหลดข้อมูล...'}
            {periodLoading && !loading && !uploadLoading && !createLoading && !updateLoading && !deleteLoading && 'กำลังโหลดข้อมูลช่วงเวลา...'}
            {statsLoading && !loading && !uploadLoading && !createLoading && !updateLoading && !deleteLoading && !periodLoading && 'กำลังคำนวณสถิติ...'}
          </span>
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

        {/* Month/Year Navigation */}
        <div className='mt-4'>
          <div
            className='bg-white rounded-xl p-4 flex items-center justify-between border border-gray-200 shadow-sm'
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={() => (timePeriod === 'monthly' ? navigateMonth(-1) : navigateYear(-1))}
              disabled={periodLoading || loading}
              className={`w-12 h-12 flex bg-white items-center justify-center hover:bg-gray-50 rounded-full transition-all duration-200 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md ${
                periodLoading || loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
              }`}
              aria-label={timePeriod === 'monthly' ? 'เดือนก่อนหน้า' : 'ปีก่อนหน้า'}
            >
              {periodLoading || loading ? (
                <Loader2 className='w-5 h-5 text-gray-600 animate-spin' />
              ) : (
                <ChevronLeft className='w-5 h-5 text-gray-600' />
              )}
            </button>

            <div className='text-center'>
              <p className='text-xl font-bold text-gray-900'>
                {periodLoading || loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังโหลด...
                  </span>
                ) : (
                  timePeriod === 'monthly' ? `${MONTH_NAMES[currentMonth]} ${currentYear + 543}` : `${currentYear + 543}`
                )}
              </p>
              <p className='text-sm text-gray-600 mt-1'>
                {periodLoading || loading ? 'กรุณารอสักครู่...' :
                  timePeriod === 'monthly' ? 'เลื่อนซ้าย-ขวาเพื่อเปลี่ยนเดือน' : 'เลื่อนซ้าย-ขวาเพื่อเปลี่ยนปี'
                }
              </p>
            </div>

            <button
              onClick={() => (timePeriod === 'monthly' ? navigateMonth(1) : navigateYear(1))}
              disabled={periodLoading || loading}
              className={`w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-50 rounded-full transition-all duration-200 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md ${
                periodLoading || loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
              }`}
              aria-label={timePeriod === 'monthly' ? 'เดือนถัดไป' : 'ปีถัดไป'}
            >
              {periodLoading || loading ? (
                <Loader2 className='w-5 h-5 text-gray-600 animate-spin' />
              ) : (
                <ChevronRight className='w-5 h-5 text-gray-600' />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 sm:px-8 lg:px-6 py-6'>
        {/* Tab Selector */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6'>
          <div className='flex'>
            <button
              onClick={() => setActiveTab(0)}
              className={`flex-1 py-4 px-4 text-lg font-semibold transition-all duration-200 ${
                activeTab === 0
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-blue-50'
              }`}
            >
              ที่ได้รับ
              {/* ({loading || periodLoading ? (
                <span className="inline-block w-4 h-4 bg-current opacity-50 rounded animate-pulse"></span>
              ) : (
                filteredExpressions.length
              )}) */}
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`flex-1 py-4 px-4 text-lg font-semibold transition-all duration-200 ${
                activeTab === 1
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-blue-50'
              }`}
            >
              ความคิดเห็น
              {/* ({loading || periodLoading ? (
                <span className="inline-block w-4 h-4 bg-current opacity-50 rounded animate-pulse"></span>
              ) : (
                filteredMyExpressions.length
              )}) */}
            </button>
          </div>
        </div>

        {/* Stats Cards Grid - 2x2 Layout */}
        <div className='grid grid-cols-2 gap-6 sm:gap-8 mb-12'>
          <StatCard
            title="ชื่นชม (สาธารณะ)"
            value={currentStats.praise || 0}
            icon={ThumbsUp}
            bgColor="bg-green-100"
            textColor="text-green-600"
            onClick={() => handleCardClick('all_good')}
            loading={loading || periodLoading || statsLoading}
          />
          <StatCard
            title="ต้องปรับปรุง (สาธารณะ)"
            value={currentStats.suggestions || 0}
            icon={AlertCircle}
            bgColor="bg-orange-100"
            textColor="text-orange-600"
            onClick={() => handleCardClick('all_improve')}
            loading={loading || periodLoading || statsLoading}
          />
          <StatCard
            title="ชื่นชม (ส่วนตัว)"
            value={currentStats.private || 0}
            icon={Heart}
            bgColor="bg-pink-100"
            textColor="text-pink-600"
            onClick={() => handleCardClick('private_good')}
            disabled={isPrivateCardDisabled}
            loading={loading || periodLoading || statsLoading}
          />
          <StatCard
            title="ต้องปรับปรุง (ส่วนตัว)"
            value={currentStats.public || 0}
            icon={Lightbulb}
            bgColor="bg-purple-100"
            textColor="text-purple-600"
            onClick={() => handleCardClick('private_improve')}
            disabled={isPrivateCardDisabled}
            loading={loading || periodLoading || statsLoading}
          />
        </div>

        {/* Enhanced Add Expression Button */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-12 mb-12'>
          <div className='text-center'>
            <div className='w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg'>
              <Plus className='w-10 h-10 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>แสดงความคิดเห็น</h3>
            <p className='text-lg text-gray-600 mb-8'>แบ่งปันความคิดเห็นหรือข้อเสนอแนะของคุณ</p>
            <button
              onClick={() => setNewExpressionOpen(true)}
              disabled={isAnyLoading}
              className={`inline-flex items-center space-x-4 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                isAnyLoading ? 'opacity-50 cursor-not-allowed transform-none' : ''
              }`}
            >
              {isAnyLoading ? (
                <>
                  <Loader2 className='w-7 h-7 animate-spin' />
                  <span className='text-xl'>กำลังประมวลผล...</span>
                </>
              ) : (
                <>
                  <Plus className='w-7 h-7' />
                  <span className='text-xl'>เพิ่มความคิดเห็นใหม่</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Expression List Modal */}
        <ExpressionListModal
          isOpen={expressionListModal.isOpen}
          onClose={handleModalClose}
          title={expressionListModal.title}
          expressions={filteredExpressionsForModal}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onExpressionClick={(expression) => setSelectedExpression(expression)}
          showActions={activeTab === 1}
        />

        {/* Expression Detail Modal */}
        {selectedExpression && (
          <ExpressionDetailModal expression={selectedExpression} onClose={() => setSelectedExpression(null)} />
        )}

        {/* New Expression Modal - Reusing from original HomeComponent */}
        {newExpressionOpen && (
          <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center animate-in fade-in duration-300'>
            <div className='bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-lg md:max-h-[90vh] flex flex-col border-2 border-gray-300 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300'>
              <div className='flex items-center justify-between p-4 border-b-2 border-gray-200 flex-shrink-0 bg-gray-50'>
                <h2 className='text-lg font-bold text-gray-900'>
                  {editingExpression ? 'แก้ไขความคิดเห็น' : 'แสดงความคิดเห็นใหม่'}
                </h2>
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
                      disabled={isAnyLoading}
                      excludeEmpId={userEmpId}
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
                    disabled={isAnyLoading}
                    className={`w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 font-medium shadow-sm ${
                      isAnyLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
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
                        const isExisting = typeof file === 'object' && file.isExisting
                        const fileUrl = typeof file === 'object' && file.url ? file.url : null

                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                              isExisting
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-green-50 border-green-200'
                            }`}
                          >
                            <div className='flex items-center gap-3 flex-1 min-w-0'>
                              <div className='flex-shrink-0'>
                                {/* Handle thumbnails for both existing and new files */}
                                {isImageFile(fileName, mimeType) ? (
                                  <>
                                    {/* Existing files: use file server thumbnail */}
                                    {isExisting && fileId ? (
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
                                    ) : (
                                      /* New files: use local preview or fallback to icon */
                                      fileUrl ? (
                                        <img
                                          src={fileUrl}
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
                                      ) : (
                                        getFileIcon(fileName, mimeType)
                                      )
                                    )}
                                    <span className='hidden'>{getFileIcon(fileName, mimeType)}</span>
                                  </>
                                ) : (
                                  getFileIcon(fileName, mimeType)
                                )}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2'>
                                  <div className='text-sm font-semibold text-gray-900 truncate'>{fileName}</div>
                                  {/* Status indicator */}
                                  {isExisting ? (
                                    <span className='px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full'>
                                      เดิม
                                    </span>
                                  ) : (
                                    <span className='px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full'>
                                      ใหม่
                                    </span>
                                  )}
                                </div>
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
                  disabled={isAnyLoading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => setShowPublishConfirmation(true)}
                  className='flex-1 py-3 px-4 !bg-blue-600 !text-white rounded-lg hover:!bg-blue-700 flex items-center justify-center gap-2 font-semibold transition-colors border-2 border-blue-600 hover:border-blue-700'
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  disabled={createLoading || updateLoading}
                >
                  {(createLoading || updateLoading) ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
                  เผยแพร่
                </button>
              </div>
            </div>
          </div>
        )}

        <PublishConfirmationModal />

        {/* Global Loading Overlay */}
        {(createLoading || updateLoading || deleteLoading) && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-[70] flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-gray-200 animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {createLoading && !editingExpression && 'กำลังสร้างความคิดเห็น...'}
                    {updateLoading && 'กำลังอัปเดตความคิดเห็น...'}
                    {deleteLoading && 'กำลังลบความคิดเห็น...'}
                    {createLoading && editingExpression && 'กำลังเผยแพร่ความคิดเห็น...'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    กรุณารอสักครู่...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackDashboard
