'use client'

import type { Dispatch, SetStateAction, ChangeEvent } from 'react'
import { useMemo, useState, useCallback, useRef } from 'react'

import type { MRT_ColumnDef, MRT_ColumnFiltersState } from 'material-react-table'

import { debounce } from 'lodash'

// import dayjs from 'dayjs'
import { MaterialReactTable } from 'material-react-table'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  IconButton,
  Menu
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Construction as ConstructionIcon,
  NoteAdd

  // Clear as ClearIcon
} from '@mui/icons-material'

// import ConstructionIcon from '@mui/icons-material/Construction'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import EventNoteIcon from '@mui/icons-material/EventNote'

import ExportToCsvButton from './ExportToExcelButton'

import OrderDateModal from '../OrderDateModal'

import JobOrderModal from '../JobOrderModal'
import type { IDiecut } from '../../types/types'
import { formatNumber } from '../../utils/formatters'
import apiClient from '../../services/apiClient'
import PermissionGate from '../PermissionGate'
import { usePermission } from '../../contexts/PermissionContext'

interface RequestTableProps {
  data: IDiecut[]
  loading: boolean
  isManager: boolean
  handleItemSelect: (item: IDiecut) => void
  handleEditClick: (item: IDiecut) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedType: string[]
  setSelectedType: Dispatch<SetStateAction<string[]>>
  diecutTypes: any[]
  typesLoading: boolean
  handleTypeChange: (event: React.ChangeEvent<{ name?: string; value: unknown }>) => void
  setData?: (data: IDiecut[]) => void
  handleOrderClick?: (item: IDiecut) => void
  updateDiecutJobInfo?: (diecutId: string, diecutSn: string, jobId: string, prodId: string, revision: string) => void
  handleTypeSearch?: () => void
  selectedItem?: IDiecut | null
}

