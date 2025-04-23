'use client'

import { useMemo, useState } from 'react'

import type { MRT_ColumnDef, MRT_ColumnFiltersState, MRT_FilterFn } from 'material-react-table'
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
  IconButton
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Search as SearchIcon, Clear as ClearIcon, Add as AddIcon } from '@mui/icons-material'

import type { IDiecut } from '../../types/types'
import { formatNumber } from '../../utils/formatters'
import appConfig from '../../configs/appConfig'

interface RequestTableProps {
  data: IDiecut[]
  loading: boolean
  isManager: boolean
  handleItemSelect: (item: IDiecut) => void
  handleEditClick: (item: IDiecut) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedType: string
  setSelectedType: (type: string) => void
  diecutTypes: string[]
  typesLoading: boolean
  handleTypeChange: (type: string) => void
}

const RequestTable = ({
  data,
  loading,
  isManager,
  handleItemSelect,
  handleEditClick,
  searchQuery,
  setSearchQuery,
  setSelectedType,
  selectedType,
  diecutTypes,
  typesLoading,
  handleTypeChange
}: RequestTableProps) => {
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])

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
          (item.MODIFY_TYPE && item.MODIFY_TYPE.toLowerCase().includes(lowerCaseQuery))
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
        return 'ซ่อม'
      case 'T':
        return 'พร้อมใช้งาน'
      case 'F':
        return 'ยกเลิก'
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
      default:
        return 'default'
    }
  }

  const getPriorityStyle = (item: IDiecut) => {
    const isExpired = item?.USED >= item?.AGES
    const isNearingExpiration = item?.USED >= item?.DIECUT_NEAR_EXP

    if (isExpired) {
      if (item.STATUS !== 'T') {
        return { backgroundColor: 'rgba(200, 200, 200, 0.7)' } // Gray
      }

      return { backgroundColor: 'rgba(255, 200, 200, 0.7)' } // Red tint
    }

    if (isNearingExpiration) {
      if (item.STATUS !== 'T') {
        return { backgroundColor: 'rgba(200, 200, 200, 0.7)' } // Gray
      }

      return { backgroundColor: 'rgba(255, 171, 2, 0.7)' } // Orange tint
    }

    return {}
  }

  // Function to check if Process button should be active
  const isActiveForProcess = (status: string | null | undefined) => {
    if (!status) return false

    return ['N', 'B', 'M', 'E'].includes(status)
  }

  // Function to handle Process button click
  const handleProcessClick = (item: IDiecut) => {
    // Notify the parent component to open the process dialog
    handleEditClick(item)
  }

  // Custom filter function for DIECUT_TYPE
  const diecutTypeFilterFn: MRT_FilterFn<IDiecut> = (row, id, filterValue) => {
    if (!filterValue || filterValue === '') return true
    const value = row.getValue(id)

    return value === filterValue
  }

  // Define columns for the table
  const columns = useMemo<MRT_ColumnDef<IDiecut>[]>(
    () => [
      // DIECUT_ID column (used for grouping)
      {
        accessorKey: 'DIECUT_ID',
        header: 'เลขที่ Tooling',
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
        size: 130,
        filterVariant: 'select',
        filterSelectOptions: [
          { text: 'สร้างใหม่', value: 'N' },
          { text: 'เปลี่ยนใบมีด', value: 'B' },
          { text: 'สร้างทดแทน', value: 'M' },
          { text: 'ซ่อม', value: 'E' },
          { text: 'พร้อมใช้งาน', value: 'T' },
          { text: 'ยกเลิก', value: 'F' }
        ],
        Cell: ({ cell }) => {
          const status = cell.getValue<string | null | undefined>()

          return status ? <Chip label={getStatusText(status)} size='small' color={getStatusColor(status)} /> : null
        }
      },

      // SN column
      {
        accessorKey: 'DIECUT_SN',
        header: 'รหัส Tooling',
        size: 150
      },
      {
        accessorKey: 'PRIORITY',
        header: 'PRIORITY',
        size: 150
      },

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
        accessorKey: 'JOB_ORDER',
        header: 'JOB Order',
        size: 150,
        Cell: ({ cell }) => cell.getValue() || '-'
      },

      {
        accessorKey: 'PRODUCT_CODE',
        header: 'รหัสสินค้า',
        size: 150,
        Cell: ({ cell }) => cell.getValue() || '-'
      },
      {
        accessorKey: 'ชื่องาน',
        header: 'ชื่องาน',
        size: 150,
        Cell: ({ cell }) => cell.getValue() || '-'
      },
      {
        accessorKey: 'BLANK_SIZE_X',
        header: 'กว้าง',
        size: 150,
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue())

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        }
      },
      {
        accessorKey: 'BLANK_SIZE_Y',
        header: 'ยาว',
        size: 150,
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue())

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        }
      },
      {
        accessorKey: 'AGES',
        header: 'AGES',
        size: 150,
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue())

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        }
      },
      {
        accessorKey: 'REMAIN',
        header: 'REMAIN',
        size: 150,
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue())

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        }
      },
      {
        accessorKey: 'DIECUT_NEAR_EXP',
        header: 'DIECUT_NEAR_EXP',
        size: 150,
        Cell: ({ cell }) => {
          const value = formatNumber(cell.getValue())

          return <div style={{ textAlign: 'right', width: '100%' }}>{value || '-'}</div>
        }
      },

      {
        accessorKey: 'actions',
        header: 'การดำเนินการ',
        size: 120,
        enableSorting: false,
        enableColumnFilter: false,

        AggregatedCell: ({ row }) => (
          <IconButton
            color='primary'
            size='small'
            onClick={e => {
              e.stopPropagation() // Prevent row selection when clicking the button
              // You can add any action you want here
              // For example, expand the group
              row.toggleExpanded()
            }}
            sx={{
              backgroundColor: '#98867B',
              color: 'white',
              '&:hover': {
                backgroundColor: '#5A4D40'
              }
            }}
          >
            <AddIcon />
          </IconButton>
        ),

        Cell: ({ row }) => {
          const status = row.original.STATUS

          // Define which statuses show the Process button
          const showProcessButton = ['N', 'B', 'M', 'E'].includes(status)

          // Define which status shows the Order button
          const showOrderButton = status === 'T'

          // For status F, don't show any button
          if (status === 'F') {
            return null
          }

          return (
            <>
              {showProcessButton && (
                <Button
                  size='small'
                  variant='contained'
                  onClick={e => {
                    e.stopPropagation()
                    handleProcessClick(row.original)
                  }}
                  sx={{
                    backgroundColor: '#98867B',
                    '&:hover': {
                      backgroundColor: '#5A4D40'
                    }
                  }}
                >
                  Process
                </Button>
              )}

              {showOrderButton && (
                <Button
                  size='small'
                  variant='contained'
                  onClick={e => {
                    e.stopPropagation()
                    handleProcessClick(row.original)
                  }}
                  sx={{
                    backgroundColor: '#98867B',
                    '&:hover': {
                      backgroundColor: '#5A4D40'
                    }
                  }}
                >
                  Order
                </Button>
              )}
            </>
          )
        }
      }
    ],
    [diecutTypes, typesLoading, selectedType, handleTypeChange]
  )

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedType('')
    setColumnFilters([])
  }

  // Define custom top toolbar with search and filters
  const renderTopToolbar = () => {
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
          placeholder='Search (ID, SN, Type, Status...)'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size='small'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position='end'>
                <ClearIcon fontSize='small' sx={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              </InputAdornment>
            ) : null
          }}
          sx={{
            width: '300px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#f5f5f5'
            }
          }}
        />
        {/* <>
        <Button
          variant='outlined'
          startIcon={<ClearIcon />}
          size='small'
          onClick={handleClearFilters}
          sx={{
            borderColor: '#98867B',
            color: '#5A4D40',
            '&:hover': {
              borderColor: '#5A4D40',
              backgroundColor: alpha('#EFEDEA', 0.1)
            }
          }}
        >
          Clear Filters
        </Button>
</> */}
        <Box sx={{ marginLeft: 'auto' }}>
          <Chip
            label={`รวม ${formatNumber(
              // Count unique DIECUT_IDs
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
        <Typography variant='h6'>{isManager ? 'Manage Requests' : 'View Requests'}</Typography>

        {/* Show feature toggle status in dev mode */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip size='small' color={'default'} label={`ROLE : ${appConfig.defaultRole}`} />
          </Box>
        )}
      </Box>
      <FormControl size='small' sx={{ minWidth: 150, mb: 2 }}>
        <InputLabel id='diecut-type-filter-label'>เลือกประเภท Diecut</InputLabel>
        <Select
          labelId='diecut-type-filter-label'
          id='diecut-type-filter'
          value={selectedType}
          label='เลือกประเภท Diecut'
          multiple
          onChange={handleTypeChange}
          renderValue={selected => {
            if (selected.includes('')) return 'ทั้งหมด'

            return selected.join(', ')
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
          <MenuItem value=''>
            <Checkbox checked={selectedType.includes('')} />
            <ListItemText primary='ทั้งหมด' />
          </MenuItem>

          {diecutTypes.map(type => (
            <MenuItem key={type.PTC_TYPE} value={type.PTC_TYPE}>
              <Checkbox checked={selectedType.includes(type.PTC_TYPE)} />
              <ListItemText primary={`${type.PTC_TYPE} - ${type.PTC_DESC}`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
          columnFilters

          // columnPinning:{left:''}
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
        renderTopToolbar={renderTopToolbar}
        // positionToolbarAlertBanner='bottom'
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
          onClick: () => {
            if (!row.getIsGrouped()) {
              handleItemSelect(row.original)
            }
          },
          sx: {
            cursor: 'pointer',

            // Style for grouped rows
            ...(row.getIsGrouped() && {
              // ...getPriorityStyle(row.original),
              borderTop: '2px solid',
              borderColor: alpha('#98867B', 0.5)
            }),

            // Style for detail rows
            ...(!row.getIsGrouped() && {
              borderLeft: '4px solid',
              borderColor: alpha('#D0C6BD', 0.5),
              ...getPriorityStyle(row.original)
            }),
            '&:hover': {
              backgroundColor: alpha('#D5AA9F', 0.2)
            },
            '&.Mui-selected, &.Mui-selected:hover': {
              backgroundColor: alpha('#D5AA9F', 0.3),
              borderLeft: '3px solid #D5AA9F'
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
        rowsPerPageOptions={[10, 50, 100, 500]}
        pageSizeOptions={[10, 50, 100, 500]}
        muiTablePaginationProps={{
          SelectProps: {
            sx: {
              backgroundColor: '#f5f5f5',
              border: '1px solid #D0C6BD',
              borderRadius: '4px',
              padding: '2px 8px',
              '&:focus': {
                backgroundColor: '#f5f5f5'
              }
            }
          },
          labelRowsPerPage: 'Rows:',
          sx: {
            '.MuiTablePagination-displayedRows': {
              fontWeight: 'bold',
              color: '#5A4D40',
              marginRight: '8px'
            },
            '.MuiTablePagination-actions': {
              marginLeft: '8px',
              '& .MuiIconButton-root': {
                color: '#5A4D40',
                '&:hover': {
                  backgroundColor: alpha('#D5AA9F', 0.2)
                },
                '&.Mui-disabled': {
                  color: alpha('#5A4D40', 0.3)
                }
              }
            }
          }
        }}
      />
    </>
  )
}

export default RequestTable
