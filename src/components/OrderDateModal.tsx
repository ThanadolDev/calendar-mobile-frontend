'use client'

import { useState, useEffect } from 'react'

import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

import apiClient from '../services/apiClient'
import type { IDiecut } from '../types/types'

interface OrderDateModalProps {
  open: boolean
  onClose: () => void
  onSelect: (orderData: any) => void
  selectedDiecutForOrderDate: IDiecut | null
}

const OrderDateModal = ({ open, onClose, onSelect, selectedDiecutForOrderDate }: OrderDateModalProps) => {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allOrderData, setAllOrderData] = useState<any[]>([]) // Store all data
  const [orderData, setOrderData] = useState<any[]>([]) // Store filtered data
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

  // Fetch data when modal opens
  useEffect(() => {
    if (open) {
      fetchOrderData()
      console.log(selectedDiecutForOrderDate)
    } else {
      // Clear selection when modal closes
      setSelectedRow(null)
      setSearchQuery('')
    }
  }, [open])

  // Fetch order data from API - only called once when modal opens
  const fetchOrderData = async () => {
    setLoading(true)

    try {
      console.log(selectedDiecutForOrderDate)

      const result: any = await apiClient.post('/api/diecuts/getjoborderlist', {
        diecutId: selectedDiecutForOrderDate?.DIECUT_ID,
        DIECUT_TYPE: selectedDiecutForOrderDate?.DIECUT_TYPE
      })

      if (result.success) {
        console.log(result)
        const data = result.data.jobList || []

        setAllOrderData(data) // Store all data
        setOrderData(data) // Initial display all data
      } else {
        console.error('Failed to fetch job orders:', result.message)
        setAllOrderData([])
        setOrderData([])
      }
    } catch (error) {
      console.error('Error fetching job orders:', error)
      setAllOrderData([])
      setOrderData([])
    } finally {
      setLoading(false)
    }
  }

  // Handle search - now filters local data instead of API call
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      // If search query is empty, show all data
      setOrderData(allOrderData)

      return
    }

    // Filter the data based on search query
    const filteredData = allOrderData.filter(row => {
      const query = searchQuery.toLowerCase()

      // Search in JOB_ID, PROD_ID, and JOB_DESC fields
      return (
        (row.JOB_ID && row.JOB_ID.toLowerCase().includes(query)) ||
        (row.PROD_ID && row.PROD_ID.toLowerCase().includes(query)) ||
        (row.JOB_DESC && row.JOB_DESC.toLowerCase().includes(query))
      )
    })

    setOrderData(filteredData)
  }

  // Handle search input keypress (search on Enter)
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  // Handle row selection
  const handleRowClick = (row: any) => {
    setSelectedRow(row)
  }

  // Handle confirmation and pass selected data back
  const handleConfirm = () => {
    if (selectedRow) {
      // Calculate DUE_DATE (ORDER_DATE - 3 days)
      const orderDate = new Date(selectedRow.ORDER_DATE)
      const dueDate = new Date(orderDate)

      dueDate.setDate(dueDate.getDate() - 3)

      // Add the calculated due date to the selected data
      const enrichedData = {
        ...selectedRow
      }

      onSelect(enrichedData)
      onClose()
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'

    try {
      const date = new Date(dateString)

      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
    } catch (error) {
      return '-'
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>งานสั่งทำ </DialogTitle>
      <DialogContent>
        {/* Search field */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder='ค้นหา (JOB, รหัสสินค้า, ชื่องาน)'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            size='small'
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant='contained'
            onClick={handleSearch}
            sx={{
              backgroundColor: '#98867B',
              '&:hover': {
                backgroundColor: '#5A4D40'
              }
            }}
          >
            ค้นหา
          </Button>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} sx={{ height: '400px' }}>
          <Table stickyHeader size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>
                  วันที่ต้องการใช้
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>
                  วันที่สั่งทำ
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>JOB</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>
                  รหัสสินค้า
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', minWidth: '300px' }}>
                  ชื่องาน
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC', whiteSpace: 'nowrap' }}>
                  ประเภท
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align='center' sx={{ height: '300px' }}>
                    <CircularProgress size={40} sx={{ color: '#98867B' }} />
                  </TableCell>
                </TableRow>
              ) : orderData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center' sx={{ height: '300px' }}>
                    <Typography variant='body1'>ไม่พบข้อมูล</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orderData.map((row, index) => (
                  <TableRow
                    key={index}
                    onClick={() => handleRowClick(row)}
                    selected={selectedRow && selectedRow.JOB_ID === row.JOB_ID}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(152, 134, 123, 0.15)',
                        '&:hover': {
                          backgroundColor: 'rgba(152, 134, 123, 0.25)'
                        }
                      }
                    }}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.DATE_USING)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.ORDER_DATE)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.JOB_ID || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {row.PROD_ID
                        ? row.REVISION
                          ? `${row.PROD_ID.replace(/^0+/, '')}-${row.REVISION}`
                          : row.PROD_ID.replace(/^0+/, '')
                        : '-'}
                    </TableCell>
                    <TableCell sx={{ minWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {row.JOB_DESC || '-'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {row.SRC == 'LSD' ? 'L.S.D ปั๊ม' : 'Job Scheduling'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#98867B' }}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedRow}
          variant='contained'
          sx={{
            backgroundColor: '#98867B',
            '&:hover': {
              backgroundColor: '#5A4D40'
            },
            '&.Mui-disabled': {
              backgroundColor: 'action.disabledBackground',
              opacity: 0.7
            }
          }}
        >
          ตกลง
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default OrderDateModal
