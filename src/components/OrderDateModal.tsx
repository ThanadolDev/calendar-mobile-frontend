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
  const [orderData, setOrderData] = useState<any[]>([])
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

  // Fetch data when modal opens
  useEffect(() => {
    if (open) {
      fetchOrderData()
    } else {
      // Clear selection when modal closes
      setSelectedRow(null)
    }
  }, [open])

  // Fetch order data from API
  const fetchOrderData = async () => {
    setLoading(true)

    try {
      const result: any = await apiClient.post('/api/diecuts/getjoborderlist', {
        diecutId: selectedDiecutForOrderDate?.DIECUT_ID
      })

      if (result.success) {
        console.log(result)
        setOrderData(result.data.jobList || [])
      } else {
        console.error('Failed to fetch job orders:', result.message)
        setOrderData([])
      }
    } catch (error) {
      console.error('Error fetching job orders:', error)
      setOrderData([])
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = () => {
    fetchOrderData()
  }

  // Handle search input keypress (search on Enter)
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      fetchOrderData()
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
        ...selectedRow,
        DUE_DATE: dueDate
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
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>วันที่สั่งทำ</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>JOB</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>รหัสสินค้า</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>ชื่องาน</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#E6E1DC' }}>ประเภท</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align='center' sx={{ height: '300px' }}>
                    <CircularProgress size={40} sx={{ color: '#98867B' }} />
                  </TableCell>
                </TableRow>
              ) : orderData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align='center' sx={{ height: '300px' }}>
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
                    <TableCell>{formatDate(row.ORDER_DATE)}</TableCell>

                    <TableCell>{row.JOB_ID || '-'}</TableCell>
                    <TableCell>
                      {row.PROD_ID
                        ? row.REVISION
                          ? `${row.PROD_ID.replace(/^0+/, '')}-${row.REVISION}`
                          : row.PROD_ID.replace(/^0+/, '')
                        : '-'}
                    </TableCell>
                    <TableCell>{row.JOB_DESC || '-'}</TableCell>
                    <TableCell>{row.SRC == 'LSD' ? 'L.S.D ปั๊ม' : 'Job Scheduling'}</TableCell>
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
