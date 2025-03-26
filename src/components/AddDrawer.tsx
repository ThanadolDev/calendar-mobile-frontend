
// MUI Imports
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'

import Typography from '@mui/material/Typography'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'


import type { HeadPr, PRDetails } from '@/models/PurchaseRequest';
import { formatDateInThai, formatToTwoDecimals, formatToTwoDecimalsNoComma } from '@/models/PurchaseRequest'

type Props = {
  open: boolean;
  handleClose: () => void;
  pr: HeadPr;
  item: PRDetails;
}

const AddDrawer = (props: Props) => {
  // Props
  const { open, handleClose, pr, item } = props

  const handleReset = () => {
    handleClose()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}

      sx={{ '& .MuiDrawer-paper': { width: { xs: "90%", sm: "90%", } } }}
    >
      <div className='flex items-center justify-between pli-6 plb-5'>
        <Typography variant='h5'>รายละเอียด</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className="p-6">
          {/* Material Name and Code */}
          <Typography variant="h6" className="font-bold mb-2">
            รหัส-ชื่อวัตถุดิบ:
          </Typography>
          <Typography variant="body1" className="mb-4">
            {item.MAT_ID} {item.MAT_NAME}
          </Typography>

          {/* Quantity */}
          <Typography variant="h6" className="font-bold mb-2">
            ปริมาณ:
          </Typography>
          <Typography variant="body1" className="mb-4">
            {formatToTwoDecimalsNoComma(parseInt(item.REQ_NUM))} {item.UNIT_PO}
          </Typography>

          {/* Unit Price */}
          <Typography variant="h6" className="font-bold mb-2">
            ราคาต่อหน่วย:
          </Typography>
          <Typography variant="body1" className="text-blue-400 font-bold mb-4">
            {formatToTwoDecimals(item.UNIT_PRICE)} {pr.CURR_ID}
          </Typography>

          {/* Discount */}
          <Typography variant="h6" className="font-bold mb-2">
            ส่วนลด(%):
          </Typography>
          <Typography variant="body1" className="mb-4">
            {item.DISC}
          </Typography>

          {/* Total Price */}
          <Typography variant="h6" className="font-bold mb-2">
            ราคาสุทธิ (บาท):
          </Typography>
          <Typography variant="body1" className="text-blue-500 font-bold mb-4">
            {formatToTwoDecimals(item.AMOUNT)} {pr.CURR_ID}
          </Typography>

          {/* Preparation Date */}
          <Typography variant="h6" className="font-bold mb-2">
            กำหนดเตรียมสินค้า:
          </Typography>
          <Typography variant="body1" className="mb-4">
            {formatDateInThai(item.FIRST_DELI_DATE)}
          </Typography>

          {/* Shipping Date */}
          <Typography variant="h6" className="font-bold mb-2 opacity-50">
            กำหนดส่ง:
          </Typography>
          <Typography variant="body1" className="opacity-50 mb-4">

            {formatDateInThai(item.FIRST_DELI_DATE)}
          </Typography>

          {/* Purchase in Progress */}
          <Typography variant="h6" className="font-bold mb-2 opacity-50">
            ระหว่างขอซื้อ:
          </Typography>
          <Typography variant="body1" className="opacity-50 mb-4">
            {formatToTwoDecimals(item.SUM_BETWEEN_PR)}

          </Typography>

          {/* Purchasing */}
          <Typography variant="h6" className="font-bold mb-2 opacity-50">
            ระหว่างจัดซื้อ:
          </Typography>
          <Typography variant="body1" className="opacity-50 mb-4">
            {formatToTwoDecimals(parseInt(item.BT_PO))}
          </Typography>

          {/* Notes */}
          <Typography variant="h6" className="font-bold mb-2">
            หมายเหตุ:
          </Typography>
          <Typography variant="body1" className="mb-4">
            {item.PR_MAT_CMT}
          </Typography>

          {/* Department */}
          <Typography variant="h6" className="font-bold mb-2 opacity-50">
            แผนก:
          </Typography>
          <Typography variant="body1" className="opacity-50">
            {item.PR_UNIT}
          </Typography>

          {/* เครื่องจักร */}
          <Typography variant="h6" className="font-bold my-2">
            เครื่องจักร:
          </Typography>
          <Typography variant="body1" className="mb-4">
            {item.PR_MACH}
          </Typography>

        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default AddDrawer
