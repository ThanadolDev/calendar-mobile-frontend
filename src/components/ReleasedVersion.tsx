import { useEffect, useState } from 'react'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItem,
  ListItemText,
  TextField,
  Typography
} from '@mui/material'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'

import DialogCloseButton from './dialogs/DialogCloseButton'
import { getReleasedVersions } from '@/services/apiService'
import type { Released } from '@/models/released'
import { formatDateInThai } from '@/models/PurchaseRequest'

const ReleasedVersion = () => {
  const [items, setItems] = useState<Released[]>([])

  const fetchData = async () => {
    try {
      const res: Released[] = await getReleasedVersions()

      console.log('res', res)
      setItems(res || [])
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const [open, setOpen] = useState(false)
  const toggleDialog = () => setOpen(prev => !prev)

  return (
    <>
      <ListItem
        onClick={toggleDialog}
        sx={{
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
        }}
      >
        <ListItemText primary={'Released versions'} secondary={''} />
        <KeyboardArrowRightIcon />
      </ListItem>
      <Dialog open={open} onClose={toggleDialog} maxWidth='md' fullWidth PaperProps={{ sx: { overflow: 'visible' } }}>
        <DialogTitle>
          <Typography variant='h5'>Released versions</Typography>
          <DialogCloseButton onClick={toggleDialog}>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {/* List Released versions */}
            <VersionList items={items} />
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ReleasedVersion

const VersionList = ({ items }: { items: Released[] }) => {
  // const versions = [
  //   { FILE_VERSION: "0.1.3", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  //   { FILE_VERSION: "0.1.2", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  //   { FILE_VERSION: "0.1.1", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  //   { FILE_VERSION: "0.1.0", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  //   { FILE_VERSION: "0.1.0", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  //   { FILE_VERSION: "0.1.0", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  //   { FILE_VERSION: "0.1.0", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  //   { FILE_VERSION: "0.1.0", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  //   { FILE_VERSION: "0.1.0", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  //   { FILE_VERSION: "0.1.0", RECEIVE_DATE: "2025-01-17T17:00:00.000Z", EDIT_DETAIL: "แก้ไข invoiceให้แสดงเลขที่บิลล่าสุดในช่องเลขที่บิล" },
  // ];

  return (
    <>
      {items.map(({ RECEIVE_DATE, FILE_VERSION, EDIT_DETAIL }, index) => (
        <Accordion key={index} defaultExpanded={true}>
          <AccordionSummary id={`panel-header-${index}`} aria-controls={`panel-content-${index}`}>
            <div className='flex flex-row justify-between w-full'>
              <Typography>{FILE_VERSION}</Typography>
              <Typography>{formatDateInThai(RECEIVE_DATE)}</Typography>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            {/* <Typography>{EDIT_DETAIL}</Typography> */}
            <TextField
              fullWidth
              multiline
              maxRows={10}
              value={EDIT_DETAIL}
              label=''
              id='textarea-outlined-controlled'
              InputProps={{
                readOnly: true
              }}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  )
}
