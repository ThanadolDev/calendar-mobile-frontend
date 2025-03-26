import { useState } from "react";

import { Box, Button, Divider, Paper, Typography } from "@mui/material";

import AddDrawer from "./AddDrawer";
import type { HeadPr, PRDetails } from "@/models/PurchaseRequest";
import { formatToTwoDecimals, formatToTwoDecimalsNoComma } from "@/models/PurchaseRequest";

interface Props {
  pr: HeadPr;
  item: PRDetails;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PurchaseItem = ({ item, pr }: Props) => {
  const [open, setOpen] = useState(false)

  return (

    // <Paper className="p-6 shadow-md rounded-md  min-w-[300px] max-w-[300px]">
    <Paper className="p-6 shadow-md rounded-md  w-full">
      {/* Header Section */}
      <Typography variant="subtitle1" className="font-bold mb-2 text-sm">
        {item.MAT_NAME}
      </Typography>

      {/* Notes */}
      <Box display="inline-flex" alignItems="start" mb={1}>
        <Typography variant="body1" mb={2}>
          <span className="font-bold text-sm">หมายเหตุ:</span>{" "}
          <span className="text-sm">   {item.PR_MAT_CMT}</span>
        </Typography>
      </Box>

      <Box className="mb-1">
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body1">
            <span className="font-bold text-blue-400">{formatToTwoDecimals(item.UNIT_PRICE)} {pr.CURR_ID}</span>

            <span className="font-normal">{`${" x "}${formatToTwoDecimalsNoComma(parseInt(item.REQ_NUM))} ${item.UNIT_PO}`} </span>
          </Typography>
        </Box>
      </Box>

      <Divider />



      {/* Drawer Component */}
      <AddDrawer open={open} handleClose={() => setOpen(!open)}
        item={item}
        pr={pr}
      />

      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="space-between"
        alignItems="center" // Align items in the center for single-row layout
        mt={2}
        mb={0}
        sx={{ gap: 1 }} // Add spacing between elements
      >


        {/* Total Price aligned right */}
        <Typography
          variant="h5"
          className="text-blue-500 font-bold"
          sx={{
            flexGrow: 1, // Allow the typography to take remaining space
            textAlign: 'right',
            minWidth: 0, // Prevent overflow issues
            wordBreak: 'break-word', // Handle long text wrapping
          }}
        >
          {formatToTwoDecimals(item.AMOUNT)} {pr.CURR_ID}

        </Typography>

      </Box>
      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="end" // จัดกึ่งกลางในแนวนอน
        alignItems="center" // จัดกึ่งกลางในแนวตั้ง
        mt={2}
        mb={0}
        sx={{ gap: 1 }} // เพิ่มช่องว่างระหว่างองค์ประกอบ
      >
        {/* Action Button aligned center */}
        <Button
          variant="contained"
          color="primary"
          size="small"
          className="w-[50px]"
          startIcon={<i className="tabler-eye" />}
          onClick={() => setOpen(!open)}
          sx={{
            py: 1.5,
            maxWidth: '150px',
            flexShrink: 0, // ป้องกันการย่อของปุ่ม
          }}
        >
          ดู
        </Button>
      </Box>

    </Paper>
  )
}

export default PurchaseItem


