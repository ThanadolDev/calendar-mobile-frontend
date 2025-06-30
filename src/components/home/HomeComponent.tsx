"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react';

import {
  Plus,
  ThumbsUp,
  MessageSquare,
  User,
  Calendar,
  Eye,
  EyeOff,
  Paperclip,
  Save,
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
  AlertCircle
} from 'lucide-react';

import { useExpressions } from '../../hooks/useExpressions';
import { useAuth } from '../../contexts/AuthContext';
import type { CreateExpressionRequest, Expression } from '../../types/expression';
import fileUploadService from '../../services/fileUploadService';
import fileDownloadService from '../../services/fileDownloadService';
import { useEmployees } from '../../hooks/useEmployees';
import EmployeeDropdown from '../ui/EmployeeDropdown';

// Constants
const SWIPE_THRESHOLD = 50;

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const FeedbackDashboard = () => {
  // Get authenticated user data
  const { user } = useAuth();
  const userEmpId = user?.id;

  // Employee management
  const { getEmployeeName } = useEmployees();

  // Use the expressions hook for API integration
  const {
    expressions,
    myExpressions,
    loading,
    error,
    createExpression,
    loadReceivedExpressions,
    loadSentExpressions,
    clearError,
    calculateStatsForPeriod
  } = useExpressions(userEmpId);

  const [activeTab, setActiveTab] = useState(0);
  const [timePeriod, setTimePeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const month = new Date().getMonth();
    console.log('Initial month:', month);
    return month;
  });
  const [newExpressionOpen, setNewExpressionOpen] = useState(false);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [selectedExpression, setSelectedExpression] = useState<(Expression & {
    from?: string;
    department?: string;
    position?: string;
    fullContent?: string;
    content?: string;
  }) | null>(null);

  const [expressionData, setExpressionData] = useState<CreateExpressionRequest>({
    type: 'praise',
    recipient: '',
    content: '',
    attachments: [] as CreateExpressionRequest['attachments'],
    privacy: 'public',
    status: 'draft'
  });

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > SWIPE_THRESHOLD;
    const isRightSwipe = distance < -SWIPE_THRESHOLD;

    if (timePeriod === 'monthly') {
      if (isLeftSwipe) {
        navigateMonth(1);
      } else if (isRightSwipe) {
        navigateMonth(-1);
      }
    } else {
      if (isLeftSwipe) {
        navigateYear(1);
      } else if (isRightSwipe) {
        navigateYear(-1);
      }
    }
  };

  // Navigation functions
  const navigateMonth = (direction: number) => {
    setPeriodLoading(true);
    const newMonth = currentMonth + direction;

    console.log('navigateMonth - current:', currentMonth, 'direction:', direction, 'newMonth:', newMonth);

    if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else if (newMonth < 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      // Safety check to ensure month is always valid
      const safeMonth = Math.max(0, Math.min(11, newMonth));
      setCurrentMonth(safeMonth);
    }
  };

  const navigateYear = (direction: number) => {
    setPeriodLoading(true);
    setCurrentYear(currentYear + direction);
  };

  // Filter expressions based on time period
  const filteredExpressions = useMemo(() => {
    let filtered = expressions;

    // Filter by time period
    // if (timePeriod === 'monthly') {
    //   filtered = filtered.filter(exp =>
    //     exp.month === currentMonth && exp.year === currentYear
    //   );
    // } else {
    //   filtered = filtered.filter(exp => exp.year === currentYear);
    // }

    return filtered;
  }, [expressions, timePeriod, currentMonth, currentYear]);

  const filteredMyExpressions = useMemo(() => {
    let filtered = myExpressions;

    // if (timePeriod === 'monthly') {
    //   filtered = filtered.filter(exp =>
    //     exp.month === currentMonth && exp.year === currentYear
    //   );
    // } else {
    //   filtered = filtered.filter(exp => exp.year === currentYear);
    // }

    return filtered;
  }, [myExpressions, timePeriod, currentMonth, currentYear]);

  // Calculate stats for current time period
  const currentStats = useMemo(() => {
    return calculateStatsForPeriod(timePeriod, currentYear, currentMonth);
  }, [calculateStatsForPeriod, timePeriod, currentYear, currentMonth]);

  // Reload data when time period changes
  useEffect(() => {
    if (userEmpId) {
      const filters = {
        timePeriod,
        year: currentYear,
        ...(timePeriod === 'monthly' && { month: currentMonth })
      };

      const loadData = async () => {
        try {
          await Promise.all([
            loadReceivedExpressions(userEmpId, filters),
            loadSentExpressions(userEmpId, filters)
          ]);
        } finally {
          setPeriodLoading(false);
        }
      };

      loadData();
    }
  }, [userEmpId, timePeriod, currentYear, currentMonth, loadReceivedExpressions, loadSentExpressions]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    // Validate files
    const validation = fileUploadService.validateFiles(files);
    if (!validation.valid) {
      alert(`File validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    setUploadLoading(true);

    try {
      const uploadResult = await fileUploadService.uploadFiles(files);

      if (uploadResult.success && uploadResult.data?.files) {
        const newAttachments = uploadResult.data.files.map(file => ({
          fileId: file.fileId,
          fileName: file.fileName,
          type: 'FILE'
        }));

        setExpressionData({
          ...expressionData,
          attachments: [...(expressionData.attachments || []), ...newAttachments]
        });

        console.log('Files uploaded successfully:', uploadResult.data.files);
      } else {
        throw new Error(uploadResult.message || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadLoading(false);
      // Clear the input so the same file can be selected again
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Handle saving expression
  const handleSaveExpression = async (status: 'draft' | 'published') => {
    if (!expressionData.recipient || !expressionData.content) {
      // Note: Error handling is managed by the useExpressions hook
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');

      return;
    }

    try {
      const newExpressionData: CreateExpressionRequest = {
        ...expressionData,
        status
      };

      await createExpression(newExpressionData);

      // Close modal and reset form on success
      setNewExpressionOpen(false);
      setExpressionData({
        type: 'praise',
        recipient: '',
        content: '',
        attachments: [] as CreateExpressionRequest['attachments'],
        privacy: 'public',
        status: 'draft'
      });

      // Refresh the expressions data to show the new expression immediately
      if (userEmpId) {
        const filters = {
          timePeriod,
          year: currentYear,
          ...(timePeriod === 'monthly' && { month: currentMonth })
        };

        // Reload both received and sent expressions in the background to ensure consistency
        // Don't await here to make the UI feel more responsive
        Promise.all([
          loadReceivedExpressions(userEmpId, filters),
          loadSentExpressions(userEmpId, filters)
        ]).catch(error => {
          console.error('Failed to refresh expressions after create:', error);
        });
      }
    } catch (error) {
      // Error is already handled by the hook
      console.error('Failed to save expression:', error);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = (expressionData.attachments || []).filter((_, i) => i !== index);

    setExpressionData({ ...expressionData, attachments: newAttachments });
  };

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Debug logging
  console.log('HomeComponent render - user:', user, 'userEmpId:', userEmpId, 'loading:', loading);
  console.log('Current date values - month:', currentMonth, 'year:', currentYear);

  // If no user and not loading, redirect to login
  React.useEffect(() => {
    if (!user && !loading) {
      console.log('HomeComponent: No user found, redirecting to login');
      window.location.href = '/login-og';
    }
  }, [user, loading]);

  // Show loading if expressions are loading or if we're redirecting
  if (loading || !user || !userEmpId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">
            {!user ? 'กำลังตรวจสอบการเข้าสู่ระบบ...' : 'กำลังโหลดข้อมูล...'}
          </p>
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-sm text-gray-500">
              <p>User: {user ? 'Available' : 'Not found'}</p>
              <p>UserEmpId: {userEmpId || 'Not found'}</p>
              <p>Loading: {loading ? 'True' : 'False'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  interface StatCardProps {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    textColor: string;
  }

  const StatCard = ({ title, value, icon: Icon, bgColor, textColor }: StatCardProps) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>
    </div>
  );

  const StatCardSkeleton = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm border animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-300 rounded w-8"></div>
        </div>
        <div className="p-3 rounded-full bg-gray-200">
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );

  const ExpressionCardSkeleton = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm border mb-3 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
          <div>
            <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 bg-gray-300 rounded-full w-16"></div>
          <div className="h-4 w-4 bg-gray-300 rounded"></div>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    </div>
  );

  interface ExpressionCardProps {
    expression: Expression & { from?: string; to?: string; status?: string; content?: string };
    showActions?: boolean;
    clickable?: boolean;
  }

  const ExpressionCard = ({ expression, showActions = false, clickable = false }: ExpressionCardProps) => (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm border mb-3 ${
        clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={clickable ? () => setSelectedExpression(expression) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedExpression(expression);
        }
      } : undefined}
      aria-label={clickable ? `ดูรายละเอียดความคิดเห็นจาก ${expression.from || expression.to}` : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">
              {getEmployeeName(expression.CR_UID || expression.EXP_TO || expression.from || expression.to || '')}
            </p>
            <p className="text-xs text-gray-500">{expression.date || expression.EXP_DATE}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              expression.TYPE === 'praise'
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {expression.TYPE === 'praise' ? 'ชื่นชม' : 'ต้องปรับปรุง'}
          </span>
          {expression.ISPUBLIC !== undefined && (
            <button
              className="p-1 text-gray-400 hover:text-gray-600"
              aria-label={expression.ISPUBLIC == '1' ? 'ชื่นชม (ไม่ feedback)' : 'ต้องปรับปรุง (ไม่ feedback)'}
            >
              {/* {expression.ISPUBLIC == '1' ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )} */}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
        {expression.EXP_DETAIL || expression.content}
      </p>

      {expression.attachments && expression.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {expression.attachments.map((file, index) => (
            <button
              key={index}
              onClick={() => {
                if (typeof file === 'object' && file.fileId) {
                  // Use filepath if available, otherwise fall back to fileId
                  const useFilePath = file.url && file.url.length > 0;
                  const identifier = useFilePath ? file.url : file.fileId;

                  // Always use viewFile to display files in browser (uses displayfile endpoint)
                  fileDownloadService.viewFile(identifier, useFilePath);
                }
              }}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <span className="text-sm">
                {typeof file === 'object' && file.mimeType
                  ? fileDownloadService.getFileIcon(file.mimeType)
                  : '📎'
                }
              </span>
              <span className="truncate max-w-20">
                {typeof file === 'string' ? file : file.fileName}
              </span>
            </button>
          ))}
        </div>
      )}

      {clickable && (
        <div className="text-xs text-blue-600 hover:text-blue-800">
          คลิกเพื่อดูรายละเอียด →
        </div>
      )}

      {showActions && expression.status === 'draft' && (
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            className="p-1 text-gray-400 hover:text-blue-600"
            aria-label="แก้ไข"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-gray-400 hover:text-red-600"
            aria-label="ลบ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {(expression.expressionStatus || expression.status) && (
        <div className="mt-2 pt-2 border-t">
          <span
            className={`inline-block px-2 py-1 text-xs rounded ${
              (expression.expressionStatus || expression.status) === 'published'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {(expression.expressionStatus || expression.status) === 'published' ? 'เผยแพร่แล้ว' : 'ร่าง'}
          </span>
        </div>
      )}
    </div>
  );

  interface ExpressionDetailModalProps {
    expression: Expression & {
      from?: string;
      department?: string;
      position?: string;
      fullContent?: string;
      content?: string;
    } | null;
    onClose: () => void;
  }

  const ExpressionDetailModal = ({ expression, onClose }: ExpressionDetailModalProps) => {
    if (!expression) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
        <div className="bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-lg md:max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold">รายละเอียดความคิดเห็น</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="ปิด"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div className="flex justify-center">
              <span
                className={`px-4 py-2 text-sm rounded-full ${
                  expression.type === 'praise'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {expression.type === 'praise' ? 'ชื่นชม' : 'แนะนำ'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จาก
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {getEmployeeName(expression.CR_UID || expression.from || '')}
                  </p>
                  <p className="text-sm text-gray-600">{expression.department || 'แผนก'}</p>
                  <p className="text-sm text-gray-600">{expression.position || 'ตำแหน่ง'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่และเวลา
              </label>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {expression.date || expression.EXP_DATE}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {expression.time || ''}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                การเปิดเผย
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                {expression.isPublic ? <Eye className="w-5 h-5 text-blue-600" /> : <EyeOff className="w-5 h-5 text-gray-600" />}
                <span className="text-sm text-gray-700">
                  {expression.isPublic ? 'เปิดเผย' : 'ไม่เปิดเผย'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เนื้อหา
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  {expression.EXP_DETAIL || expression.fullContent || expression.content}
                </p>
              </div>
            </div>

            {expression.attachments && expression.attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ไฟล์แนบ
                </label>
                <div className="space-y-2">
                  {expression.attachments.map((file, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (typeof file === 'object' && file.fileId) {
                          // Use filepath if available, otherwise fall back to fileId
                          const useFilePath = file.url && file.url.length > 0;
                          const identifier = useFilePath ? file.url : file.fileId;

                          // Always use viewFile to display files in browser (uses displayfile endpoint)
                          fileDownloadService.viewFile(identifier, useFilePath);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors text-left"
                    >
                      <span className="text-xl">
                        {typeof file === 'object' && file.mimeType
                          ? fileDownloadService.getFileIcon(file.mimeType)
                          : '📎'
                        }
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 truncate">
                          {typeof file === 'string' ? file : file.fileName}
                        </p>
                        {typeof file === 'object' && file.size && (
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-gray-50 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Time Period Toggle */}
      <div className="p-4 bg-white border-b">
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => {
              setPeriodLoading(true);
              setTimePeriod('monthly');
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              timePeriod === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            disabled={periodLoading}
          >
            รายเดือน
          </button>
          <button
            onClick={() => {
              setPeriodLoading(true);
              setTimePeriod('yearly');
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              timePeriod === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            disabled={periodLoading}
          >
            รายปี
          </button>
        </div>

        <div
          className="mt-3 flex items-center justify-between bg-gray-50 rounded-lg p-3"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => timePeriod === 'monthly' ? navigateMonth(-1) : navigateYear(-1)}
            className="p-2 hover:bg-white rounded-full transition-colors"
            aria-label={timePeriod === 'monthly' ? 'เดือนก่อนหน้า' : 'ปีก่อนหน้า'}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">
              {timePeriod === 'monthly'
                ? `${MONTH_NAMES[currentMonth]} ${currentYear + 543}`
                : `${currentYear + 543}`
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {timePeriod === 'monthly' ? 'เลื่อนซ้าย-ขวาเพื่อเปลี่ยนเดือน' : 'เลื่อนซ้าย-ขวาเพื่อเปลี่ยนปี'}
            </p>
          </div>

          <button
            onClick={() => timePeriod === 'monthly' ? navigateMonth(1) : navigateYear(1)}
            className="p-2 hover:bg-white rounded-full transition-colors"
            aria-label={timePeriod === 'monthly' ? 'เดือนถัดไป' : 'ปีถัดไป'}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
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
                title="ชื่นชม"
                value={currentStats.praise}
                icon={ThumbsUp}
                bgColor="bg-green-100"
                textColor="text-green-600"
              />
              <StatCard
                title="ข้อแนะนำที่ได้รับ"
                value={currentStats.suggestions}
                icon={MessageSquare}
                bgColor="bg-orange-100"
                textColor="text-orange-600"
              />
              <StatCard
                title="เปิดเผย"
                value={currentStats.public}
                icon={Eye}
                bgColor="bg-blue-100"
                textColor="text-blue-600"
              />
              <StatCard
                title="ไม่เปิดเผย"
                value={currentStats.private}
                icon={EyeOff}
                bgColor="bg-gray-100"
                textColor="text-gray-600"
              />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-4 mb-4 bg-white rounded-lg shadow-sm border">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab(0)}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 0
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ที่ได้รับ ({filteredExpressions.length})
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 1
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ที่แสดงความคิดเห็น ({filteredMyExpressions.length})
          </button>
        </div>

        <div className="p-4">
          {activeTab === 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">ความคิดเห็นที่ได้รับ</h3>
              {periodLoading ? (
                <>
                  <ExpressionCardSkeleton />
                  <ExpressionCardSkeleton />
                  <ExpressionCardSkeleton />
                </>
              ) : filteredExpressions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  ไม่มีความคิดเห็นในช่วงเวลานี้
                </div>
              ) : (
                filteredExpressions.map((expression) => (
                  <ExpressionCard
                    key={expression.EXP_ID}
                    expression={expression}
                    clickable={true}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <h3 className="text-lg font-medium mb-4">ความคิดเห็นที่แสดง</h3>
              {periodLoading ? (
                <>
                  <ExpressionCardSkeleton />
                  <ExpressionCardSkeleton />
                  <ExpressionCardSkeleton />
                </>
              ) : filteredMyExpressions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  ไม่มีความคิดเห็นในช่วงเวลานี้
                </div>
              ) : (
                filteredMyExpressions.map((expression) => (
                  <ExpressionCard
                    key={expression.EXP_ID}
                    expression={expression}
                    showActions={true}
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
        aria-label="แสดงความคิดเห็นใหม่"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Expression Detail Modal */}
      {selectedExpression && (
        <ExpressionDetailModal
          expression={selectedExpression}
          onClose={() => setSelectedExpression(null)}
        />
      )}

      {/* New Expression Modal */}
      {newExpressionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-lg md:max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold">แสดงความคิดเห็นใหม่</h2>
              <button
                onClick={() => setNewExpressionOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="ปิด"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภท
                </label>
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setExpressionData({ ...expressionData, type: 'praise' })}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium ${
                      expressionData.type === 'praise'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    ชื่นชม
                  </button>
                  <button
                    onClick={() => setExpressionData({ ...expressionData, type: 'suggestion' })}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium ${
                      expressionData.type === 'suggestion'
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    แนะให้แก้ไข
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ถึง
                </label>
                <EmployeeDropdown
                  value={expressionData.recipient}
                  onChange={(empId) =>
                    setExpressionData({ ...expressionData, recipient: empId })
                  }
                  placeholder="เลือกผู้รับ"
                  disabled={loading}
                  excludeEmpId={userEmpId} // Exclude current user from selection
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เนื้อหา
                </label>
                <textarea
                  value={expressionData.content}
                  onChange={(e) =>
                    setExpressionData({ ...expressionData, content: e.target.value })
                  }
                  placeholder="แสดงความคิดเห็น..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การเปิดเผย
                </label>
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setExpressionData({ ...expressionData, privacy: 'public' })}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium ${
                      expressionData.privacy === 'public'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    เปิดเผย
                  </button>
                  <button
                    onClick={() => setExpressionData({ ...expressionData, privacy: 'private' })}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium ${
                      expressionData.privacy === 'private'
                        ? 'bg-gray-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <EyeOff className="w-4 h-4" />
                    ไม่เปิดเผย
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  className={`w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 ${
                    uploadLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <Paperclip className="w-5 h-5" />
                      แนบไฟล์
                    </>
                  )}
                </button>
                {(expressionData.attachments?.length ?? 0) > 0 && (
                  <div className="mt-2 space-y-2">
                    {(expressionData.attachments || []).map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-100 rounded"
                      >
                        <span className="text-sm text-gray-700">
                          {typeof file === 'string' ? file : file.fileName}
                        </span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`ลบไฟล์ ${typeof file === 'string' ? file : file.fileName}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setNewExpressionOpen(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleSaveExpression('draft')}
                className="flex-1 py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                บันทึก
              </button>
              <button
                onClick={() => handleSaveExpression('published')}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                เผยแพร่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDashboard;
