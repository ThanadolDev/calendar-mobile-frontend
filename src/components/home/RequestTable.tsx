'use client'

import { useMemo, useState, useEffect } from 'react'

import type { MRT_ColumnDef } from 'material-react-table'
import { MaterialReactTable } from 'material-react-table'
import type { SelectChangeEvent } from '@mui/material'
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
  MenuItem
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material'

import type { IDiecut } from '../../types/types'

interface RequestTableProps {
  data: IDiecut[]
  loading: boolean
  isManager: boolean
  handleItemSelect: (item: IDiecut) => void
  handleEditClick: (item: IDiecut) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const RequestTable = ({
  data,
  loading,
  isManager,
  handleItemSelect,
  handleEditClick,
  searchQuery,
  setSearchQuery
}: RequestTableProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')

  // Extract unique values for dropdowns
  const uniqueDiecutTypes = useMemo(() => {
    const types = new Set(data.map(item => item.DIECUT_TYPE).filter(Boolean))

    return Array.from(types).sort()
  }, [data])

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(data.map(item => item.STATUS).filter(Boolean))

    return Array.from(statuses).sort()
  }, [data])

  // Filter data based on search query and filters
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

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(item => item.STATUS === selectedStatus)
    }

    // Apply diecut type filter
    if (selectedType) {
      filtered = filtered.filter(item => item.DIECUT_TYPE === selectedType)
    }

    return filtered
  }, [data, searchQuery, selectedStatus, selectedType])

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedStatus('')
    setSelectedType('')
  }

  // Define table columns
  const columns = useMemo<MRT_ColumnDef<IDiecut>[]>(
    () => [
      {
        accessorKey: 'DIECUT_ID',
        header: 'ID',
        size: 100
      },
      {
        accessorKey: 'DIECUT_SN',
        header: 'DIECUT_SN',
        size: 200
      },
      {
        accessorKey: 'AGES',
        header: 'AGES'
      },
      {
        accessorKey: 'USED',
        header: 'USED'
      },
      {
        accessorKey: 'REMAIN',
        header: 'REMAIN'
      },
      {
        accessorKey: 'DIECUT_NEAR_EXP',
        header: 'DIECUT_NEAR_EXP'
      },
      {
        accessorKey: 'PRIORITY',
        header: 'PRIORITY',
        Cell: ({ cell }) => {
          const priority = cell.getValue<string>()

          return priority ? (
            <Chip
              label={priority}
              size='small'
              color={priority === 'High' ? 'error' : priority === 'Medium' ? 'warning' : 'default'}
            />
          ) : null
        }
      },
      {
        accessorKey: 'STATUS',
        header: 'STATUS',
        Cell: ({ cell }) => {
          const status = cell.getValue<string>()

          return status ? (
            <Chip
              label={status}
              size='small'
              color={
                status === 'Pass'
                  ? 'success'
                  : status === 'Pending'
                    ? 'warning'
                    : status === 'Rejected'
                      ? 'error'
                      : 'default'
              }
            />
          ) : null
        }
      },
      {
        accessorKey: 'DIECUT_TYPE',
        header: 'DIECUT_TYPE'
      },
      {
        accessorKey: 'TL_STATUS',
        header: 'TL_STATUS'
      },
      {
        accessorKey: 'LAST_MODIFY',
        header: 'LAST_MODIFY',
        Cell: ({ cell }) => {
          const date = cell.getValue<string>()

          if (!date) return null

          try {
            return new Date(date).toLocaleDateString()
          } catch (e) {
            return date
          }
        }
      },
      {
        accessorKey: 'DUE_DATE',
        header: 'DUE_DATE',
        Cell: ({ cell }) => {
          const date = cell.getValue<string>()

          if (!date) return null

          try {
            return new Date(date).toLocaleDateString()
          } catch (e) {
            return date
          }
        }
      },
      {
        accessorKey: 'MODIFY_TYPE',
        header: 'MODIFY_TYPE'
      }
    ],
    []
  )

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

        <FormControl size='small' sx={{ minWidth: 150 }}>
          <InputLabel id='diecut-type-filter-label'>Diecut Type</InputLabel>
          <Select
            labelId='diecut-type-filter-label'
            id='diecut-type-filter'
            value={selectedType}
            label='Diecut Type'
            onChange={(e: SelectChangeEvent) => setSelectedType(e.target.value)}
          >
            <MenuItem value=''>All Types</MenuItem>
            {uniqueDiecutTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size='small' sx={{ minWidth: 120 }}>
          <InputLabel id='status-filter-label'>Status</InputLabel>
          <Select
            labelId='status-filter-label'
            id='status-filter'
            value={selectedStatus}
            label='Status'
            onChange={(e: SelectChangeEvent) => setSelectedStatus(e.target.value)}
          >
            <MenuItem value=''>All Statuses</MenuItem>
            {uniqueStatuses.map(status => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
              backgroundColor: alpha('#D0C6BD', 0.1)
            }
          }}
        >
          Clear Filters
        </Button>

        <Box sx={{ marginLeft: 'auto' }}>
          <Chip label={`${filteredData.length} of ${data.length} items`} size='small' sx={{ mr: 1 }} />
          <Chip
            label={isManager ? 'Manager View' : 'User View'}
            color={isManager ? 'primary' : 'default'}
            size='small'
          />
        </Box>
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6' gutterBottom>
          {isManager ? 'Manage Requests' : 'View Requests'}
        </Typography>
      </Box>

      <MaterialReactTable
        columns={columns}
        data={filteredData}
        enableRowSelection={false}
        enableMultiRowSelection={false}
        enableColumnFilters={false}
        enableGlobalFilter={false}
        enableColumnResizing={true}
        enableColumnPinning={true}
        enableColumnActions={true}
        enableTopToolbar={true}
        positionToolbarAlertBanner='bottom'
        state={{
          isLoading: loading
        }}
        renderTopToolbar={renderTopToolbar}
        paginationDisplayMode='pages'
        muiTableContainerProps={{
          sx: {
            maxHeight: '65vh',
            '& .MuiTableRow-root:nth-of-type(odd)': {
              backgroundColor: alpha('#EFEDEA', 0.7)
            },
            '& .MuiTableRow-root:nth-of-type(even)': {
              backgroundColor: alpha('#D0C6BD', 0.5)
            },
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
        muiTableBodyCellProps={{
          sx: {
            color: '#000000'
          }
        }}
        muiSelectCheckboxProps={{
          sx: {
            color: '#5A4D40',
            '&.Mui-checked': {
              color: '#5A4D40'
            }
          }
        }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => handleItemSelect(row.original),
          sx: {
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: alpha('#D5AA9F', 0.2)
            },
            '&.Mui-selected, &.Mui-selected:hover': {
              backgroundColor: alpha('#D5AA9F', 0.3),
              borderLeft: '3px solid #D5AA9F'
            }
          }
        })}
        initialState={{
          pagination: { pageSize: 100, pageIndex: 0 },
          density: 'compact',
          columnPinning: {
            left: ['DIECUT_ID', 'DIECUT_SN']
          }
        }}
        muiPaginationProps={{
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
              },
              '& .tabler-chevron-down': {}
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
        rowsPerPageOptions={[10, 50, 100, 500, 1000]}
        pageSizeOptions={[10, 50, 100, 500, 1000]}
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
