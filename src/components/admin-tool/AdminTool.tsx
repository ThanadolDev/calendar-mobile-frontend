'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Fab,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography
} from '@mui/material'

import { getUserInfo } from '@/utils/userInfo'
import DialogCloseButton from '../dialogs/DialogCloseButton'
import { getAppTools } from '@/services/apiService'
import type { AppTool } from '@/models/apptool'

const AdminTool = () => {
  const [loading, setLoading] = useState(true)
  const userInfo = getUserInfo()
  const router = useRouter()
  const [data, setData] = useState<AppTool[]>([])

  const fetchData = async () => {
    setLoading(true)

    if (!userInfo?.id && !userInfo?.ORG_ID) {
      return
    }

    try {
      const res = await getAppTools()

      console.log('res=', res)
      setData(res)
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className='flex flex-col text-center justify-center items-center h-screen'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 h-screen'>
      <Paper className='p-2 shadow flex flex-col gap-2'>
        <Button variant='tonal' color='primary' className='w-full' onClick={() => router.push('/more')}>
          ย้อนกลับ
        </Button>
        <AddAppToolDetail />
      </Paper>

      <div className='p-2   flex flex-row gap-2'>
        <Typography variant='h5' className='flex-grow'>
          รายการ App Tool
        </Typography>
      </div>

      {/* <Paper className='p-2 shadow flex-grow flex flex-col'>{data.length}</Paper> */}

      <ToolList data={data} />
    </div>
  )
}

export default AdminTool

const AddAppToolDetail = () => {
  const [open, setOpen] = useState(false)
  const toggleDialog = () => setOpen(prev => !prev)

  return (
    <>
      <Fab
        aria-label='add'
        size='large'
        color='primary'
        style={{
          position: 'fixed', // ใช้ fixed เพื่อให้ปุ่มลอย
          bottom: '60px', // ระยะห่างจากด้านล่าง
          right: '10px', // ระยะห่างจากด้านขวา
          zIndex: 1000 // เลเยอร์ให้อยู่บนสุด
        }}
        onClick={toggleDialog}
      >
        <i className='tabler-plus' />
      </Fab>

      <Dialog open={open} onClose={toggleDialog} maxWidth='md' fullWidth PaperProps={{ sx: { overflow: 'visible' } }}>
        <DialogTitle>
          <Typography variant='h5'>เพิ่ม App Tool</Typography>
          <DialogCloseButton onClick={toggleDialog}>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>form</DialogContentText>
        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          <Button color='secondary' variant='tonal' onClick={toggleDialog}>
            ปิด
          </Button>
          <Button
            color='success'
            variant='contained'

            // onClick={handleApproval}
            // disabled={loadingSubmit}
          >
            {/* {!loadingSubmit ? (
              <>
                ใช่
              </>
            ) : (
              <CircularProgress size={24} color="inherit" />
            )} */}
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

interface ToolProps {
  data: AppTool[]
}

const ToolList = ({ data }: ToolProps) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Paper>
          <List dense={false}>
            {data.map(item => (
              <div key={item.TOOL_ID}>
                <ListItem>
                  <img
                    src={item.ICON_SRC_IMAGE}
                    alt={item.TOOL_NAME}
                    style={{ width: 40, height: 40, marginRight: 16 }}
                  />
                  <ListItemText primary={item.TOOL_NAME} secondary={item.REMARK || ''} />
                  <IconButton

                  // onClick={() => onEdit(item)}
                  >
                    {/* <EditIcon /> */} 2
                  </IconButton>
                  <IconButton

                  //  onClick={() => onDelete(item.TOOL_ID)}
                  >
                    {/* <DeleteIcon />  */} 3
                  </IconButton>
                </ListItem>
                <Divider />
              </div>
            ))}
          </List>
        </Paper>
      </Grid>
    </Box>
  )
}
