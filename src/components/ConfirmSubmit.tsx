import type { Dispatch, SetStateAction } from 'react';

import { Dialog, DialogTitle, DialogContent, DialogContentText, Typography, Button, DialogActions, CircularProgress } from '@mui/material'

import DialogCloseButton from './dialogs/DialogCloseButton'

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleApproval: () => Promise<void>;
  loadingSubmit: boolean;
  title: string;
  disabled: boolean;
  message: string;
}

const ConfirmSubmit = ({ open, setOpen, handleApproval, loadingSubmit, title, disabled, message, }: Props) => {
  const toggleDialog = () => setOpen(prev => !prev)

  // const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        className='w-full'
        disabled={disabled}
        onClick={toggleDialog}
        color={"success"}
        variant='contained'
      >
        {title}
      </Button>
      <Dialog open={open} onClose={toggleDialog} maxWidth="md" fullWidth PaperProps={{ sx: { overflow: 'visible' } }}>
        <DialogTitle >
          <Typography variant='h5'>
            แจ้งเตือน
          </Typography>
          <DialogCloseButton onClick={toggleDialog}><i className='tabler-x' /></DialogCloseButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {message}
          </DialogContentText>
        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          <Button
            color='secondary'
            variant='tonal'
            onClick={toggleDialog}
          >
            ไม่
          </Button>
          <Button
            color='success'
            variant='contained'
            onClick={handleApproval}
            disabled={loadingSubmit}
          >
            {!loadingSubmit ? (
              <>
                ใช่
              </>
            ) : (
              <CircularProgress size={24} color="inherit" />
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmSubmit
