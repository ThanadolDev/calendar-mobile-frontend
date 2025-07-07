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

// Stat Card Component
interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  textColor: string
  onClick: () => void
  disabled?: boolean
}

const StatCard = ({ title, value, icon: Icon, bgColor, textColor, onClick, disabled = false }: StatCardProps) => (
  <div 
    className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
      disabled ? 'opacity-50' : ''
    }`}
    onClick={!disabled ? onClick : undefined}
  >
    <div className='flex flex-col items-center text-center space-y-3'>
      <div className={`w-16 h-16 rounded-full ${bgColor} flex items-center justify-center shadow-sm`}>
        <Icon className={`w-8 h-8 ${textColor}`} />
      </div>
      <div>
        <p className={`text-3xl font-bold ${textColor} mb-1`}>{value}</p>
        <p className='text-sm text-gray-700 font-medium leading-tight'>{title}</p>
      </div>
    </div>
  </div>
)

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
}

const ExpressionListModal = ({
  isOpen,
  onClose,
  title,
  expressions,
  loading,
  searchTerm,
  onSearchChange,
  onExpressionClick
}: ExpressionListModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาตามชื่อพนักงานหรือประเภท..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : expressions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ไม่พบข้อมูล
            </div>
          ) : (
            <div className="grid gap-4">
              {expressions.map((expression) => (
                <div
                  key={expression.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onExpressionClick?.(expression)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      expression.type === 'ชื่นชม' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {expression.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(expression.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2">{expression.detail}</p>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>โดย: {expression.created_by_name}</span>
                    <span>ถึง: {expression.to_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
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

  // New flow state management
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly')
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  
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

  // Calculate statistics for current period
  const stats = useMemo(() => {
    if (viewMode === 'monthly') {
      return calculateStatsForPeriod(currentYear, currentMonth)
    } else {
      return calculateStatsForPeriod(currentYear)
    }
  }, [calculateStatsForPeriod, currentYear, currentMonth, viewMode])

  // Filter expressions for modal
  const filteredExpressions = useMemo(() => {
    if (!expressionListModal.type) return []
    
    let baseExpressions = activeTab === 'received' ? expressions : myExpressions
    
    // Filter by type and visibility
    switch (expressionListModal.type) {
      case 'all_good':
        baseExpressions = baseExpressions.filter(exp => exp.type === 'ชื่นชม' && exp.is_public)
        break
      case 'all_improve':
        baseExpressions = baseExpressions.filter(exp => exp.type === 'ต้องปรับปรุง' && exp.is_public)
        break
      case 'private_good':
        baseExpressions = baseExpressions.filter(exp => exp.type === 'ชื่นชม' && !exp.is_public)
        break
      case 'private_improve':
        baseExpressions = baseExpressions.filter(exp => exp.type === 'ต้องปรับปรุง' && !exp.is_public)
        break
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      baseExpressions = baseExpressions.filter(exp => 
        exp.created_by_name?.toLowerCase().includes(searchLower) ||
        exp.to_name?.toLowerCase().includes(searchLower) ||
        exp.type?.toLowerCase().includes(searchLower) ||
        exp.detail?.toLowerCase().includes(searchLower)
      )
    }

    return baseExpressions
  }, [expressionListModal.type, activeTab, expressions, myExpressions, searchTerm])

  // Load data when component mounts or period changes
  useEffect(() => {
    if (userEmpId) {
      loadReceivedExpressions(userEmpId)
      loadSentExpressions(userEmpId)
    }
  }, [userEmpId, loadReceivedExpressions, loadSentExpressions])

  // Handle card clicks
  const handleCardClick = (type: 'all_good' | 'all_improve' | 'private_good' | 'private_improve') => {
    // Check if card should be disabled
    const isPrivateCard = type.includes('private')
    const isDisabled = activeTab === 'received' && isPrivateCard

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
  const isPrivateCardDisabled = activeTab === 'received'

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header with period selector */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
            <div className='flex items-center space-x-4'>
              <h1 className='text-3xl font-bold text-gray-900'>แดชบอร์ดความคิดเห็น</h1>
            </div>

            {/* Period Selector */}
            <div className='flex items-center space-x-4'>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'monthly' | 'yearly')}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value="monthly">รายเดือน</option>
                <option value="yearly">รายปี</option>
              </select>

              {viewMode === 'monthly' && (
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              )}

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8'>
          <div className='flex space-x-1 bg-gray-100 rounded-lg p-1'>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ที่ได้รับ
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ที่แสดงความคิดเห็น
            </button>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <StatCard
            title="ชื่นชม (สาธารณะ)"
            value={stats.publicAppreciation || 0}
            icon={ThumbsUp}
            bgColor="bg-green-100"
            textColor="text-green-600"
            onClick={() => handleCardClick('all_good')}
          />
          <StatCard
            title="ต้องปรับปรุง (สาธารณะ)"
            value={stats.publicImprovement || 0}
            icon={AlertCircle}
            bgColor="bg-orange-100"
            textColor="text-orange-600"
            onClick={() => handleCardClick('all_improve')}
          />
          <StatCard
            title="ชื่นชม (ส่วนตัว)"
            value={stats.privateAppreciation || 0}
            icon={Heart}
            bgColor="bg-pink-100"
            textColor="text-pink-600"
            onClick={() => handleCardClick('private_good')}
            disabled={isPrivateCardDisabled}
          />
          <StatCard
            title="ต้องปรับปรุง (ส่วนตัว)"
            value={stats.privateImprovement || 0}
            icon={Lightbulb}
            bgColor="bg-purple-100"
            textColor="text-purple-600"
            onClick={() => handleCardClick('private_improve')}
            disabled={isPrivateCardDisabled}
          />
        </div>

        {/* Add Button */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <div className='flex justify-center'>
            <button className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors'>
              <Plus className='w-5 h-5' />
              <span>เพิ่มความคิดเห็น</span>
            </button>
          </div>
        </div>

        {/* Expression List Modal */}
        <ExpressionListModal
          isOpen={expressionListModal.isOpen}
          onClose={handleModalClose}
          title={expressionListModal.title}
          expressions={filteredExpressions}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>
    </div>
  )
}

export default FeedbackDashboard