'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, User, X } from 'lucide-react'
import { useEmployees } from '../../hooks/useEmployees'
import type { Employee } from '../../types/employee'

interface EmployeeDropdownProps {
  value?: string
  onChange: (empId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const EmployeeDropdown: React.FC<EmployeeDropdownProps> = ({
  value,
  onChange,
  placeholder = 'เลือกผู้รับ',
  disabled = false,
  className = ''
}) => {
  const { employees, loading, getEmployeeById, searchEmployees } = useEmployees()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedEmployee = value ? getEmployeeById(value) : null

  // Filter employees based on search term
  useEffect(() => {
    const filterEmployees = async () => {
      if (searchTerm.trim()) {
        const results = await searchEmployees(searchTerm)
        setFilteredEmployees(results.slice(0, 50)) // Limit to 50 results for performance
      } else {
        setFilteredEmployees(employees.slice(0, 50)) // Show first 50 employees when no search
      }
    }

    filterEmployees()
  }, [searchTerm, employees, searchEmployees])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (employee: Employee) => {
    onChange(employee.empId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm('')
    }
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full p-3 border border-gray-300 rounded-lg text-left 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          flex items-center justify-between
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400 cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className={`truncate ${selectedEmployee ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedEmployee ? selectedEmployee.fullName : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedEmployee && !disabled && (
            <X 
              className="w-4 h-4 text-gray-400 hover:text-gray-600" 
              onClick={handleClear}
            />
          )}
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาด้วยชื่อหรือรหัสพนักงาน"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Employee List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="ml-2">กำลังโหลด...</span>
              </div>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <button
                  key={employee.empId}
                  onClick={() => handleSelect(employee)}
                  className={`
                    w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                    flex items-center gap-3 border-b border-gray-100 last:border-b-0
                    ${selectedEmployee?.empId === employee.empId ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                  `}
                >
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {employee.fullName}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {employee.empId}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'ไม่พบพนักงานที่ตรงกับการค้นหา' : 'ไม่มีข้อมูลพนักงาน'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeDropdown