'use client'

import { Box, Typography, Chip, Paper, Button, CircularProgress } from '@mui/material'

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
      <Typography sx={{ mb: 3 }} variant='h6' gutterBottom>
        {isEditing ? 'Edit Request' : selectedItem ? 'Request Details' : 'Details'}
      </Typography>

      {selectedItem ? (
        <>
          {!isEditing && (
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle2'>ID</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.DIECUT_ID}
              </Typography>

              <Typography variant='subtitle2'>DIECUT_SN</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.DIECUT_SN}
              </Typography>

              <Typography variant='subtitle2'>Status</Typography>
              <Chip
                label={selectedItem.STATUS}
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

              <Typography variant='subtitle2'>Type</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.DIECUT_TYPE}
              </Typography>

              <Typography variant='subtitle2'>TL Status</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.TL_STATUS}
              </Typography>

              <Typography variant='subtitle2'>Last Modified</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.LAST_MODIFY ? new Date(selectedItem.LAST_MODIFY).toLocaleDateString() : 'N/A'}
              </Typography>

              <Typography variant='subtitle2'>Due Date</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.DUE_DATE ? new Date(selectedItem.DUE_DATE).toLocaleDateString() : 'N/A'}
              </Typography>

              <Typography variant='subtitle2'>Priority</Typography>
              <Chip
                label={selectedItem.PRIORITY || 'Not Set'}
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

              <Typography variant='subtitle2'>Ages</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.AGES}
              </Typography>

              <Typography variant='subtitle2'>Used</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.USED}
              </Typography>

              <Typography variant='subtitle2'>Remain</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.REMAIN}
              </Typography>

              <Typography variant='subtitle2'>Near Expiration</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.DIECUT_NEAR_EXP ? 'Yes' : 'No'}
              </Typography>

              <Typography variant='subtitle2'>Modify Type</Typography>
              <Typography variant='body2' gutterBottom>
                {selectedItem.MODIFY_TYPE}
              </Typography>
            </Box>
          )}

          {isEditing ? (
            <>
              <Typography variant='subtitle2'>Request ID: {selectedItem.DIECUT_ID}</Typography>
              <Typography variant='subtitle1' sx={{ mt: 1, mb: 1 }}>
                {selectedItem.DIECUT_SN}
              </Typography>

              <Typography variant='subtitle2'>Status</Typography>
              <Box sx={{ mb: 2 }}>
                {(['Pending', 'Pass', 'Rejected'] as const).map(status => (
                  <Chip
                    key={status}
                    label={status}
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
              </Box>

              <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant='outlined' color='secondary' onClick={handleCancel} disabled={loading}>
                  Cancel
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
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </>
          ) : (
            <>
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
                {isManager ? 'Edit Request' : 'Edit (Manager Only)'}
              </Button>

              {!isManager && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mt: 1, textAlign: 'center' }}
                >
                  You need manager permissions to edit requests
                </Typography>
              )}
            </>
          )}
        </>
      ) : (
        <Typography variant='body2' color='text.secondary'>
          Select a request to view details
        </Typography>
      )}
    </Paper>
  )
}

export default DetailPanel
