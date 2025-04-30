import { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  InputAdornment,
  Typography,
  Box,
  TableSortLabel
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

import apiClient from '../services/apiClient'

interface JobOrderData {
  JOB_ID: string
  JOB_DESC: string
  PROD_ID: string
  REVISION: string
  PROD_DESC: string
}

interface JobOrderModalProps {
  open: boolean
  onClose: () => void
  onSelect: (jobOrder: JobOrderData) => void
}

type Order = 'asc' | 'desc'
type OrderBy = keyof JobOrderData

const JobOrderModal = ({ open, onClose, onSelect }: JobOrderModalProps) => {
  const [loading, setLoading] = useState(false)
  const [jobOrders, setJobOrders] = useState<JobOrderData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRow, setSelectedRow] = useState<JobOrderData | null>(null)

  // Sorting state
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderBy>('JOB_ID')

  // Pagination state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    if (!open) {
      // Reset when modal closes
      setSearchQuery('')
      setSelectedRow(null)
      setPage(0)
      setJobOrders([])
    }
  }, [open])

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      return
    }

    setLoading(true)

    try {
      // Pass search query to API
      const result = await apiClient.post('/api/diecuts/openjobs', {
        searchQuery: searchQuery.trim()
      })

      if ((result as { success: boolean }).success) {
        setJobOrders((result as { data: { diecutType: any[] } }).data.diecutType || [])
      } else {
        console.error('Failed to fetch job orders:')
        setJobOrders([])
      }
    } catch (error) {
      console.error('Error fetching job orders:', error)
      setJobOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (row: JobOrderData) => {
    setSelectedRow(row)
  }

  const handleSelect = () => {
    if (selectedRow) {
      onSelect(selectedRow)
      onClose()
    }
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc'

    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const createSortHandler = (property: OrderBy) => () => {
    handleRequestSort(property)
  }

  // Sort function
  function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number])

    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0])

      if (order !== 0) return order

      return a[1] - b[1]
    })

    return stabilizedThis.map(el => el[0])
  }

  function getComparator(order: Order, orderBy: OrderBy): (a: JobOrderData, b: JobOrderData) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy)
  }

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1
    }

    if (b[orderBy] > a[orderBy]) {
      return 1
    }

    return 0
  }

  // Apply pagination and sorting
  const sortedJobOrders = stableSort(jobOrders, getComparator(order, orderBy))
  const paginatedJobOrders = sortedJobOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid #E0E0E0' }}>เลือก Job Order</DialogTitle>

      <Box sx={{ p: 2, borderBottom: '1px solid #E0E0E0', display: 'flex', gap: 1 }}>
        <TextField
          autoFocus
          placeholder='ค้นหา Job ID, รายละเอียด, รหัสสินค้า...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          size='small'
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            )
          }}
        />
        <Button
          onClick={handleSearch}
          variant='contained'
          sx={{
            backgroundColor: '#98867B',
            '&:hover': {
              backgroundColor: '#5A4D40'
            },
            minWidth: '100px'
          }}
        >
          ค้นหา
        </Button>
      </Box>

      <DialogContent
        sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexGrow: 1, marginBottom: '4px' }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: '#98867B' }} />
          </Box>
        ) : jobOrders.length === 0 ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', marginTop: '16px' }}
          >
            <Typography variant='body1' color='text.secondary'>
              {searchQuery.trim() === '' ? 'กรุณาค้นหา Job Order' : 'ไม่พบข้อมูล Job Order'}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 'none', height: '100%' }}>
            <Table stickyHeader size='small'>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    <TableSortLabel
                      active={orderBy === 'JOB_ID'}
                      direction={orderBy === 'JOB_ID' ? order : 'asc'}
                      onClick={createSortHandler('JOB_ID')}
                    >
                      Job ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    <TableSortLabel
                      active={orderBy === 'JOB_DESC'}
                      direction={orderBy === 'JOB_DESC' ? order : 'asc'}
                      onClick={createSortHandler('JOB_DESC')}
                    >
                      คำอธิบาย
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    <TableSortLabel
                      active={orderBy === 'PROD_ID'}
                      direction={orderBy === 'PROD_ID' ? order : 'asc'}
                      onClick={createSortHandler('PROD_ID')}
                    >
                      รหัสสินค้า
                    </TableSortLabel>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    <TableSortLabel
                      active={orderBy === 'PROD_DESC'}
                      direction={orderBy === 'PROD_DESC' ? order : 'asc'}
                      onClick={createSortHandler('PROD_DESC')}
                    >
                      รายละเอียดสินค้า
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedJobOrders.map(row => (
                  <TableRow
                    key={`${row.JOB_ID}-${row.PROD_ID}-${row.REVISION}`}
                    onClick={() => handleRowClick(row)}
                    selected={selectedRow?.JOB_ID === row.JOB_ID && selectedRow?.PROD_ID === row.PROD_ID}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(152, 134, 123, 0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(152, 134, 123, 0.3)'
                        }
                      }
                    }}
                  >
                    <TableCell>{row.JOB_ID}</TableCell>
                    <TableCell>{row.JOB_DESC || '-'}</TableCell>
                    <TableCell>
                      {row.PROD_ID ? row.PROD_ID.replace(/^0+/, '') + (row.REVISION ? '-' + row.REVISION : '') : '-'}
                    </TableCell>
                    <TableCell>{row.PROD_DESC || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component='div'
          count={jobOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage='แถวต่อหน้า:'
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
        />
      </DialogContent>

      <div className='mt-4'>
        <DialogActions sx={{ borderTop: '1px solid #E0E0E0', p: 2, marginTop: 4, marginLeft: 'auto' }}>
          <Button
            onClick={onClose}
            sx={{
              borderColor: '#98867B',
              color: '#98867B'
            }}
            variant='outlined'
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedRow}
            variant='contained'
            sx={{
              backgroundColor: '#98867B',
              '&:hover': {
                backgroundColor: '#5A4D40'
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            ตกลง
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  )
}

export default JobOrderModal
