"use client"

import React, { useState, useRef, useEffect, useReducer, useMemo } from 'react';
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
  Archive,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Lightbulb,
  ArrowLeft,
  Clock,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';

// Constants
const SWIPE_THRESHOLD = 50;
const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// Initial state for useReducer
const initialState = {
  expressions: [
    {
      id: 1,
      type: 'praise',
      from: 'สมชาย ใจดี',
      content: 'ทำงานได้ดีมากครับ ประทับใจในความตั้งใจและความรับผิดชอบ',
      fullContent: 'ทำงานได้ดีมากครับ ประทับใจในความตั้งใจและความรับผิดชอบ ช่วงที่ผ่านมาเห็นการทำงานที่มีคุณภาพและส่งมอบงานตรงเวลาเสมอ การประสานงานกับทีมก็ดีมาก และยังช่วยเหลือเพื่อนร่วมงานอีกด้วย หวังว่าจะคงความเป็นเลิศแบบนี้ต่อไป',
      date: '2024-06-20',
      time: '14:30',
      isPublic: true,
      attachments: ['image1.jpg'],
      department: 'แผนกการตลาด',
      position: 'ผู้จัดการฝ่ายขาย',
      tags: ['ความรับผิดชอบ', 'การทำงานเป็นทีม', 'คุณภาพงาน'],
      month: 5, // June (0-indexed)
      year: 2024
    },
    {
      id: 2,
      type: 'praise',
      from: 'นายพล หนักแน่น',
      content: 'ขอบคุณสำหรับการนำเสนองานที่ยอดเยี่ยม',
      fullContent: 'ขอบคุณสำหรับการนำเสนองานที่ยอดเยี่ยม การเตรียมข้อมูลครบถ้วน การออกแบบสไลด์ที่สวยงาม และการนำเสนอที่มั่นใจและชัดเจน ทำให้ลูกค้าประทับใจมาก และตัดสินใจใช้บริการของเราในที่สุด ขอชื่นชมการทำงานที่มีคุณภาพและความมุ่งมั่นในครั้งนี้',
      date: '2024-05-15',
      time: '16:45',
      isPublic: true,
      attachments: ['report.pdf', 'presentation.pptx'],
      department: 'แผนกขาย',
      position: 'ผู้จัดการแผนกขาย',
      tags: ['การนำเสนอ', 'ความมุ่งมั่น', 'ผลลัพธ์'],
      month: 4, // May
      year: 2024
    },
    {
      id: 3,
      type: 'suggestion',
      from: 'มานะ ขยันดี',
      content: 'ควรเพิ่มการวางแผนล่วงหน้าในโปรเจกต์ จะทำให้ทีมทำงานได้ราบรื่นขึ้น',
      fullContent: 'ควรเพิ่มการวางแผนล่วงหน้าในโปรเจกต์ จะทำให้ทีมทำงานได้ราบรื่นขึ้น การมี roadmap ที่ชัดเจนและ milestone ที่เหมาะสม จะช่วยให้ทุกคนเข้าใจขั้นตอนการทำงานและสามารถเตรียมตัวได้ดีขึ้น รวมถึงการจัดสรรทรัพยากรที่เหมาะสม',
      date: '2024-06-17',
      time: '11:20',
      isPublic: true,
      attachments: [],
      department: 'แผนกเทคโนโลยี',
      position: 'หัวหน้าโปรเจกต์',
      tags: ['การวางแผน', 'การจัดการ', 'ประสิทธิภาพ'],
      month: 5, // June
      year: 2024
    }
  ],
  myExpressions: [
    {
      id: 4,
      type: 'praise',
      to: 'นายพล หนักแน่น',
      content: 'ขอบคุณที่ช่วยเหลือในโปรเจกต์นี้ครับ',
      date: '2024-06-19',
      status: 'published',
      attachments: [],
      month: 5,
      year: 2024
    },
    {
      id: 5,
      type: 'suggestion',
      to: 'สมหญิง รักงาน',
      content: 'อาจจะดีกว่าถ้าเราจัดการประชุมสั้นๆ ทุกสัปดาห์',
      date: '2024-05-17',
      status: 'draft',
      attachments: [],
      month: 4,
      year: 2024
    }
  ],
  loading: false,
  error: null
};

