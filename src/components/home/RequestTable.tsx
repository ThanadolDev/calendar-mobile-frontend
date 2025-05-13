'use client'

import type { Dispatch, SetStateAction, ChangeEvent } from 'react'
import { useMemo, useState } from 'react'

import type { MRT_ColumnDef, MRT_ColumnFiltersState } from 'material-react-table'
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
  FormControlLabel,
  Divider,
  Menu
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Search as SearchIcon } from '@mui/icons-material'

// import ConstructionIcon from '@mui/icons-material/Construction'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'

import EventNoteIcon from '@mui/icons-material/EventNote'

import OrderDateModal from '../OrderDateModal'

import JobOrderModal from '../JobOrderModal'
import type { IDiecut } from '../../types/types'
import { formatNumber } from '../../utils/formatters'
import apiClient from '../../services/apiClient'

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
}

const RequestTable = ({
  data,
  loading,

  // handleItemSelect,
  // handleEditClick,
  searchQuery,
  setSearchQuery,
  selectedType,
  diecutTypes,
  typesLoading,
  handleTypeChange,
  setData,

  // handleOrderClick,
  handleTypeSearch
}: RequestTableProps) => {
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [jobOrderModalOpen, setJobOrderModalOpen] = useState(false)
  const [selectedDiecut, setSelectedDiecut] = useState<IDiecut | null>(null)
  const [orderDateModalOpen, setOrderDateModalOpen] = useState(false)
  const [selectedDiecutForOrderDate, setSelectedDiecutForOrderDate] = useState<IDiecut | null>(null)

  // Filter data based on search query
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply search query filter (search in multiple fields)
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase().trim()

      filtered = filtered.filter(
        item =>
          (item.DIECUT_ID && item.DIECUT_ID.toString().toLowerCase().includes(lowerCaseQuery)) ||
          (item.DIECUT_SN && item.DIECUT_SN.toLowerCase().includes(lowerCaseQuery)) ||
          (item.DIECUT_TYPE && item.DIECUT_TYPE.toLowerCase().includes(lowerCaseQuery)) ||
          (item.STATUS && item.STATUS.toLowerCase().includes(lowerCaseQuery)) ||
          (item.MODIFY_TYPE && item.MODIFY_TYPE.toLowerCase().includes(lowerCaseQuery)) ||
          (item.PROD_DESC && item.PROD_DESC.toLowerCase().includes(lowerCaseQuery)) ||
          (item.PROD_ID && item.PROD_ID.toLowerCase().includes(lowerCaseQuery)) ||
          (item.JOB_ID && item.JOB_ID.toLowerCase().includes(lowerCaseQuery)) ||
          (item.JOB_DESC && item.JOB_DESC.toLowerCase().includes(lowerCaseQuery))
      )
    }

    return filtered
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

  const handleOpenOrderDateModal = (item: IDiecut, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row selection
    setSelectedDiecutForOrderDate(item)
    setOrderDateModalOpen(true)
  }

  const handleOrderDateSelect = async (orderData: any) => {
    if (!selectedDiecutForOrderDate) return

    try {
      // Calculate dueDate (orderDate - 3 days)
      const orderDate = new Date(orderData.ORDER_DATE)
      const dueDate = new Date(orderData.DATE_USING)

      console.log({
        diecutId: selectedDiecutForOrderDate.DIECUT_ID,
        diecutSn: selectedDiecutForOrderDate.DIECUT_SN,
        orderDate: orderDate.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }),
        dueDate: dueDate.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }),
        jobId: orderData.JOB_ID,
        prodId: orderData.PROD_ID,
        prodDesc: orderData.PROD_DESC,
        REVISION: orderData.REVISION
      })

      // Call API to update the order date, due date, and job info
      const result = await apiClient.post('/api/diecuts/updateorderinfo', {
        diecutId: selectedDiecutForOrderDate.DIECUT_ID,
        diecutSn: selectedDiecutForOrderDate.DIECUT_SN,
        orderDate: orderDate.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }),
        dueDate: dueDate.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }),
        jobId: orderData.JOB_ID,
        prodId: orderData.PROD_ID,
        jobDesc: orderData.JOB_DESC,
        REVISION: orderData.REVISION
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
                REVISION: orderData.REVISION
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
  const columns = useMemo<MRT_ColumnDef<IDiecut>[]>(
    () => [
      // DIECUT_ID column (used for grouping)
      {
        accessorKey: 'DIECUT_ID',
        header: 'เลขที่',
        size: 125,
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
        size: 130,
        filterVariant: 'select',
        filterSelectOptions: [
          { text: 'สร้างใหม่', value: 'N' },
          { text: 'เปลี่ยนใบมีด', value: 'B' },
          { text: 'สร้างทดแทน', value: 'M' },
          { text: 'แก้ไข', value: 'E' },
          { text: 'พร้อมใช้งาน', value: 'T' },
          { text: 'ยกเลิก', value: 'F' },
          { text: 'ทำลายแล้ว', value: 'D' }
        ] as any,
        Cell: ({ cell }) => {
          const status = cell.getValue<string | null | undefined>()

          return status ? <Chip label={getStatusText(status)} size='small' color={getStatusColor(status)} /> : null
        },

        // Add this custom Filter component to override the default behavior
        Filter: ({ header }) => {
          const { column } = header
          const filterValue = column.getFilterValue() as string

          return (
            <FormControl size='small' variant='outlined'>
              <Select
                value={filterValue || ''}
                onChange={e => column.setFilterValue(e.target.value)}
                displayEmpty
                sx={{
                  minWidth: '100px',
                  maxWidth: '120px',
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
                      maxHeight: 200
                    }
                  }
                }}
              >
                <MenuItem value=''>
                  <em>ทั้งหมด</em>
                </MenuItem>
                <MenuItem value='N' dense>
                  สร้างใหม่
                </MenuItem>
                <MenuItem value='B' dense>
                  เปลี่ยนใบมีด
                </MenuItem>
                <MenuItem value='M' dense>
                  สร้างทดแทน
                </MenuItem>
                <MenuItem value='E' dense>
                  แก้ไข
                </MenuItem>
                <MenuItem value='T' dense>
                  พร้อมใช้งาน
                </MenuItem>
                <MenuItem value='F' dense>
                  ยกเลิก
                </MenuItem>
                <MenuItem value='D' dense>
                  ทำลายแล้ว
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
        size: 125
      },

      // {
      //   accessorKey: 'PRIORITY',
      //   header: 'PRIORITY',
      //   size: 150
      // },

      //Type column with dropdown filter
      // {
      //   accessorKey: 'DIECUT_TYPE',
      //   header: 'ประเภทงาน',
      //   size: 130,
      //   filterFn: diecutTypeFilterFn,
      //   filterSelectOptions: diecutTypes.map(type => ({ text: type, value: type })),
      //   filterVariant: 'select',
      //   Filter: ({ header }) => (
      //     <Box sx={{ minWidth: 200, display: 'flex', gap: 1, alignItems: 'center' }}>
      //       <Typography variant='body2' fontWeight='bold'>
      //         ประเภทงาน:
      //       </Typography>
      //       {typesLoading ? (
      //         <CircularProgress size={20} sx={{ color: '#98867B' }} />
      //       ) : (
      //         <select
      //           value={selectedType}
      //           onChange={e => {
      //             handleTypeChange(e.target.value)
      //             header.column.setFilterValue(e.target.value)
      //           }}
      //           style={{
      //             padding: '6px 8px',
      //             borderRadius: '4px',
      //             border: '1px solid #D0C6BD',
      //             backgroundColor: '#f5f5f5',
      //             minWidth: 120
      //           }}
      //         >
      //           <option value=''>ทั้งหมด</option>
      //           {diecutTypes.map(type => (
      //             <option key={type} value={type}>
      //               {type}
      //             </option>
      //           ))}
      //         </select>
      //       )}
      //     </Box>
      //   )
      // },

      {
        accessorKey: 'JOB_ID',
        header: 'JOB',
        size: 120,
        Cell: ({ row, cell }) => {
          const value = cell.getValue() || '-'
          const isNewAdd = row.original.NEW_ADD === true

          // Only show the button for statuses that allow editing

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography sx={{ color: '#555555' }}>{String(value || '-')}</Typography>
              {/* {showButton && ( */}
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

              {/* )} */}
            </Box>
          )
        }
      },

      {
        accessorKey: 'PROD_ID',
        header: 'รหัสสินค้า',
        size: 150,
        Cell: ({ row, cell }) => {
          const value = cell.getValue()
          const revision = row.original.REVISION // Try to get REVISION from the data

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
      {
        accessorKey: 'BLANK_SIZE_X',
        header: 'กว้าง',
        size: 150,
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue() as string | number)

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        }
      },
      {
        accessorKey: 'BLANK_SIZE_Y',
        header: 'ยาว',
        size: 150,
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue() as string | number)

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        }
      },

      {
        accessorKey: 'REMAIN',
        header: 'อายุคงเหลือ',
        enableColumnOrdering: false,
        size: 165,
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue() as string | number)

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        }
      },

      // Add these changes to the RequestTable component

      // 1. Update the columns definition to include the DUE_DATE handling
      // This part goes inside your useMemo for columns definition
      {
        accessorKey: 'DUE_DATE',
        header: 'วันที่ต้องการใช้',
        size: 170,
        Cell: ({ cell }) => {
          const value = cell.getValue()

          // const status = row.original.STATUS
          // const diecutId = row.original.DIECUT_ID
          // const diecutSN = row.original.DIECUT_SN
          // const isNewAdd = row.original.NEW_ADD === true

          // Only allow editing for certain statuses
          // const canEdit =
          //   status !== undefined && ['N', 'B', 'M', 'E'].includes(status) && !row.getIsGrouped() && !isNewAdd

          // Parse the date more carefully
          let date = null

          // let formattedDateValue = ''
          let formattedDisplayDate = '-'

          if (value) {
            try {
              // Handle various date formats
              date = new Date(value as string)

              // Check if date is valid
              if (!isNaN(date.getTime())) {
                // Format for display (DD/MM/YYYY)
                formattedDisplayDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}/${date.getFullYear()}`

                // Format for input value (YYYY-MM-DD)
                // formattedDateValue = date.toISOString().split('T')[0]
              }
            } catch (error) {
              console.error('Error parsing date:', error)
            }
          }

          // const handleDateChange = async (e: any) => {
          //   e.stopPropagation() // Prevent row selection

          //   // Get the new date value from the input
          //   const newDateStr = e.target.value

          //   if (!newDateStr || !diecutId || !diecutSN) return

          //   try {
          //     const newDate = new Date(newDateStr)

          //     // Validate date
          //     if (isNaN(newDate.getTime())) {
          //       console.error('Invalid date')

          //       return
          //     }

          //     // Call API to update the due date
          //     const result = await apiClient.post('/api/diecuts/updatedate', {
          //       diecutId: diecutId,
          //       diecutSn: diecutSN,
          //       dueDate: newDate.toISOString()
          //     })

          //     if ((result as { success: boolean }).success) {
          //       // If the API call was successful, update the local data
          //       if (setData && data) {
          //         const updatedData = data.map(item => {
          //           if (item.DIECUT_ID === diecutId && item.DIECUT_SN === diecutSN) {
          //             return {
          //               ...item,
          //               DUE_DATE: newDate
          //             }
          //           }

          //           return item
          //         })

          //         setData(updatedData)
          //       }
          //     } else {
          //       console.error('Failed to update due date:')
          //     }
          //   } catch (error) {
          //     console.error('Error updating due date:', error)
          //   }
          // }

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
        size: 150,
        Cell: ({ row, cell }) => {
          const value = cell.getValue()
          const status = row.original.STATUS

          // const diecutId = row.original.DIECUT_ID
          // const diecutSN = row.original.DIECUT_SN
          const isNewAdd = row.original.NEW_ADD === true

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
            </Box>
          )
        }
      }

      // {
      //   accessorKey: 'actions',
      //   header: 'การดำเนินการ',
      //   size: 150,
      //   enableSorting: false,
      //   enableColumnFilter: false,

      //   AggregatedCell: ({ row }) => {
      //     const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

      //     const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
      //       e.stopPropagation() // Prevent row selection when clicking the button
      //       setMenuAnchor(e.currentTarget)
      //     }

      //     const handleClose = () => {
      //       setMenuAnchor(null)
      //     }

      //     const handleCreateNewBladeInGroup = () => {
      //       handleClose()

      //       // Get the group's DIECUT_ID
      //       const diecutId: string = row.getValue('DIECUT_ID')

      //       // Find all existing blades with this DIECUT_ID
      //       const existingBladesInGroup = data.filter(item => item.DIECUT_ID === diecutId)

      //       // Extract sequence numbers from existing SNs
      //       const sequenceNumbers = existingBladesInGroup.map(blade => {
      //         // Parse SN to extract the sequence number at the end
      //         const parts = blade.DIECUT_SN?.split('-') || []
      //         const lastPart = parts[parts.length - 1]

      //         // Try to convert the last part to a number
      //         const num = parseInt(lastPart)

      //         // Return the number if valid, otherwise 0
      //         return isNaN(num) ? 0 : num
      //       })

      //       // Find the highest sequence number
      //       const highestSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0

      //       // Generate the next sequence number
      //       const nextSequence = highestSequence + 1

      //       // Create new SN with incremented sequence
      //       const newSN = `${diecutId}-${nextSequence}`

      //       // Create a new item with this DIECUT_ID and sequential SN
      //       const newItem: IDiecut = {
      //         DIECUT_ID: diecutId,
      //         DIECUT_SN: newSN,
      //         STATUS: 'N', // Default status for new records
      //         DIECUT_TYPE: selectedType[0] || 'DC',

      //         // Add other required fields with default values
      //         MODIFY_TYPE: 'N',
      //         NEW_ADD: true
      //       }

      //       // Add the new item to the data array directly
      //       if (typeof setData === 'function') {
      //         setData([...data, newItem])
      //       }

      //       // Call the parent handlers to select and edit the new item
      //       // handleItemSelect(newItem)
      //       // handleEditClick(newItem)

      //       // Expand the group to show the new item
      //       if (!row.getIsExpanded()) {
      //         row.toggleExpanded()
      //       }
      //     }

      //     // const handleExpandGroup = () => {
      //     //   handleClose()
      //     //   row.toggleExpanded()
      //     // }

      //     return (
      //       <>
      //         {/* <Button
      //           size='small'
      //           variant='contained'
      //           onClick={handleMenuClick}
      //           sx={{
      //             backgroundColor: '#98867B',
      //             color: 'white',
      //             '&:hover': {
      //               backgroundColor: '#5A4D40'
      //             }
      //           }}
      //         >
      //           <AddIcon />
      //           <Typography>เพิ่ม COPY</Typography>
      //         </Button> */}
      //         <Button
      //           size='small'
      //           variant='contained'
      //           onClick={handleMenuClick}
      //           sx={{
      //             backgroundColor: '#98867B',
      //             color: 'white',
      //             '&:hover': {
      //               backgroundColor: '#5A4D40'
      //             },
      //             width: '150px'
      //           }}
      //           startIcon={<AddIcon fontSize='small' />}
      //         >
      //           เพิ่ม COPY
      //         </Button>

      //         <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleClose} sx={{ mt: 1 }}>
      //           <MenuItem onClick={handleCreateNewBladeInGroup}>
      //             <AddIcon fontSize='small' sx={{ mr: 1 }} />
      //             เพิ่มใบมีดในกลุ่มนี้
      //           </MenuItem>
      //         </Menu>
      //       </>
      //     )
      //   },

      //   Cell: ({ row }) => {
      //     const status = row.original.STATUS
      //     const isNewRecord = row.original.DIECUT_SN?.includes('-NEW-')

      //     // Define which statuses show the Process button
      //     const showProcessButton = (status !== undefined && ['N', 'B', 'M', 'E'].includes(status)) || isNewRecord

      //     // Define which status shows the Order button
      //     const showOrderButton = status === 'T'

      //     // For status F, don't show any button
      //     if (status === 'F') {
      //       return null
      //     }

      //     const handleProcessButtonClick = (e: React.MouseEvent) => {
      //       e.stopPropagation() // Prevent row selection when clicking the button

      //       // First select the item
      //       handleItemSelect(row.original)

      //       // Then trigger the edit mode by calling handleEditBlade, similar to the detail page
      //       if (row.original) {
      //         // Convert the IDiecut to BladeItem for edit mode
      //         // const bladeToEdit: BladeItem = {
      //         //   DIECUT_ID: row.original.DIECUT_ID,
      //         //   DIECUT_SN: row.original.DIECUT_SN,
      //         //   BLADE_TYPE: row.original.BLADE_TYPE || '',
      //         //   DIECUT_AGE: row.original.DIECUT_AGE || 0,
      //         //   STATUS: row.original.STATUS || 'N',
      //         //   bladeType: row.original.BLADE_TYPE || '',
      //         //   bladeSize: '',
      //         //   details: '',
      //         //   TL_STATUS: 'GOOD',
      //         //   PROB_DESC: row.original.PROB_DESC || '',
      //         //   START_TIME: new Date(),
      //         //   END_TIME: null,
      //         //   PRODUCTION_ISSUE: '',
      //         //   TOOLING_AGE: row.original.DIECUT_AGE || 0,
      //         //   FIX_DETAILS: '',
      //         //   BLADE_SIZE: '',
      //         //   MULTI_BLADE_REASON: '',
      //         //   MULTI_BLADE_REMARK: '',
      //         //   isNewlyAdded: isNewRecord,
      //         //   REMARK: row.original.REMARK || '',
      //         //   MODIFY_TYPE: row.original.MODIFY_TYPE || 'N',
      //         //   JOB_ORDER: row.original.JOB_ORDER || '',
      //         //   PRODUCT_CODE: row.original.PRODUCT_CODE || '',
      //         //   PRODUCT_NAME: row.original.PRODUCT_NAME || ''
      //         // }

      //         // Call handleEditClick which should trigger the edit mode in DetailPanel
      //         handleEditClick(row.original)
      //       }
      //     }

      //     // Add a new handler for Order button
      //     const handleOrderButtonClick = (e: React.MouseEvent) => {
      //       e.stopPropagation() // Prevent row selection when clicking the button

      //       if (handleOrderClick) {
      //         handleOrderClick(row.original)
      //       }
      //     }

      //     return (
      //       <>
      //         {showProcessButton && (
      //           <Button
      //             size='small'
      //             variant='contained'
      //             onClick={handleProcessButtonClick}
      //             sx={{
      //               backgroundColor: isNewRecord ? '#5A9E6F' : '#98867B', // Different color for new records
      //               '&:hover': {
      //                 backgroundColor: isNewRecord ? '#3F7F4F' : '#5A4D40'
      //               },
      //               width: '150px'
      //             }}
      //             startIcon={<ConstructionIcon fontSize='small' />}
      //           >
      //             Process
      //           </Button>
      //         )}

      //         {showOrderButton && (
      //           <Button
      //             size='small'
      //             variant='contained'
      //             onClick={handleOrderButtonClick} // Use the new order handler instead
      //             sx={{
      //               backgroundColor: '#98867B',
      //               '&:hover': {
      //                 backgroundColor: '#5A4D40'
      //               },
      //               width: '150px'
      //             }}
      //             startIcon={<NoteAdd />}
      //           >
      //             สั่งทำ
      //           </Button>
      //         )}
      //       </>
      //     )
      //   }
      // }
    ],
    [diecutTypes, typesLoading, selectedType, handleTypeChange]
  )

  // Clear all filters
  // const handleClearFilters = () => {
  //   setSearchQuery('')
  //   setSelectedType('')
  //   setColumnFilters([])
  // }

  // Define custom top toolbar with search and filters
  const RenderTopToolbar = () => {
    const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null)
    const [showStatusT, setShowStatusT] = useState(true) // Default to showing all statuses

    // Handle filter menu open/close
    // const handleFilterMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    //   setFilterMenuAnchor(event.currentTarget)
    // }

    const handleFilterMenuClose = () => {
      setFilterMenuAnchor(null)
    }

    // Handle filter change for status T
    const handleStatusTFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setShowStatusT(event.target.checked)

      // Apply filter to the data
      if (event.target.checked) {
        // When checked, filter out status T records
        setColumnFilters(prev => [
          ...prev.filter(f => f.id !== 'STATUS'),
          { id: 'STATUS', value: 'T', operator: 'notEquals' }
        ])
      } else {
        // When unchecked, show all records (remove the filter)
        setColumnFilters(prev => prev.filter(f => f.id !== 'STATUS'))
      }
    }

    // Handle creating a new record
    // const handleCreateNewRecord = () => {
    //   // Close menu
    //   handleFilterMenuClose()

    //   // Create a new record with default values
    //   const newItem: IDiecut = {
    //     DIECUT_ID: selectedType[0] || 'DC', // Use selected type or default to DC
    //     DIECUT_SN: `${selectedType[0] || 'DC'}-NEW-${Date.now()}`, // Generate a temporary SN
    //     STATUS: 'N', // Default status for new records
    //     DIECUT_TYPE: selectedType[0] || 'DC'

    //     // Add other required fields with default values
    //   }

    //   // Add the new item to the data (Note: This is just UI state change; actual API call will happen later)
    //   // setData([newItem, ...data]);

    //   // Select the new item and open edit mode
    //   handleItemSelect(newItem)
    //   handleEditClick(newItem)
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
          placeholder='ค้นหา.... (เลขที่, รหัส)'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size='small'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            )

            // endAdornment: (
            //   <InputAdornment position='end'>
            //     {searchQuery ? (
            //       <ClearIcon fontSize='small' sx={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            //     ) : (
            //       <IconButton size='small' onClick={handleFilterMenuClick}>
            //         <FilterList fontSize='small' />
            //       </IconButton>
            //     )}
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

        {/* Filter and Create Menu */}
        <Menu
          anchorEl={filterMenuAnchor}
          open={Boolean(filterMenuAnchor)}
          onClose={handleFilterMenuClose}
          PaperProps={{
            sx: {
              minWidth: '200px',
              p: 1,
              boxShadow: '0px 4px 8px rgba(0,0,0,0.1)'
            }
          }}
        >
          <MenuItem sx={{ p: 0 }}>
            <FormControlLabel
              control={<Checkbox checked={showStatusT} onChange={handleStatusTFilterChange} size='small' />}
              label='Show Ready Items (Status = T)'
              sx={{ width: '100%', pl: 1 }}
            />
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          {/* <MenuItem onClick={handleCreateNewRecord} sx={{ color: 'primary.main' }}>
            <AddIcon fontSize='small' sx={{ mr: 1 }} />
            Create New Record
          </MenuItem>

          <MenuItem onClick={handleClearFilters}>
            <ClearIcon fontSize='small' sx={{ mr: 1 }} />
            Clear All Filters
          </MenuItem> */}
        </Menu>

        <Box sx={{ marginLeft: 'auto' }}>
          <Chip
            label={`รวม ${formatNumber(
              new Set(filteredData.map(item => item.DIECUT_ID)).size
            )} กลุ่ม (${formatNumber(filteredData.length)} รายการ)`}
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
      </Box>
      <FormControl size='small' sx={{ minWidth: 150, mb: 2 }}>
        <InputLabel id='diecut-type-filter-label'>เลือกประเภท Diecut</InputLabel>
        <Select
          labelId='diecut-type-filter-label'
          id='diecut-type-filter'
          value={selectedType}
          label='เลือกประเภท Diecut'
          multiple
          onChange={event => {
            // Convert the event here
            const compatibleEvent = {
              target: {
                name: event.target.name,
                value: event.target.value
              }
            } as ChangeEvent<{ name?: string; value: unknown }>

            handleTypeChange(compatibleEvent)
          }}
          renderValue={selected => {
            if (selected.includes('')) return 'ทั้งหมด'

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
        >
          {/* <MenuItem value=''>
            <Checkbox checked={selectedType.includes('')} />
            <ListItemText primary='ทั้งหมด' />
          </MenuItem> */}

          {diecutTypes.map(type => (
            <MenuItem key={type.PTC_TYPE} value={type.PTC_TYPE}>
              <Checkbox checked={selectedType.includes(type.PTC_TYPE)} />
              <ListItemText primary={`${type.PTC_DESC}`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button sx={{ ml: 2 }} variant='contained' onClick={handleTypeSearch}>
        ค้นหา
      </Button>
      <MaterialReactTable
        columns={columns}
        data={filteredData}
        enableGrouping
        enableExpanding
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
          }
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

            // Style for grouped rows
            ...(row.getIsGrouped() &&
              {
                // ...getPriorityStyle(row.original),
                // borderTop: '2px solid',
                // borderColor: alpha('#98867B', 0.5)
              }),

            // Style for detail rows
            ...(!row.getIsGrouped() && {
              // borderLeft: '4px solid',
              // borderColor: alpha('#D0C6BD', 0.5),
              ...getPriorityStyle(row.original)
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
          *สีเทาคือ Tooling เข้าสู่รายการ สร้างใหม่/เปลี่ยนใบมีด/สร้างทดแทน/แก้ไข
        </Typography>
      </div>
    </>
  )
}

export default RequestTable