const RequestTable = ({
  data,
  loading,
  selectedItem,
  handleItemSelect,
  handleEditClick,
  searchQuery,
  setSearchQuery,
  selectedType,
  diecutTypes,
  typesLoading,
  handleTypeChange,
  setData,
  handleOrderClick,
  handleTypeSearch,
  setSelectedType
}: RequestTableProps) => {
  const { canRecordDetails, canCreateNew } = usePermission()

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([
    {
      id: 'STATUS',
      value: ['N', 'B', 'M', 'E', 'T', 'F', 'D']
    }
  ])

  const [jobOrderModalOpen, setJobOrderModalOpen] = useState(false)
  const [selectedDiecut, setSelectedDiecut] = useState<IDiecut | null>(null)
  const [orderDateModalOpen, setOrderDateModalOpen] = useState(false)
  const [selectedDiecutForOrderDate, setSelectedDiecutForOrderDate] = useState<IDiecut | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter data based on search query
  const filteredData = useMemo(() => {
    // Early return if no search query to avoid unnecessary processing
    if (!searchQuery || searchQuery.trim() === '') {
      return data
    }

    const lowerCaseQuery = searchQuery.toLowerCase().trim()

    // Use more efficient filtering - break early when possible
    return data.filter(item => {
      // Check most common search fields first for better performance
      if (item.DIECUT_ID?.toString().toLowerCase().includes(lowerCaseQuery)) return true
      if (item.DIECUT_SN?.toLowerCase().includes(lowerCaseQuery)) return true
      if (item.JOB_ID?.toLowerCase().includes(lowerCaseQuery)) return true
      if (item.PROD_ID?.toLowerCase().includes(lowerCaseQuery)) return true

      // Less common fields - check only if needed
      if (item.DIECUT_TYPE?.toLowerCase().includes(lowerCaseQuery)) return true
      if (item.STATUS?.toLowerCase().includes(lowerCaseQuery)) return true
      if (item.MODIFY_TYPE?.toLowerCase().includes(lowerCaseQuery)) return true
      if (item.PROD_DESC?.toLowerCase().includes(lowerCaseQuery)) return true
      if (item.JOB_DESC?.toLowerCase().includes(lowerCaseQuery)) return true

      return false
    })
  }, [data, searchQuery])

  // Helper functions for status display
  const getStatusText = (status: string | null | undefined) => {
    if (!status) return 'ไม่ระบุ'

    switch (status) {
      case 'N':
        return 'สั่งทำใหม่'
      case 'B':
        return 'เปลี่ยนใบมีด'
      case 'M':
        return 'สร้างทดแทน'
      case 'E':
        return 'แก้ไข'
      case 'T':
        return 'พร้อมใช้งาน'
      case 'F':
        return 'ยกเลิก'
      case 'D':
        return 'ทำลายแล้ว'
      default:
        return status
    }
  }

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'default'

    switch (status) {
      case 'N':
        return 'info'
      case 'B':
        return 'warning'
      case 'M':
        return 'secondary'
      case 'E':
        return 'warning'
      case 'T':
        return 'success'
      case 'F':
        return 'error'
      case 'D':
        return 'primary'
      default:
        return 'default'
    }
  }

  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setSearchQuery(value)
    }, 1000), // 300ms delay
    [setSearchQuery]
  )

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value

      // Update input immediately for responsive UI
      if (searchInputRef.current) {
        searchInputRef.current.value = value
      }

      // Debounce the actual search query update
      debouncedSetSearchQuery(value)
    },
    [debouncedSetSearchQuery]
  )

  const handleOpenOrderDateModal = (item: IDiecut, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row selection
    setSelectedDiecutForOrderDate(item)
    setOrderDateModalOpen(true)
  }

  const handleOrderDateSelect = async (orderData: any) => {
    if (!selectedDiecutForOrderDate) return

    try {
      // Calculate dueDate (orderDate - 3 days)
      let orderDate: any
      let dueDate: any

      if (orderData.ORDER_DATE != null) {
        orderDate = new Date(orderData.ORDER_DATE)
      }

      if (orderData.DATE_USING != null) {
        dueDate = new Date(orderData.DATE_USING)
      }

      console.log(orderData.ORDER_DATE)
      console.log({
        diecutId: selectedDiecutForOrderDate.DIECUT_ID,
        diecutSn: selectedDiecutForOrderDate.DIECUT_SN,
        orderDate: orderDate,
        dueDate: dueDate,
        jobId: orderData.JOB_ID,
        prodId: orderData.PROD_ID,
        prodDesc: orderData.PROD_DESC,
        REVISION: orderData.REVISION,
        orderDateType: orderData.ORDER_DATE_TYPE
      })

      // Call API to update the order date, due date, and job info
      const result = await apiClient.post('/api/diecuts/updateorderinfo', {
        diecutId: selectedDiecutForOrderDate.DIECUT_ID,
        diecutSn: selectedDiecutForOrderDate.DIECUT_SN,
        orderDate: orderDate ? orderDate.toLocaleString() : null,
        dueDate: dueDate ? dueDate.toLocaleString() : null,
        jobId: orderData.JOB_ID,
        prodId: orderData.PROD_ID,
        jobDesc: orderData.JOB_DESC,
        REVISION: orderData.REVISION,
        orderDateType: orderData.ORDER_DATE_TYPE
      })

      if ((result as { success: boolean }).success) {
        // Update the local data with the new information
        console.log(result)

        if (setData && data) {
          const updatedData = data.map(item => {
            if (
              item.DIECUT_ID === selectedDiecutForOrderDate.DIECUT_ID &&
              item.DIECUT_SN === selectedDiecutForOrderDate.DIECUT_SN
            ) {
              return {
                ...item,
                ORDER_DATE: orderDate,
                DUE_DATE: dueDate,
                JOB_ID: orderData.JOB_ID,
                PROD_ID: orderData.PROD_ID,
                PROD_DESC: orderData.PROD_DESC,
                JOB_DESC: orderData.JOB_DESC,
                REVISION: orderData.REVISION,
                ORDER_DATE_TYPE: orderData.ORDER_DATE_TYPE
              }
            }

            return item
          })

          setData(updatedData)
        }
      } else {
        console.error('Failed to update order information')
      }
    } catch (error) {
      console.error('Error updating order information:', error)
    }
  }

  const handleOpenJobOrderModal = (item: IDiecut, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row selection
    setSelectedDiecut(item)
    setJobOrderModalOpen(true)
  }

  const handleJobOrderSelect = async (jobOrderData: any) => {
    if (!selectedDiecut) return
    console.log(selectedDiecut)

    try {
      // Call API to update the diecut with the selected job order info
      const result = await apiClient.post('/api/diecuts/updatejobinfo', {
        diecutId: selectedDiecut.DIECUT_ID,
        diecutSn: selectedDiecut.DIECUT_SN,
        jobId: jobOrderData.JOB_ID,
        prodId: jobOrderData.PROD_ID,
        revision: jobOrderData.REVISION,
        jobDesc: jobOrderData.JOB_DESC
      })

      if ((result as { success: boolean }).success) {
        // Update the local data with the new job order info
        if (setData && data) {
          const updatedData = data.map(item => {
            if (item.DIECUT_ID === selectedDiecut.DIECUT_ID && item.DIECUT_SN === selectedDiecut.DIECUT_SN) {
              return {
                ...item,
                JOB_ID: jobOrderData.JOB_ID,
                PROD_ID: jobOrderData.PROD_ID,
                JOB_DESC: jobOrderData.JOB_DESC,
                REVISION: jobOrderData.REVISION
              }
            }

            return item
          })

          setData(updatedData)
        }

        // If the parent provided an update function, call it
        // if (updateDiecutJobInfo) {
        //   updateDiecutJobInfo(
        //     selectedDiecut.DIECUT_ID,
        //     selectedDiecut.DIECUT_SN,
        //     jobOrderData.JOB_ID,
        //     jobOrderData.PROD_ID,
        //     jobOrderData.REVISION
        //   )
        // }
      } else {
        console.error('Failed to update job order info:')
      }
    } catch (error) {
      console.error('Error updating job order info:', error)
    }
  }

  const getPriorityStyle = (item: IDiecut) => {
    const isExpired = (item?.USED ?? 0) >= (item?.AGES ?? Infinity)
    const isNearingExpiration = (item?.USED ?? 0) >= (item?.DIECUT_NEAR_EXP ?? Infinity)

    // Initialize style object with default text color (black)
    const style: { color: string; backgroundColor?: string } = { color: 'black' }

    // Set text color based on STATUS
    if (item.STATUS === 'F' || item.STATUS === 'D') {
      style.color = 'red'
    }

    // Set background color based on STATUS and expiration
    if (item.STATUS !== 'T' && item.STATUS !== 'F' && item.STATUS !== 'D') {
      // สั่งทำแล้ว - Items that have been ordered (not T, F, or D)
      style.backgroundColor = 'rgba(200, 200, 200, 0.7)' // Gray
    } else if (item.STATUS === 'T') {
      // ไม่ได้สั่งทำ with STATUS = 'T'
      if (isExpired) {
        style.backgroundColor = 'rgba(255, 0, 0, 0.7)' // Red for expired
      } else if (isNearingExpiration) {
        style.backgroundColor = 'rgba(255, 171, 2, 0.7)' // Orange for nearing expiration
      }
    }

    // For STATUS 'F' or 'D', background remains white (default)

    return style
  }

  // Function to check if Process button should be active
  // const isActiveForProcess = (status: string | null | undefined) => {
  //   if (!status) return false

  //   return ['N', 'B', 'M', 'E'].includes(status)
  // }

  // Function to handle Process button click
  // const handleProcessClick = (item: IDiecut) => {
  //   // Notify the parent component to open the process dialog
  //   handleItemSelect(item)

  //   // handleEditClick(item)
  // }

  // Custom filter function for DIECUT_TYPE
  // const diecutTypeFilterFn: MRT_FilterFn<IDiecut> = (row, id, filterValue) => {
  //   if (!filterValue || filterValue === '') return true
  //   const value = row.getValue(id)

  //   return value === filterValue
  // }

  // Define columns for the table
  const columns = useMemo<MRT_ColumnDef<IDiecut>[]>(() => {
    // สร้าง array ของคอลัมน์พื้นฐานที่จะแสดงเสมอ
    const baseColumns: MRT_ColumnDef<IDiecut>[] = [
      // DIECUT_ID column (used for grouping)
      {
        accessorKey: 'DIECUT_ID',
        header: 'เลขที่',
        size: 150,
        enableGrouping: true,
        AggregatedCell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography fontWeight='bold'>{row.getValue('DIECUT_ID')}</Typography>
            <Chip
              label={row.subRows?.length || 0}
              size='small'
              color='primary'
              sx={{
                ml: 1,
                backgroundColor: '#98867B',
                '& .MuiChip-label': { fontWeight: 'bold' }
              }}
            />
          </Box>
        )
      },
      {
        accessorKey: 'STATUS',
        header: 'สถานะ',
        size: 110,
        filterFn: (row, id, filterValues) => {
          // If no filter values are selected, show all rows
          if (!filterValues || !Array.isArray(filterValues) || filterValues.length === 0) {
            return true
          }

          // Get the status value from the row
          const status = row.getValue(id)

          // Check if the status is included in the selected filter values
          return filterValues.includes(status)
        },
        Cell: ({ cell }) => {
          const status = cell.getValue<string | null | undefined>()

          return status ? <Chip label={getStatusText(status)} size='small' color={getStatusColor(status)} /> : null
        },

        // Updated Filter component for STATUS column in RequestTable.tsx
        Filter: ({ header }) => {
          const { column } = header
          const filterValue = (column.getFilterValue() as string[]) || []

          // All available status options
          const allStatusOptions = ['N', 'B', 'M', 'E', 'T', 'F', 'D']

          // Check if all options are selected
          const isAllSelected = allStatusOptions.every(status => filterValue.includes(status))

          // Check if some (but not all) options are selected
          const isSomeSelected = filterValue.length > 0 && filterValue.length < allStatusOptions.length

          // Handler for select/unselect
          const handleSelectChange = (event: any) => {
            const values = event.target.value as string[]

            // If 'ALL' is clicked
            if (values.includes('ALL')) {
              if (isAllSelected) {
                // If all were selected, deselect all
                column.setFilterValue(undefined)
              } else {
                // If not all were selected, select all
                column.setFilterValue(allStatusOptions)
              }

              return
            }

            // Regular handling for individual status selections
            column.setFilterValue(values.length > 0 ? values : undefined)
          }

          // Handle individual status clicks
          const handleStatusClick = (statusValue: string) => {
            let newValues: string[]

            if (filterValue.includes(statusValue)) {
              // Remove the status
              newValues = filterValue.filter(v => v !== statusValue)
            } else {
              // Add the status
              newValues = [...filterValue, statusValue]
            }

            column.setFilterValue(newValues.length > 0 ? newValues : undefined)
          }

          return (
            <FormControl size='small' variant='outlined'>
              <Select
                multiple
                value={filterValue || []}
                onChange={handleSelectChange}
                displayEmpty
                renderValue={selected => {
                  if (!selected || (selected as string[]).length === 0) {
                    return <em>ทั้งหมด</em>
                  }

                  if ((selected as string[]).length === allStatusOptions.length) {
                    return <em>เลือกทั้งหมด</em>
                  }

                  return (selected as string[]).map(value => getStatusText(value)).join(', ')
                }}
                sx={{
                  minWidth: '100px',
                  maxWidth: '100px',
                  height: '32px',
                  backgroundColor: '#f5f5f5',
                  '& .MuiSelect-select': {
                    padding: '4px 8px',
                    fontSize: '0.8rem'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300
                    }
                  }
                }}
              >
                {/* ALL option */}
                <MenuItem
                  value='ALL'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()

                    if (isAllSelected) {
                      column.setFilterValue(undefined)
                    } else {
                      column.setFilterValue(allStatusOptions)
                    }
                  }}
                  sx={{
                    borderBottom: '1px solid #e0e0e0',
                    mb: 1
                  }}
                >
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={() => {}} // Handled by onClick above
                  />
                  <ListItemText primary='ทั้งหมด' sx={{ fontWeight: 'bold' }} />
                </MenuItem>

                {/* Individual status options */}
                <MenuItem
                  value='N'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStatusClick('N')
                  }}
                >
                  <Checkbox checked={filterValue?.includes('N') || false} />
                  <ListItemText primary='สั่งทำใหม่' />
                </MenuItem>
                <MenuItem
                  value='B'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStatusClick('B')
                  }}
                >
                  <Checkbox checked={filterValue?.includes('B') || false} />
                  <ListItemText primary='เปลี่ยนใบมีด' />
                </MenuItem>
                <MenuItem
                  value='M'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStatusClick('M')
                  }}
                >
                  <Checkbox checked={filterValue?.includes('M') || false} />
                  <ListItemText primary='สร้างทดแทน' />
                </MenuItem>
                <MenuItem
                  value='E'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStatusClick('E')
                  }}
                >
                  <Checkbox checked={filterValue?.includes('E') || false} />
                  <ListItemText primary='แก้ไข' />
                </MenuItem>
                <MenuItem
                  value='T'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStatusClick('T')
                  }}
                >
                  <Checkbox checked={filterValue?.includes('T') || false} />
                  <ListItemText primary='พร้อมใช้งาน' />
                </MenuItem>
                <MenuItem
                  value='F'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStatusClick('F')
                  }}
                >
                  <Checkbox checked={filterValue?.includes('F') || false} />
                  <ListItemText primary='ยกเลิก' />
                </MenuItem>
                <MenuItem
                  value='D'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStatusClick('D')
                  }}
                >
                  <Checkbox checked={filterValue?.includes('D') || false} />
                  <ListItemText primary='ทำลายแล้ว' />
                </MenuItem>
              </Select>
            </FormControl>
          )
        }
      },

      // SN column
      {
        accessorKey: 'DIECUT_SN',
        header: 'รหัส',
        size: 150
      },

      {
        accessorKey: 'JOB_ID',
        header: 'JOB',
        size: 115,
        Cell: ({ row, cell }) => {
          const value = cell.getValue() || '-'
          const isNewAdd = row.original.NEW_ADD === true

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography sx={{ color: '#555555' }}>{String(value || '-')}</Typography>
              <PermissionGate requiredPermission='canModify'>
                {!isNewAdd && (
                  <IconButton
                    size='small'
                    onClick={e => handleOpenJobOrderModal(row.original, e)}
                    sx={{
                      ml: 'auto',
                      color: '#98867B',
                      '&:hover': {
                        backgroundColor: 'rgba(152, 134, 123, 0.1)'
                      }
                    }}
                  >
                    <SearchOutlinedIcon fontSize='small' />
                  </IconButton>
                )}
              </PermissionGate>
            </Box>
          )
        }
      },

      {
        accessorKey: 'PROD_ID',
        header: 'รหัสสินค้า',
        size: 130,
        Cell: ({ row, cell }) => {
          const value = cell.getValue()
          const revision = row.original.REVISION

          if (!value) return '-'

          // Remove leading zeros using regular expression
          const formattedProdId = (value as string).replace(/^0+/, '') || '-'

          // If revision exists, format as PROD_ID-REVISION
          if (revision) {
            return `${formattedProdId}-${revision}`
          }

          return formattedProdId
        }
      },

      {
        accessorKey: 'JOB_DESC',
        enableColumnOrdering: false,
        header: 'ชื่องาน',
        size: 450
      },

      // {
      //   accessorKey: 'BLANK_SIZE_X',
      //   header: 'กว้าง',
      //   size: 100,
      //   Cell: ({ cell }) => {
      //     const value = formatNumber(cell.getValue() as string | number)

      //     return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
      //   }
      // },
      {
        accessorKey: 'BLANK_SIZE_X',
        header: 'กว้าง',
        size: 100,
        filterVariant: 'text', // Use text-based filtering
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue() as string | number)

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        },
        filterFn: (row, id, filterValue) => {
          if (!filterValue) return true

          const rawValue = row.getValue(id)

          // Handle null/undefined values
          if (rawValue === null || rawValue === undefined) return false

          // Get both raw value and formatted value for exact matching
          const formattedValue = formatNumber(rawValue as string | number) || ''
          const rawStringValue = String(rawValue)
          const filterString = String(filterValue).toLowerCase().trim()

          // Exact match against both raw value and formatted value
          return rawStringValue.toLowerCase() === filterString || formattedValue.toLowerCase() === filterString
        }
      },
      {
        accessorKey: 'BLANK_SIZE_Y',
        header: 'ยาว',
        size: 100,
        filterVariant: 'text', // Use text-based filtering
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue() as string | number)

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        },
        filterFn: (row, id, filterValue) => {
          if (!filterValue) return true

          const rawValue = row.getValue(id)

          // Handle null/undefined values
          if (rawValue === null || rawValue === undefined) return false

          // Get both raw value and formatted value for exact matching
          const formattedValue = formatNumber(rawValue as string | number) || ''
          const rawStringValue = String(rawValue)
          const filterString = String(filterValue).toLowerCase().trim()

          // Exact match against both raw value and formatted value
          return rawStringValue.toLowerCase() === filterString || formattedValue.toLowerCase() === filterString
        }
      },
      {
        accessorKey: 'REMAIN',
        header: 'อายุคงเหลือ',
        enableColumnOrdering: false,
        size: 143,
        filterVariant: 'text', // Use text-based filtering
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue() as string | number)

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        },
        filterFn: (row, id, filterValue) => {
          if (!filterValue) return true

          const rawValue = row.getValue(id)

          // Handle null/undefined values
          if (rawValue === null || rawValue === undefined) return false

          // Get both raw value and formatted value for exact matching
          const formattedValue = formatNumber(rawValue as string | number) || ''
          const rawStringValue = String(rawValue)
          const filterString = String(filterValue).toLowerCase().trim()

          // Exact match against both raw value and formatted value
          return rawStringValue.toLowerCase() === filterString || formattedValue.toLowerCase() === filterString
        }
      },
      {
        accessorKey: 'DUE_DATE',
        header: 'วันที่ต้องการใช้',
        size: 160,
        Cell: ({ row, cell }) => {
          const value = cell.getValue()
          const dueIcon = row.original.DUE_ICON
          let formattedDisplayDate = '-'

          if (value) {
            try {
              // Handle various date formats
              const date = new Date(value as string)

              // Check if date is valid
              if (!isNaN(date.getTime())) {
                // Format for display (DD/MM/YYYY)
                formattedDisplayDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}/${date.getFullYear()}`
              }
            } catch (error) {
              console.error('Error parsing date:', error)
            }
          }

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {/* แสดง Icon ลูกศรแดงถ้า DUE_ICON เป็น 'EARLIER' */}
              {dueIcon == 'EARLIER' && (
                <ArrowBackIcon
                  sx={{
                    color: 'red',
                    fontSize: '16px',
                    marginRight: '4px',
                    animation: 'pulse 2s infinite' // เพิ่มการกระพริบเพื่อดึงดูดสายตา
                  }}
                />
              )}
              <Typography
                variant='body2'
                sx={{
                  color: '#5A4D40',
                  fontWeight: 400,
                  fontSize: '0.95rem'
                }}
              >
                {formattedDisplayDate}
              </Typography>
            </Box>
          )
        }
      },
      {
        accessorKey: 'ORDER_DATE',
        header: 'วันที่สั่งทำ',
        size: 160,
        Cell: ({ row, cell }) => {
          const value = cell.getValue()
          const status = row.original.STATUS
          const isNewAdd = row.original.NEW_ADD === true
          const orderIcon = row.original.ORDER_ICON // เพิ่มการดึง ORDER_ICON

          // Parse the date more carefully
          let formattedDisplayDate = '-'

          if (value) {
            try {
              // Handle various date formats
              const date = new Date(value as string)

              // Check if date is valid
              if (!isNaN(date.getTime())) {
                // Format for display (DD/MM/YYYY)
                formattedDisplayDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}/${date.getFullYear()}`
              }
            } catch (error) {
              console.error('Error parsing date:', error)
            }
          }

          // Only allow editing for certain statuses
          const canEdit =
            status !== undefined && ['N', 'B', 'M', 'E'].includes(status) && !row.getIsGrouped() && !isNewAdd

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {/* แสดง Icon ลูกศรแดงถ้า ORDER_ICON เป็น 'EARLIER' */}
              {orderIcon == 'EARLIER' && (
                <ArrowBackIcon
                  sx={{
                    color: 'red',
                    fontSize: '24px',
                    marginRight: '4px',
                    animation: 'pulse 2s infinite'
                  }}
                  titleAccess='มีแผนการผลิตที่เร็วกว่าเดิม (วันที่สั่งทำ)'
                />
              )}
              <Typography
                variant='body2'
                sx={{
                  color: '#5A4D40',
                  fontWeight: 400,
                  fontSize: '0.95rem'
                }}
              >
                {formattedDisplayDate}
              </Typography>
              <PermissionGate requiredPermission='canModify'>
                {canEdit && (
                  <IconButton
                    size='small'
                    onClick={e => handleOpenOrderDateModal(row.original, e)}
                    sx={{
                      ml: 'auto',
                      color: '#98867B',
                      '&:hover': {
                        backgroundColor: 'rgba(152, 134, 123, 0.1)'
                      }
                    }}
                  >
                    <EventNoteIcon fontSize='small' />
                  </IconButton>
                )}
              </PermissionGate>
            </Box>
          )
        }
      }
    ]

    // เพิ่มคอลัมน์ 'actions' เฉพาะเมื่อมีสิทธิ์ canRecordDetails
    if (canRecordDetails) {
      baseColumns.push({
        accessorKey: 'actions',
        header: 'การดำเนินการ',
        size: 150,
        enableSorting: false,
        enableColumnFilter: false,
        AggregatedCell: ({ row }) => {
          const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

          const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation() // Prevent row selection when clicking the button
            setMenuAnchor(e.currentTarget)
          }

          const handleClose = () => {
            setMenuAnchor(null)
          }

          // Check if there are any unsaved local blades in this group
          const diecutId: string = row.getValue('DIECUT_ID')

          const hasUnsavedBlades = data.some(
            item => item.DIECUT_ID === diecutId && (item.NEW_ADD === true || item.isNewlyAdded === true)
          )

          const handleCreateNewBladeInGroup = (e: any) => {
            handleClose()
            if (e) e.stopPropagation()

            // Prevent adding if there are already unsaved blades
            if (hasUnsavedBlades) {
              alert('กรุณาบันทึกใบมีดที่เพิ่มใหม่ก่อน หรือลบออกก่อนเพิ่มใหม่')

              return
            }

            // Get the group's DIECUT_ID
            const diecutId: string = row.getValue('DIECUT_ID')

            // Find all existing blades with this DIECUT_ID
            const existingBladesInGroup = data.filter(item => item.DIECUT_ID === diecutId)

            // Extract sequence numbers from existing SNs
            const sequenceNumbers = existingBladesInGroup.map(blade => {
              // Parse SN to extract the sequence number at the end
              const parts = blade.DIECUT_SN?.split('-') || []
              const lastPart = parts[parts.length - 1]

              // Try to convert the last part to a number
              const num = parseInt(lastPart)

              // Return the number if valid, otherwise 0
              return isNaN(num) ? 0 : num
            })

            // Find the highest sequence number
            const highestSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0

            // Generate the next sequence number
            const nextSequence = highestSequence + 1

            // Create new SN with incremented sequence
            const newSN = `${diecutId}-${nextSequence}`

            // Create a new item with this DIECUT_ID and sequential SN
            const newItem: IDiecut = {
              DIECUT_ID: diecutId,
              DIECUT_SN: newSN,
              STATUS: 'N', // Default status for new records
              DIECUT_TYPE: selectedType[0] || 'DC',

              // Add other required fields with default values
              MODIFY_TYPE: 'N',
              NEW_ADD: true
            }

            // Add the new item to the data array directly
            if (typeof setData === 'function') {
              setData([...data, newItem])
            }

            // Expand the group to show the new item
            if (!row.getIsExpanded()) {
              row.toggleExpanded()
            }
          }

          return (
            <PermissionGate requiredPermission='canCreateNew'>
              <>
                <Button
                  size='small'
                  variant='contained'
                  onClick={handleMenuClick}
                  disabled={hasUnsavedBlades}
                  sx={{
                    backgroundColor: hasUnsavedBlades ? '#ccc' : '#98867B',
                    color: hasUnsavedBlades ? '#666' : 'white',
                    '&:hover': {
                      backgroundColor: hasUnsavedBlades ? '#ccc' : '#5A4D40'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#ccc',
                      color: '#666'
                    },
                    width: '150px'
                  }}
                  startIcon={<AddIcon fontSize='small' />}
                  title={hasUnsavedBlades ? 'มีใบมีดที่ยังไม่ได้บันทึก กรุณาบันทึกก่อน' : 'เพิ่ม COPY'}
                >
                  เพิ่ม COPY
                </Button>

                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleClose} sx={{ mt: 1 }}>
                  <MenuItem
                    onClick={handleCreateNewBladeInGroup}
                    disabled={hasUnsavedBlades}
                    sx={{
                      '&.Mui-disabled': {
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      }
                    }}
                  >
                    <AddIcon fontSize='small' sx={{ mr: 1, opacity: hasUnsavedBlades ? 0.5 : 1 }} />
                    เพิ่มใบมีดในกลุ่มนี้
                    {hasUnsavedBlades && (
                      <Typography variant='caption' sx={{ ml: 1, color: 'text.secondary' }}>
                        (มีใบมีดที่ยังไม่บันทึก)
                      </Typography>
                    )}
                  </MenuItem>
                </Menu>
              </>
            </PermissionGate>
          )
        },

        Cell: ({ row }) => {
          const status = row.original.STATUS
          const isNewRecord = row.original.DIECUT_SN?.includes('-NEW-')

          // Define which statuses show the Process button
          const showProcessButton = (status !== undefined && ['N', 'B', 'M', 'E'].includes(status)) || isNewRecord

          // Define which status shows the Order button
          const showOrderButton = status === 'T'

          // For status F, don't show any button
          if (status === 'F') {
            return null
          }

          const handleProcessButtonClick = (e: React.MouseEvent) => {
            e.stopPropagation() // Prevent row selection when clicking the button

            // First select the item
            handleItemSelect(row.original)

            // Then trigger the edit mode by calling handleEditClick
            if (row.original) {
              handleEditClick(row.original)
            }
          }

          // Add a new handler for Order button
          const handleOrderButtonClick = (e: React.MouseEvent) => {
            e.stopPropagation() // Prevent row selection when clicking the button

            if (handleOrderClick) {
              handleOrderClick(row.original)
            }
          }

          return (
            <>
              {showProcessButton && (
                <Button
                  size='small'
                  variant='contained'
                  onClick={handleProcessButtonClick}
                  sx={{
                    backgroundColor: isNewRecord ? '#5A9E6F' : '#98867B', // Different color for new records
                    '&:hover': {
                      backgroundColor: isNewRecord ? '#3F7F4F' : '#5A4D40'
                    },
                    width: '150px'
                  }}
                  startIcon={<ConstructionIcon fontSize='small' />}
                >
                  Process
                </Button>
              )}

              {showOrderButton && (
                <PermissionGate requiredPermission='canCreateNew'>
                  <Button
                    size='small'
                    variant='contained'
                    onClick={handleOrderButtonClick}
                    sx={{
                      backgroundColor: '#98867B',
                      '&:hover': {
                        backgroundColor: '#5A4D40'
                      },
                      width: '150px'
                    }}
                    startIcon={<NoteAdd />}
                  >
                    สั่งทำ
                  </Button>
                </PermissionGate>
              )}
            </>
          )
        }
      })
    }

    return baseColumns
  }, [
    diecutTypes,
    typesLoading,
    selectedType,
    handleTypeChange,
    canRecordDetails,
    canCreateNew,
    data,
    setData,
    handleItemSelect,
    handleEditClick,
    handleOrderClick
  ])

  const tableFilteredData = useMemo(() => {
    let result = filteredData // Start with your custom search filtered data

    // Apply column filters
    columnFilters.forEach(filter => {
      const { id, value } = filter

      if (id === 'STATUS' && Array.isArray(value)) {
        result = result.filter(item => value.includes(item.STATUS))
      }

      if (id === 'BLANK_SIZE_X' && value) {
        result = result.filter(item => {
          const rawValue = item.BLANK_SIZE_X

          if (rawValue === null || rawValue === undefined) return false

          const formattedValue = formatNumber(rawValue) || ''
          const rawStringValue = String(rawValue)
          const filterString = String(value).toLowerCase().trim()

          return rawStringValue.toLowerCase() === filterString || formattedValue.toLowerCase() === filterString
        })
      }

      if (id === 'BLANK_SIZE_Y' && value) {
        result = result.filter(item => {
          const rawValue = item.BLANK_SIZE_Y

          if (rawValue === null || rawValue === undefined) return false

          const formattedValue = formatNumber(rawValue) || ''
          const rawStringValue = String(rawValue)
          const filterString = String(value).toLowerCase().trim()

          return rawStringValue.toLowerCase() === filterString || formattedValue.toLowerCase() === filterString
        })
      }

      if (id === 'REMAIN' && value) {
        result = result.filter(item => {
          const rawValue = item.REMAIN

          if (rawValue === null || rawValue === undefined) return false

          const formattedValue = formatNumber(rawValue) || ''
          const rawStringValue = String(rawValue)
          const filterString = String(value).toLowerCase().trim()

          return rawStringValue.toLowerCase() === filterString || formattedValue.toLowerCase() === filterString
        })
      }

      // Add more column filters as needed for other filterable columns
    })

    return result
  }, [filteredData, columnFilters])

  // Clear all filters
  // const handleClearFilters = () => {
  //   setSearchQuery('')
  //   setSelectedType('')
  //   setColumnFilters([])
  // }

  // Define custom top toolbar with search and filters
  const RenderTopToolbar = () => {
    // const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null)
    // const [showStatusT, setShowStatusT] = useState(true)

    // const handleFilterMenuClose = () => {
    //   setFilterMenuAnchor(null)
    // }

    // const handleStatusTFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //   setShowStatusT(event.target.checked)

    //   if (event.target.checked) {
    //     setColumnFilters(prev => [
    //       ...prev.filter(f => f.id !== 'STATUS'),
    //       { id: 'STATUS', value: 'T', operator: 'notEquals' }
    //     ])
    //   } else {
    //     setColumnFilters(prev => prev.filter(f => f.id !== 'STATUS'))
    //   }
    // }

    return (
      <Box
        sx={{
          p: 2,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: '#E6E1DC',
          borderBottom: '1px solid',
          borderColor: alpha('#D0C6BD', 0.6)
        }}
      >
        <TextField
          ref={searchInputRef}
          placeholder='ค้นหา.... (เลขที่, รหัส)'
          defaultValue={searchQuery} // Use defaultValue instead of value
          onChange={handleSearchInputChange} // Use the new optimized handler
          size='small'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            )

            // endAdornment: searchQuery && (
            //   <InputAdornment position='end'>
            //     <IconButton
            //       size='small'
            //       onClick={handleClearSearch}
            //       edge='end'
            //       sx={{
            //         color: '#666',
            //         '&:hover': {
            //           color: '#333',
            //           backgroundColor: 'rgba(0, 0, 0, 0.04)'
            //         }
            //       }}
            //     >
            //       <ClearIcon fontSize='small' />
            //     </IconButton>
            //   </InputAdornment>
            // )
          }}
          sx={{
            width: '700px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#f5f5f5'
            }
          }}
        />

        {/* Rest of your existing toolbar components... */}
        <Box sx={{ marginLeft: 'auto' }}>
          <Chip
            label={`รวม ${formatNumber(
              new Set(tableFilteredData.map(item => item.DIECUT_ID)).size
            )} กลุ่ม (${formatNumber(tableFilteredData.length)} รายการ)`}
            size='small'
            sx={{ mr: 1 }}
          />
        </Box>
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        {/* <Typography variant='h6'>{isManager ? 'Manage Requests' : 'View Requests'}</Typography> */}

        {/* Show feature toggle status in dev mode */}
        {/* {process.env.NODE_ENV === 'development' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip size='small' color={'default'} label={`ROLE : ${appConfig.defaultRole}`} />
          </Box>
        )} */}
        <div>
          <FormControl size='small' sx={{ minWidth: 150, mb: 2, maxWidth: 300 }}>
            <InputLabel id='diecut-type-filter-label'>เลือกประเภท Diecut</InputLabel>
            <Select
              labelId='diecut-type-filter-label'
              id='diecut-type-filter'
              value={selectedType}
              label='เลือกประเภท Diecut'
              multiple
              onChange={event => {
                const values = event.target.value as string[]

                // Get all available diecut types
                const allDiecutTypes = diecutTypes.map(type => type.PTC_TYPE)

                // If 'ALL' is clicked
                if (values.includes('ALL')) {
                  const isAllSelected = allDiecutTypes.every(type => selectedType.includes(type))

                  if (isAllSelected) {
                    // If all were selected, deselect all
                    setSelectedType([])
                  } else {
                    // If not all were selected, select all
                    setSelectedType(allDiecutTypes)
                  }

                  return
                }

                // Regular handling for individual type selections
                setSelectedType(values)

                // Convert the event for compatibility with existing handler
                const compatibleEvent = {
                  target: {
                    name: event.target.name,
                    value: values
                  }
                } as ChangeEvent<{ name?: string; value: unknown }>

                handleTypeChange(compatibleEvent)
              }}
              renderValue={selected => {
                if (!selected || selected.length === 0) {
                  return 'ทั้งหมด'
                }

                const allDiecutTypes = diecutTypes.map(type => type.PTC_TYPE)

                if (selected.length === allDiecutTypes.length) {
                  return 'เลือกทั้งหมด'
                }

                // Map the selected PTC_TYPE values to their corresponding PTC_DESC values
                return selected
                  .map(value => diecutTypes.find(type => type.PTC_TYPE === value)?.PTC_DESC || value)
                  .join(', ')
              }}
              disabled={typesLoading}
              startAdornment={
                typesLoading ? (
                  <InputAdornment position='start'>
                    <CircularProgress size={20} sx={{ color: '#98867B' }} />
                  </InputAdornment>
                ) : null
              }
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              {/* ALL option */}
              <MenuItem
                value='ALL'
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()

                  const allDiecutTypes = diecutTypes.map(type => type.PTC_TYPE)
                  const isAllSelected = allDiecutTypes.every(type => selectedType.includes(type))

                  if (isAllSelected) {
                    setSelectedType([])
                  } else {
                    setSelectedType(allDiecutTypes)
                  }
                }}
                sx={{
                  borderBottom: '1px solid #e0e0e0',
                  mb: 1
                }}
              >
                <Checkbox
                  checked={(() => {
                    const allDiecutTypes = diecutTypes.map(type => type.PTC_TYPE)

                    return allDiecutTypes.every(type => selectedType.includes(type))
                  })()}
                  indeterminate={(() => {
                    const allDiecutTypes = diecutTypes.map(type => type.PTC_TYPE)

                    return selectedType.length > 0 && selectedType.length < allDiecutTypes.length
                  })()}
                  onChange={() => {}} // Handled by onClick above
                />
                <ListItemText primary='ทั้งหมด' sx={{ fontWeight: 'bold' }} />
              </MenuItem>

              {/* Individual diecut type options */}
              {diecutTypes.map(type => (
                <MenuItem
                  key={type.PTC_TYPE}
                  value={type.PTC_TYPE}
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()

                    let newValues: string[]

                    if (selectedType.includes(type.PTC_TYPE)) {
                      // Remove the type
                      newValues = selectedType.filter(v => v !== type.PTC_TYPE)
                    } else {
                      // Add the type
                      newValues = [...selectedType, type.PTC_TYPE]
                    }

                    setSelectedType(newValues)

                    // Convert the event for compatibility with existing handler
                    const compatibleEvent = {
                      target: {
                        name: 'diecut-type-filter',
                        value: newValues
                      }
                    } as ChangeEvent<{ name?: string; value: unknown }>

                    handleTypeChange(compatibleEvent)
                  }}
                >
                  <Checkbox checked={selectedType.includes(type.PTC_TYPE)} />
                  <ListItemText primary={`${type.PTC_DESC}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button sx={{ ml: 2 }} variant='contained' onClick={handleTypeSearch}>
            ค้นหา
          </Button>
        </div>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ExportToCsvButton data={tableFilteredData} getStatusText={getStatusText} />
        </Box>
      </Box>

      <MaterialReactTable
        columns={columns}
        data={filteredData}
        enableGrouping
        enableExpanding
        enableStickyHeader
        enableColumnDragging={false}
        enableRowDragging={false}
        enableColumnActions={true}
        autoResetPageIndex={false}
        initialState={{
          pagination: { pageSize: 50, pageIndex: 0 },
          density: 'compact',
          grouping: ['DIECUT_ID'],
          expanded: true, // Start with all groups expanded
          columnVisibility: {},
          columnFilters,
          columnPinning: {
            left: ['DIECUT_ID', 'DIECUT_SN', 'DUE_DATE', 'ORDER_DATE'],
            right: ['REMAIN', 'STATUS', 'actions']
          },
          sorting: [{ id: 'DIECUT_SN', desc: false }],
          showColumnFilters: true
        }}
        state={{
          isLoading: loading,
          columnFilters
        }}
        onColumnFiltersChange={setColumnFilters}
        enableRowSelection={false}
        enableGlobalFilter={false}
        enableColumnResizing={true}
        enableColumnPinning={true}
        enableSorting={true}
        renderTopToolbar={RenderTopToolbar}
        paginationDisplayMode='pages'
        muiTableContainerProps={{
          sx: {
            maxHeight: '65vh',

            // '& .MuiTableRow-root:nth-of-type(odd)': {
            //   backgroundColor: 'rgba(244, 242, 239, 0.7)' // Lighter shade
            // },
            // '& .MuiTableRow-root:nth-of-type(even)': {
            //   backgroundColor: 'rgba(234, 232, 229, 0.7)' // Very slightly darker but still light
            // },
            '& .MuiTableRow-root:hover': {
              backgroundColor: alpha('#D5AA9F', 0.2)
            },
            '& .MuiTableRow-root.Mui-selected, & .MuiTableRow-root.Mui-selected:hover': {
              backgroundColor: alpha('#D5AA9F', 0.3)
            }
          }
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              padding: '4px 8px', // Reduce padding in all cells
              fontSize: '0.95rem' // Smaller font size
            }
          }
        }}
        muiTableBodyProps={{
          sx: {
            '& .MuiTableRow-root': {
              height: '36px' // Reduce row height
            }
          }
        }}
        muiBottomToolbarProps={{
          sx: {
            backgroundColor: '#E6E1DC',
            borderTop: '1px solid',
            borderColor: alpha('#D0C6BD', 0.6)
          }
        }}
        muiTableHeadProps={{
          sx: {
            '& .MuiTableCell-head': {
              backgroundColor: '#E6E1DC',
              color: '#000000',
              fontWeight: 'bold'
            },
            '& .Mui-TableHeadCell-Content-Actions': {
              // Add & to scope it properly MuiTableSortLabel-root
              display: 'none'
            },
            '& .MuiTableCell-head:hover .Mui-TableHeadCell-Content-Actions': {
              display: 'flex' // or "inline-flex"
            },
            '& .MuiTableSortLabel-root': {
              // Add & to scope it properly MuiTableSortLabel-root
              display: 'none'
            },
            '& .MuiTableCell-head:hover .MuiTableSortLabel-root': {
              display: 'flex', // or "inline-flex"
              marginLeft: 'auto'
            }
          }
        }}
        muiTablePaperProps={{
          sx: {
            border: '1px solid',
            borderColor: alpha('#D0C6BD', 0.5),
            boxShadow: '0px 2px 4px rgba(208, 198, 189, 0.2)'
          }
        }}
        muiTableBodyRowProps={({ row }) => ({
          // onClick: () => {
          //   if (!row.getIsGrouped()) {
          //     handleItemSelect(row.original)
          //   }
          // },
          sx: {
            cursor: 'pointer',
            height: '30px', // Reduce this from the default height
            maxHeight: '30px',

            // Style for grouped rows
            ...(row.getIsGrouped() &&
              {
                // ...getPriorityStyle(row.original),
                // borderTop: '2px solid',
                // borderColor: alpha('#98867B', 0.5)
              }),

            // Style for detail rows
            ...(!row.getIsGrouped() && {
              ...getPriorityStyle(row.original),

              ...(selectedItem &&
                selectedItem.DIECUT_ID === row.original.DIECUT_ID &&
                selectedItem.DIECUT_SN === row.original.DIECUT_SN && {
                  backgroundColor: alpha('#8eff8e', 0.3) + ' !important',
                  borderLeft: '4px solid #8eff8e'
                })
            }),
            '&:hover': {
              backgroundColor: alpha('#D5AA9F', 0.2)
            },
            '&.Mui-selected, &.Mui-selected:hover': {
              backgroundColor: alpha('#D5AA9F', 0.3)

              // borderLeft: '3px solid #D5AA9F'
            }
          }
        })}
        muiPaginationProps={{
          rowsPerPageOptions: [10, 50, 100, 500],
          SelectProps: {
            sx: {
              backgroundColor: '#f5f5f5',
              border: '1px solid #D0C6BD',
              borderRadius: '4px',
              padding: '2px 8px',
              '&:focus': {
                backgroundColor: '#f5f5f5'
              },
              '& .MuiSelect-select.MuiInputBase-input.MuiInput-input': {
                paddingRight: '34px !important'
              }
            }
          },
          color: 'primary',
          shape: 'rounded',
          showFirstButton: true,
          showLastButton: true,
          size: 'medium',
          sx: {
            '.MuiPagination-ul': {
              gap: '4px'
            },
            '.MuiPaginationItem-root': {
              backgroundColor: '#f5f5f5',
              border: '1px solid #D0C6BD',
              color: '#5A4D40',
              fontWeight: 600,
              '&.Mui-selected': {
                backgroundColor: '#98867B',
                color: 'white'
              },
              '&:hover': {
                backgroundColor: alpha('#D5AA9F', 0.2)
              }
            }
          }
        }}

        // rowsPerPageOptions={[10, 50, 100, 500]}
        // pageSizeOptions={[10, 50, 100, 500]}
        // muiTablePaginationProps={{
        //   SelectProps: {
        //     sx: {
        //       backgroundColor: '#f5f5f5',
        //       border: '1px solid #D0C6BD',
        //       borderRadius: '4px',
        //       padding: '2px 8px',
        //       '&:focus': {
        //         backgroundColor: '#f5f5f5'
        //       }
        //     }
        //   },
        //   labelRowsPerPage: 'Rows:',
        //   sx: {
        //     '.MuiTablePagination-displayedRows': {
        //       fontWeight: 'bold',
        //       color: '#5A4D40',
        //       marginRight: '8px'
        //     },
        //     '.MuiTablePagination-actions': {
        //       marginLeft: '8px',
        //       '& .MuiIconButton-root': {
        //         color: '#5A4D40',
        //         '&:hover': {
        //           backgroundColor: alpha('#D5AA9F', 0.2)
        //         },
        //         '&.Mui-disabled': {
        //           color: alpha('#5A4D40', 0.3)
        //         }
        //       }
        //     }
        //   }
        // }}
      />
      <JobOrderModal
        open={jobOrderModalOpen}
        onClose={() => setJobOrderModalOpen(false)}
        onSelect={handleJobOrderSelect}
      />
      <OrderDateModal
        open={orderDateModalOpen}
        onClose={() => setOrderDateModalOpen(false)}
        onSelect={handleOrderDateSelect}
        selectedDiecutForOrderDate={selectedDiecutForOrderDate}
      />
      <div className='flex gap-2 mt-1'>
        <Typography sx={{ color: 'red' }}>*สีแดงคือถึงอายุใช้งานแล้ว</Typography>
        <Typography sx={{ color: 'orange' }}>*สีส้มคือเกือบถึงอายุใช้งานแล้ว</Typography>
        <Typography sx={{ color: 'gray' }}>
          *สีเทาคือ Tooling เข้าสู่รายการ สั่งทำใหม่/เปลี่ยนใบมีด/สร้างทดแทน/แก้ไข
        </Typography>
      </div>
    </>
  )
}

export default RequestTable
