import React from 'react'

import { Button } from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileUpload'

import * as XLSX from 'xlsx'

import type { IDiecut } from '../../types/types'
import { formatNumber } from '../../utils/formatters'

interface ExportToExcelButtonProps {
  data: IDiecut[]
  getStatusText: (status: string | null | undefined) => string
}

const ExportToExcelButton: React.FC<ExportToExcelButtonProps> = ({ data, getStatusText }) => {
  const exportToExcel = () => {
    try {
      // Format dates properly
      const formatDate = (dateValue: any): string => {
        if (!dateValue) return ''

        try {
          const date = new Date(dateValue)

          if (isNaN(date.getTime())) return ''

          return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}/${date.getFullYear()}`
        } catch (e) {
          return ''
        }
      }

      // Prepare data rows with column headers
      const excelData = [
        // Headers row
        [
          'เลขที่',
          'สถานะ',
          'รหัส',
          'JOB',
          'รหัสสินค้า',
          'ชื่องาน',
          'กว้าง',
          'ยาว',
          'อายุคงเหลือ',
          'วันที่ต้องการใช้',
          'วันที่สั่งทำ'
        ]
      ]

      // Add data rows
      data.forEach(item => {
        excelData.push([
          String(item.DIECUT_ID) || '',
          getStatusText(item.STATUS) || '',
          item.DIECUT_SN || '',
          item.JOB_ID || '',
          item.PROD_ID ? (item.REVISION ? `${item.PROD_ID}-${item.REVISION}` : item.PROD_ID) : '',
          item.JOB_DESC || '',
          formatNumber(item.BLANK_SIZE_X) || '',
          formatNumber(item.BLANK_SIZE_Y) || '',
          formatNumber(item.REMAIN) || '',
          formatDate(item.DUE_DATE),
          formatDate(item.ORDER_DATE)
        ])
      })

      // Create workbook with a single worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData)

      // Set column widths
      const colWidths = [
        { wch: 15 }, // เลขที่
        { wch: 12 }, // สถานะ
        { wch: 15 }, // รหัส
        { wch: 12 }, // JOB
        { wch: 15 }, // รหัสสินค้า
        { wch: 40 }, // ชื่องาน
        { wch: 10 }, // กว้าง
        { wch: 10 }, // ยาว
        { wch: 15 }, // อายุคงเหลือ
        { wch: 15 }, // วันที่ต้องการใช้
        { wch: 15 } // วันที่สั่งทำ
      ]

      ws['!cols'] = colWidths

      // Set the first row as the header (bold, etc.)
      ws['!rows'] = [{ hpt: 20 }] // height of first row

      const wb = XLSX.utils.book_new()

      XLSX.utils.book_append_sheet(wb, ws, 'Diecut Data')

      // Generate filename with current date
      const filename = `diecut_data_${new Date().toISOString().slice(0, 10)}.xlsx`

      // Export the file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Error exporting data to Excel:', error)
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel กรุณาลองใหม่อีกครั้ง')
    }
  }

  return (
    <Button
      variant='contained'
      startIcon={<FileDownloadIcon />}
      onClick={exportToExcel}
      sx={{
        backgroundColor: '#98867B',
        '&:hover': {
          backgroundColor: '#5A4D40'
        }
      }}
    >
      Export Excel
    </Button>
  )
}

export default ExportToExcelButton
