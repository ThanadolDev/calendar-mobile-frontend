'use client'

import { useState } from 'react'

import { Box, Typography, Chip, Paper, Button, CircularProgress, TextField, Grid } from '@mui/material'

import type { IDiecut } from '../../types/types'

interface DetailPanelProps {
  selectedItem: IDiecut | null
  isEditing: boolean
  isManager: boolean
  loading: boolean
  handleEdit: () => void
  handleSave: () => void
  handleCancel: () => void
  handleStatusChange: (status: 'Pending' | 'Pass' | 'Rejected') => void
}

const DetailPanel = ({
  selectedItem,
  isEditing,
  isManager,
  loading,
  handleEdit,
  handleSave,
  handleCancel,
  handleStatusChange
}: DetailPanelProps) => {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [toolingAge, setToolingAge] = useState('')
  const [productionIssue, setProductionIssue] = useState('')
  const [fixDetails, setFixDetails] = useState('')
  const [bladeSize, setBladeSize] = useState('')
  const [dualBladeReason, setDualBladeReason] = useState('')
  const [dualBladeDetails, setDualBladeDetails] = useState('')

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        gridRow: 'span 4',
        overflow: 'auto',
        backgroundColor: 'background.paper',
        transition: 'all 0.3s ease'
      }}
      className='shadow'
    >
      <Typography variant='h6' gutterBottom>
        {isEditing ? 'แก้ไขคำขอเปลี่ยนใบมีด' : selectedItem ? 'รายละเอียดคำขอ' : 'รายละเอียด'}
      </Typography>

      {selectedItem ? (
        <>
          {!isEditing && (
            <>
              {/* Top 30% - Request Details */}
              <Box
                sx={{
                  mb: 2,
                  pb: 2,
                  height: '30%',
                  borderBottom: '1px solid #E0E0E0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>รหัสคำขอ</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.DIECUT_ID}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>หมายเลขใบมีด</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.DIECUT_SN}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>สถานะ</Typography>
                    <Chip
                      label={selectedItem.STATUS || 'รอดำเนินการ'}
                      color={
                        selectedItem.STATUS === 'Pass'
                          ? 'success'
                          : selectedItem.STATUS === 'Pending'
                            ? 'warning'
                            : selectedItem.STATUS === 'Rejected'
                              ? 'error'
                              : 'default'
                      }
                      size='small'
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>ประเภท</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.DIECUT_TYPE || 'ไม่ระบุ'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>อายุการใช้งาน</Typography>
                    <Typography variant='body2' gutterBottom>
                      {selectedItem.AGES || 'ไม่ระบุ'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='subtitle2'>ความเร่งด่วน</Typography>
                    <Chip
                      label={selectedItem.PRIORITY || 'ไม่ระบุ'}
                      color={
                        selectedItem.PRIORITY === 'High'
                          ? 'error'
                          : selectedItem.PRIORITY === 'Medium'
                            ? 'primary'
                            : 'default'
                      }
                      size='small'
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Middle 60% - Blade Card List */}
              <Box sx={{ height: '55%', overflow: 'auto', mb: 2 }}>
                <Typography variant='subtitle1' gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  รายการใบมีด
                </Typography>

                {/* Mock blade list - replace with actual data */}
                {[1, 2, 3].map(num => (
                  <Paper
                    key={num}
                    variant='outlined'
                    sx={{
                      p: 2,
                      mb: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                        ใบมีด #{num}
                      </Typography>
                      <Button
                        size='small'
                        variant='outlined'
                        sx={{
                          borderColor: '#98867B',
                          color: '#98867B',
                          '&:hover': {
                            borderColor: '#5A4D40',
                            backgroundColor: 'rgba(152, 134, 123, 0.04)'
                          }
                        }}
                        onClick={handleEdit} // You'd want to pass the specific blade ID here
                      >
                        แก้ไข
                      </Button>
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant='caption' color='text.secondary'>
                          ประเภทใบมีด
                        </Typography>
                        {/* <Typography variant='body2'>
                          {num === 1 ? 'ใบมีดเดี่ยว' : num === 2 ? 'ใบมีดคู่' : 'ใบมีดพิเศษ'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='caption' color='text.secondary'>
                          ขนาดใบมีด
                        </Typography>
                        <Typography variant='body2'>
                          {num === 1 ? '100x200 mm' : num === 2 ? '150x300 mm' : '200x400 mm'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant='caption' color='text.secondary'>
                          รายละเอียด
                        </Typography>
                        <Typography variant='body2'>
                          {num === 1
                            ? 'ใบมีดสำหรับตัดกระดาษแข็ง ต้องการเปลี่ยนเนื่องจากคมตัดทื่อ'
                            : num === 2
                              ? 'ใบมีดคู่สำหรับงานพิเศษ ต้องการทำความสะอาดและลับคมใหม่'
                              : 'ใบมีดพิเศษสำหรับงานลายฉลุ ต้องการซ่อมแซมส่วนที่แตกหัก'}
                        </Typography> */}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>

              {/* Bottom 10% - Edit Button */}
              <Box
                sx={{
                  pt: 2,
                  mt: 'auto',
                  borderTop: '1px solid #E0E0E0',
                  position: 'sticky',
                  bottom: 0,
                  backgroundColor: 'background.paper',
                  width: '100%'
                }}
              >
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleEdit}
                  disabled={!isManager}
                  fullWidth
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
                  {isManager ? 'แก้ไขคำขอ' : 'แก้ไข (เฉพาะผู้จัดการ)'}
                </Button>

                {!isManager && (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mt: 1, textAlign: 'center' }}
                  >
                    คุณต้องมีสิทธิ์ผู้จัดการเพื่อแก้ไขคำขอ
                  </Typography>
                )}
              </Box>
            </>
          )}

          {isEditing ? (
            <>
              <Typography variant='subtitle2'>รหัสคำขอ: {selectedItem.DIECUT_ID}</Typography>
              <Typography variant='subtitle1' sx={{ mt: 1, mb: 1 }}>
                {selectedItem.DIECUT_SN}
              </Typography>

              <Typography variant='subtitle2'>เริ่มงานวันที่</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  type='date'
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={e => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Typography variant='subtitle2'>สิ้นสุดวันที่</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  type='date'
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Typography variant='subtitle2'>อายุ tooling</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField fullWidth size='small' value={toolingAge} onChange={e => setToolingAge(e.target.value)} />
              </Box>

              <Typography variant='subtitle2'>ปัญหาจาก production</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  multiline
                  rows={2}
                  value={productionIssue}
                  onChange={e => setProductionIssue(e.target.value)}
                />
              </Box>

              <Typography variant='subtitle2'>รายละเอียดในการแก้ไข</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  multiline
                  rows={2}
                  value={fixDetails}
                  onChange={e => setFixDetails(e.target.value)}
                />
              </Box>

              <Typography variant='subtitle2'>ระยะมีด</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField fullWidth size='small' value={bladeSize} onChange={e => setBladeSize(e.target.value)} />
              </Box>

              <Typography variant='subtitle2'>สาเหตุที่ใช้มีดคู่</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  value={dualBladeReason}
                  onChange={e => setDualBladeReason(e.target.value)}
                />
              </Box>

              <Typography variant='subtitle2'>รายละเอียดในการใช้มีดคู่</Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  multiline
                  rows={2}
                  value={dualBladeDetails}
                  onChange={e => setDualBladeDetails(e.target.value)}
                />
              </Box>

              {/* <Typography variant='subtitle2'>สถานะ</Typography>
              <Box sx={{ mb: 2 }}>
                {(['Pending', 'Pass', 'Rejected'] as const).map(status => (
                  <Chip
                    key={status}
                    label={status === 'Pending' ? 'รอดำเนินการ' : status === 'Pass' ? 'อนุมัติ' : 'ปฏิเสธ'}
                    color={
                      status === 'Pass'
                        ? 'success'
                        : status === 'Pending'
                          ? 'warning'
                          : status === 'Rejected'
                            ? 'error'
                            : 'default'
                    }
                    onClick={() => {
                      if (isManager) {
                        handleStatusChange(status)
                      }
                    }}
                    disabled={!isManager}
                    variant={selectedItem.STATUS === status ? 'filled' : 'outlined'}
                    sx={{ mr: 1, mb: 1, opacity: isManager ? 1 : 0.7 }}
                  />
                ))}
              </Box> */}

              <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant='outlined' color='secondary' onClick={handleCancel} disabled={loading}>
                  ยกเลิก
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleSave}
                  disabled={loading || !isManager}
                  startIcon={loading && <CircularProgress size={20} color='inherit' />}
                  sx={{
                    backgroundColor: '#98867B',
                    '&:hover': {
                      backgroundColor: '#5A4D40'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'action.disabledBackground'
                    }
                  }}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              {/* <Button
                variant='contained'
                color='primary'
                onClick={handleEdit}
                disabled={!isManager}
                fullWidth
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
                {isManager ? 'แก้ไขคำขอ' : 'แก้ไข (เฉพาะผู้จัดการ)'}
              </Button>

              {!isManager && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mt: 1, textAlign: 'center' }}
                >
                  คุณต้องมีสิทธิ์ผู้จัดการเพื่อแก้ไขคำขอ
                </Typography>
              )} */}
            </>
          )}
        </>
      ) : (
        <Typography variant='body2' color='text.secondary'>
          เลือกคำขอเพื่อดูรายละเอียด
        </Typography>
      )}
    </Paper>
  )
}

export default DetailPanel