// Reducer for state management
const feedbackReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_EXPRESSION':
      return {
        ...state,
        myExpressions: [...state.myExpressions, action.payload],
        loading: false
      };
    case 'UPDATE_EXPRESSION':
      return {
        ...state,
        myExpressions: state.myExpressions.map(exp =>
          exp.id === action.payload.id ? action.payload : exp
        )
      };
    case 'DELETE_EXPRESSION':
      return {
        ...state,
        myExpressions: state.myExpressions.filter(exp => exp.id !== action.payload)
      };
    default:
      return state;
  }
};

const FeedbackDashboard = () => {
  const [state, dispatch] = useReducer(feedbackReducer, initialState);
  const [activeTab, setActiveTab] = useState(0);
  const [timePeriod, setTimePeriod] = useState('monthly');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [newExpressionOpen, setNewExpressionOpen] = useState(false);
  const [selectedExpression, setSelectedExpression] = useState(null);

  const [expressionData, setExpressionData] = useState({
    type: 'praise',
    recipient: '',
    content: '',
    attachments: [],
    privacy: 'public',
    status: 'draft'
  });

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const fileInputRef = useRef(null);

  // Handle touch events
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
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
  const navigateMonth = (direction) => {
    const newMonth = currentMonth + direction;

    if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else if (newMonth < 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

  const navigateYear = (direction) => {
    setCurrentYear(currentYear + direction);
  };

  // Filter expressions based on time period
  const filteredExpressions = useMemo(() => {
    let filtered = state.expressions;

    // Filter by time period
    if (timePeriod === 'monthly') {
      filtered = filtered.filter(exp =>
        exp.month === currentMonth && exp.year === currentYear
      );
    } else {
      filtered = filtered.filter(exp => exp.year === currentYear);
    }

    return filtered;
  }, [state.expressions, timePeriod, currentMonth, currentYear]);

  const filteredMyExpressions = useMemo(() => {
    let filtered = state.myExpressions;

    if (timePeriod === 'monthly') {
      filtered = filtered.filter(exp =>
        exp.month === currentMonth && exp.year === currentYear
      );
    } else {
      filtered = filtered.filter(exp => exp.year === currentYear);
    }

    return filtered;
  }, [state.myExpressions, timePeriod, currentMonth, currentYear]);

  // Calculate stats based on filtered data
  const stats = useMemo(() => {
    const currentExpressions = timePeriod === 'monthly'
      ? state.expressions.filter(exp => exp.month === currentMonth && exp.year === currentYear)
      : state.expressions.filter(exp => exp.year === currentYear);

    return {
      praise: currentExpressions.filter(exp => exp.type === 'praise').length,
      suggestions: currentExpressions.filter(exp => exp.type === 'suggestion').length,
      public: currentExpressions.filter(exp => exp.isPublic).length,
      private: currentExpressions.filter(exp => !exp.isPublic).length
    };
  }, [state.expressions, timePeriod, currentMonth, currentYear]);

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const fileNames = files.map(file => file.name);
    setExpressionData({
      ...expressionData,
      attachments: [...expressionData.attachments, ...fileNames]
    });
  };

  // Handle saving expression
  const handleSaveExpression = async (status) => {
    if (!expressionData.recipient || !expressionData.content) {
      dispatch({ type: 'SET_ERROR', payload: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newExpression = {
        id: Date.now(),
        ...expressionData,
        status,
        date: new Date().toISOString().split('T')[0],
        month: new Date().getMonth(),
        year: new Date().getFullYear()
      };

      dispatch({ type: 'ADD_EXPRESSION', payload: newExpression });
      setNewExpressionOpen(false);
      setExpressionData({
        type: 'praise',
        recipient: '',
        content: '',
        attachments: [],
        privacy: 'public',
        status: 'draft'
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'เกิดข้อผิดพลาดในการบันทึก' });
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = expressionData.attachments.filter((_, i) => i !== index);
    setExpressionData({ ...expressionData, attachments: newAttachments });
  };

  // Clear error after 3 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  const StatCard = ({ title, value, icon: Icon, bgColor, textColor }) => (
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

  const ExpressionCard = ({ expression, showActions = false, clickable = false }) => (
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
              {expression.from || expression.to}
            </p>
            <p className="text-xs text-gray-500">{expression.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              expression.type === 'praise'
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {expression.type === 'praise' ? 'ชื่นชม' : 'ต้องปรับปรุง'}
          </span>
          {expression.isPublic !== undefined && (
            <button
              className="p-1 text-gray-400 hover:text-gray-600"
              aria-label={expression.isPublic ? 'ชื่นชม (ไม่ feedback)' : 'ต้องปรับปรุง (ไม่ feedback)'}
            >
              {expression.isPublic ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{expression.content}</p>

      {expression.attachments && expression.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {expression.attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
            >
              <Paperclip className="w-3 h-3" />
              {file}
            </div>
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

      {expression.status && (
        <div className="mt-2 pt-2 border-t">
          <span
            className={`inline-block px-2 py-1 text-xs rounded ${
              expression.status === 'published'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {expression.status === 'published' ? 'เผยแพร่แล้ว' : 'ร่าง'}
          </span>
        </div>
      )}
    </div>
  );

  const ExpressionDetailModal = ({ expression, onClose }) => {
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
                  <p className="font-semibold text-gray-900">{expression.from}</p>
                  <p className="text-sm text-gray-600">{expression.department}</p>
                  <p className="text-sm text-gray-600">{expression.position}</p>
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
                  {expression.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {expression.time}
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
                <p className="text-gray-700 leading-relaxed">{expression.fullContent}</p>
              </div>
            </div>

            {expression.attachments && expression.attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ไฟล์แนบ
                </label>
                <div className="space-y-2">
                  {expression.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <Paperclip className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">{file}</span>
                    </div>
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
      {state.error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {state.error}
        </div>
      )}

      {/* Time Period Toggle */}
      <div className="p-4 bg-white border-b">
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setTimePeriod('monthly')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              timePeriod === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            รายเดือน
          </button>
          <button
            onClick={() => setTimePeriod('yearly')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              timePeriod === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
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
          <StatCard
            title="ชื่นชม"
            value={stats.praise}
            icon={ThumbsUp}
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
          <StatCard
            title="ข้อแนะนำที่ได้รับ"
            value={stats.suggestions}
            icon={MessageSquare}
            bgColor="bg-orange-100"
            textColor="text-orange-600"
          />
          <StatCard
            title="เปิดเผย"
            value={stats.public}
            icon={Eye}
            bgColor="bg-blue-100"
            textColor="text-blue-600"
          />
          <StatCard
            title="ไม่เปิดเผย"
            value={stats.private}
            icon={EyeOff}
            bgColor="bg-gray-100"
            textColor="text-gray-600"
          />
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
              {filteredExpressions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  ไม่มีความคิดเห็นในช่วงเวลานี้
                </div>
              ) : (
                filteredExpressions.map((expression) => (
                  <ExpressionCard
                    key={expression.id}
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
              {filteredMyExpressions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  ไม่มีความคิดเห็นในช่วงเวลานี้
                </div>
              ) : (
                filteredMyExpressions.map((expression) => (
                  <ExpressionCard
                    key={expression.id}
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
                <input
                  type="text"
                  value={expressionData.recipient}
                  onChange={(e) =>
                    setExpressionData({ ...expressionData, recipient: e.target.value })
                  }
                  placeholder="เลือกผู้รับ"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
                >
                  <Paperclip className="w-5 h-5" />
                  แนบไฟล์
                </button>
                {expressionData.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {expressionData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-100 rounded"
                      >
                        <span className="text-sm text-gray-700">{file}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`ลบไฟล์ ${file}`}
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
                disabled={state.loading}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleSaveExpression('draft')}
                className="flex-1 py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                disabled={state.loading}
              >
                {state.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                บันทึก
              </button>
              <button
                onClick={() => handleSaveExpression('published')}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={state.loading}
              >
                {state.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
