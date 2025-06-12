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

interface ParsedItem {
  item: IDiecut
  baseId: string
  numberPart: number
  originalIndex: number
}

const ExportToExcelButton: React.FC<ExportToExcelButtonProps> = ({ data, getStatusText }) => {
  // Memoized date formatter
  const formatDate = React.useCallback((dateValue: any): string => {
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
  }, [])

  // Pre-process all items once - O(n) instead of O(n²)
  const parseAllItems = React.useCallback((items: IDiecut[]): ParsedItem[] => {
    return items.map((item, originalIndex) => {
      const sn = item.DIECUT_SN || ''
      const parts = sn.split('-')

      if (parts.length >= 2) {
        const baseId = parts.slice(0, -1).join('-')
        const numberPart = parseInt(parts[parts.length - 1]) || 0

        return { item, baseId, numberPart, originalIndex }
      }

      return { item, baseId: sn, numberPart: 0, originalIndex }
    })
  }, [])

  // Optimized sorting - O(n log n) instead of O(n³)
  const sortParsedItems = React.useCallback((parsedItems: ParsedItem[]): ParsedItem[] => {
    // Create a map of baseId to first occurrence index - O(n)
    const firstOccurrenceMap = new Map<string, number>()

    parsedItems.forEach(parsed => {
      if (!firstOccurrenceMap.has(parsed.baseId)) {
        firstOccurrenceMap.set(parsed.baseId, parsed.originalIndex)
      }
    })

    // Sort with O(log n) comparisons - O(n log n) total
    return [...parsedItems].sort((a, b) => {
      // If same base ID, sort by number part
      if (a.baseId === b.baseId) {
        return a.numberPart - b.numberPart
      }

      // Different base IDs - sort by first occurrence
      const aFirstIndex = firstOccurrenceMap.get(a.baseId) || 0
      const bFirstIndex = firstOccurrenceMap.get(b.baseId) || 0

      return aFirstIndex - bFirstIndex
    })
  }, [])

  // Use Web Workers for large datasets (optional enhancement)
  const processDataAsync = React.useCallback(
    async (items: IDiecut[]) => {
      return new Promise<IDiecut[]>(resolve => {
        // Use setTimeout to avoid blocking the UI
        setTimeout(() => {
          const parsedItems = parseAllItems(items)
          const sortedParsedItems = sortParsedItems(parsedItems)
          const sortedData = sortedParsedItems.map(parsed => parsed.item)

          resolve(sortedData)
        }, 0)
      })
    },
    [parseAllItems, sortParsedItems]
  )

  const exportToExcel = async () => {
    try {
      // Show loading state (you might want to add a loading indicator)
      console.log('Processing data...')

      // Process data asynchronously to avoid blocking UI
      const sortedData = await processDataAsync(data)

      console.log('Generating Excel file...')

      // Prepare headers
      const headers = [
        'เลขที่',
        'รหัส',
        'JOB',
        'วันที่สั่งทำ',
        'วันที่ต้องการใช้',
        'รหัสสินค้า',
        'ชื่องาน',
        'กว้าง',
        'ยาว',
        'อายุคงเหลือ',
        'สถานะ'
      ]

      // Pre-allocate array for better performance
      const excelData: (string | number)[][] = new Array(sortedData.length + 1)

      excelData[0] = headers

      // Process data in chunks to avoid blocking UI for very large datasets
      const CHUNK_SIZE = 1000

      for (let i = 0; i < sortedData.length; i += CHUNK_SIZE) {
        const chunk = sortedData.slice(i, i + CHUNK_SIZE)

        chunk.forEach((item, chunkIndex) => {
          const rowIndex = i + chunkIndex + 1

          excelData[rowIndex] = [
            String(item.DIECUT_ID) || '',
            item.DIECUT_SN || '',
            item.JOB_ID || '',
            formatDate(item.DUE_DATE),
            formatDate(item.ORDER_DATE),
            item.PROD_ID ? (item.REVISION ? `${item.PROD_ID}-${item.REVISION}` : item.PROD_ID) : '',
            item.JOB_DESC || '',
            formatNumber(item.BLANK_SIZE_X) || '',
            formatNumber(item.BLANK_SIZE_Y) || '',
            formatNumber(item.REMAIN) || '',
            getStatusText(item.STATUS) || ''
          ]
        })

        // Yield control back to the browser for every chunk
        if (i + CHUNK_SIZE < sortedData.length) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }

      console.log('Creating workbook...')

      // Create workbook
      const ws = XLSX.utils.aoa_to_sheet(excelData)

      // Set column widths
      ws['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 40 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 }
      ]

      ws['!rows'] = [{ hpt: 20 }]

      const wb = XLSX.utils.book_new()

      XLSX.utils.book_append_sheet(wb, ws, 'Diecut Data')

      // Generate filename
      const filename = `diecut_data_${new Date().toISOString().slice(0, 10)}.xlsx`

      console.log('Downloading file...')
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
