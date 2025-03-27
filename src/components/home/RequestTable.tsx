'use client'

import { useMemo, useState } from 'react'

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
  FilterAlt as FilterIcon
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

  // Filter data based on search query and filters
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply search query filter
    if (searchQuery) {
      // const lowerCaseQuery = searchQuery.toLowerCase()
      // filtered = filtered.filter(
      //   item =>
      //     item.title.toLowerCase().includes(lowerCaseQuery) ||
      //     item.id.toLowerCase().includes(lowerCaseQuery) ||
      //     item.department?.toLowerCase().includes(lowerCaseQuery) ||
      //     item.worktype?.toLowerCase().includes(lowerCaseQuery)
      // )
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(item => item.status === selectedStatus)
    }

    // Apply department/type filter
    if (selectedType) {
      filtered = filtered.filter(item => item.worktype === selectedType)
    }

    return filtered
  }, [data, searchQuery, selectedStatus, selectedType])

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
        header: 'PRIORITY'
      },
      {
        accessorKey: 'STATUS',
        header: 'STATUS'
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
        header: 'LAST_MODIFY'
      },
      {
        accessorKey: 'DUE_DATE',
        header: 'DUE_DATE'
      },
      {
        accessorKey: 'MODIFY_TYPE',
        header: 'MODIFY_TYPE'
      }
    ],
    [isManager, handleItemSelect, handleEditClick]
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
          placeholder='Search...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size='small'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            )
          }}
          sx={{
            width: '200px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#f5f5f5'
            }
          }}
        />

        <FormControl size='small' sx={{ minWidth: 150 }}>
          <InputLabel id='worktype-filter-label'>ประเภทงาน</InputLabel>
          <Select
            labelId='worktype-filter-label'
            id='worktype-filter'
            value={selectedType}
            label='ประเภทงาน'
            onChange={(e: SelectChangeEvent) => setSelectedType(e.target.value)}
          >
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='เปลี่ยนใบมีด'>เปลี่ยนใบมีด</MenuItem>
            <MenuItem value='ซ่อมบำรุง'>ซ่อมบำรุง</MenuItem>
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
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='Pass'>Pass</MenuItem>
            <MenuItem value='Pending'>Pending</MenuItem>
            <MenuItem value='Rejected'>Rejected</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant='contained'
          startIcon={<FilterIcon />}
          size='small'
          sx={{
            backgroundColor: '#98867B',
            '&:hover': {
              backgroundColor: '#5A4D40'
            }
          }}
          onClick={() => {
            // Apply filters if needed (currently reactive)
          }}
        >
          Apply Filters
        </Button>

        <Box sx={{ marginLeft: 'auto' }}>
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
        enablePinning={true}
        enableColumnPinning={true}
        enableColumnActions={true}
        enableTopToolbar={true}
        state={{
          isLoading: loading
        }}
        renderTopToolbar={renderTopToolbar}
        muiTableContainerProps={{
          sx: {
            maxHeight: '65vh',
            fontFamily: "'Noto Serif Thai', serif",
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
            borderColor: alpha('#D0C6BD', 0.6),
            fontFamily: "'Noto Serif Thai', serif"
          }
        }}
        muiTableHeadProps={{
          sx: {
            '& .MuiTableCell-head': {
              backgroundColor: '#E6E1DC',
              color: '#000000',
              fontWeight: 'bold',
              fontFamily: "'Noto Serif Thai', serif"
            }
          }
        }}
        muiTablePaperProps={{
          sx: {
            border: '1px solid',
            borderColor: alpha('#D0C6BD', 0.5),
            boxShadow: '0px 2px 4px rgba(208, 198, 189, 0.2)',
            fontFamily: "'Noto Serif Thai', serif"
          }
        }}
        muiTableBodyCellProps={{
          sx: {
            color: '#000000',
            fontFamily: "'Noto Serif Thai', serif"
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
            fontFamily: "'Noto Serif Thai', serif",
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
          pagination: { pageSize: 10, pageIndex: 0 },
          density: 'compact',
          columnPinning: {
            left: ['mrt-row-select', 'id', 'title']
          }
        }}
      />
    </>
  )
}

export default RequestTable
