'use client'

import { useEffect, useState } from 'react'

// import axios from 'axios';

import { useRouter } from 'next/navigation'

import Image from 'next/image'

import { Chip, CircularProgress, Paper, Typography, useTheme } from '@mui/material'

import { toast } from 'react-toastify'

import { calculateTotalValueSelected, formatToTwoDecimals, type HeadPr } from '@/models/PurchaseRequest'

// import PurchaseTable from './PurchaseTable';
import PurchaseList from './PurchaseList'
import { getApprovalList, sentApproval } from '@/services/apiService'
import { getUserInfo } from '@/utils/userInfo'
import ConfirmSubmit from './ConfirmSubmit'
import TotalTab from './TotalTab'

const PurchaseRequestApproval = () => {
  const [purchaseRequests, setPurchaseRequests] = useState<HeadPr[]>([])
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark' // เช็คโหมด dark หรือ light
  const [loading, setLoading] = useState(true)
  const userInfo = getUserInfo()
  const router = useRouter()
  const [loadingApprove, setLoadingApprove] = useState(false)
  const [open, setOpen] = useState(false)
  const [currIds, setCurrIds] = useState<string[]>([])

  const fetchPurchaseRequests = async () => {
    setLoading(true)

    if (!userInfo?.id && !userInfo?.ORG_ID) {
      return
    }

    try {
      // const response: HeadPr[] = await getApprovalList(userInfo?.id, userInfo?.ORG_ID);

      const response: HeadPr[] = await getApprovalList('370004', 'KPR')

      console.log('response=', response)
      setPurchaseRequests(response || [])
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Purchase Requests from the server
  useEffect(() => {
    fetchPurchaseRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // ดึงค่าจากฟิลด์ CURR_ID และกำจัดค่าซ้ำ
    const ids = Array.from(new Set(purchaseRequests.map(request => request.CURR_ID)))

    setCurrIds(ids)
  }, [purchaseRequests])

  // Approve Selected PRs
  const approveSelectedPRs = async () => {
    if (!userInfo?.id && !userInfo?.ORG_ID) {
      return
    }

    setLoadingApprove(true) // Start loading

    try {
      // const items: HeadPr[] = purchaseRequests.filter(pr => pr.approve)
      const items: HeadPr[] = purchaseRequests

      // const res = await sentApproval(userInfo?.ORG_ID, userInfo?.id, items)

      const res = await sentApproval('KPR', '370004', items)

      console.log('กดอนุมัติ')
      console.log('items=', items)

      // console.log("userId=", userInfo?.id);
      // console.log("ORG_ID=", userInfo?.ORG_ID);
      console.log('res', res)

      if (res.success) {
        toast.success(res.message)

        router.refresh()
        fetchPurchaseRequests()
        setOpen(false)
      }
    } catch (error) {
      console.error('Error approving PRs:', error)
      toast.error('เกิดข้อผิดพลาดในการอนุมัติ')
    } finally {
      setLoadingApprove(false) // Stop loading after completion
    }
  }

  // Handle change for "Approve" and "Wait" checkboxes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCheckboxChange = (PR_ID: string, type: 'approve' | 'wait', OBJ_REF: string, PR_REVISION: string) => {
    setPurchaseRequests(prevRequests =>
      prevRequests.map(request => {
        // หาก PR_ID ตรงกับหมายเลขที่ต้องการแก้ไข
        if (request.PR_ID === PR_ID && request.OBJ_REF === OBJ_REF && request.PR_REVISION === PR_REVISION) {
          return {
            ...request,
            [type]: !request[type] // สลับค่าของฟิลด์ (approve หรือ wait)
          }
        }

        // หากไม่ตรง ให้คืนค่ารายการเดิม
        return request
      })
    )
  }

  const totalSelected = purchaseRequests.filter(pr => pr.approve).length

  if (loading) {
    return (
      <div className='flex flex-col text-center justify-center items-center h-full'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <Paper className='p-2 shadow '>
        <PurchaseList purchaseRequests={purchaseRequests} handleCheckboxChange={handleCheckboxChange} />

        {purchaseRequests.length > 0 && (
          <Paper
            className={`p-2 shadow sticky bottom-0 z-10 m-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} // ใช้สีพื้นหลังตามโหมดธีม
          >
            {/* Static Approval Summary and Approve Button */}
            <div className='flex flex-col justify-between items-end   gap-2'>
              <div className='flex flex-col justify-between items-start   gap-2 w-full overflow-x-auto'>
                <div>
                  <p>
                    {totalSelected} จาก {purchaseRequests.length} ที่เลือกไว้สำหรับการอนุมัติ
                  </p>
                </div>

                {/* tab สกุลเงิน*/}
                {currIds.length === 1 ? (
                  <>
                    <div className='flex flex-row gap-4 items-center justify-start w-full py-2'>
                      <p className='min-w-[80px]'>รวมทั้งสิ้น</p>
                      {currIds
                        .filter(id => calculateTotalValueSelected(id, purchaseRequests) !== 0) // กรองเฉพาะค่า != 0
                        .map((id, index) => (
                          <div key={index} className='w-full flex flex-row justify-end items-center gap-1'>
                            <Chip
                              className='w-full'
                              label={
                                <Typography variant='h5' className='text-green-500'>
                                  {formatToTwoDecimals(calculateTotalValueSelected(id, purchaseRequests))}
                                </Typography>
                              }
                              color='success'
                              variant='tonal'
                            />
                            <Typography variant='h5'>{id}</Typography>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <TotalTab currIds={currIds} data={purchaseRequests} defaultTab={currIds[0] || 'THB'} />
                )}
              </div>

              <ConfirmSubmit
                handleApproval={approveSelectedPRs}
                loadingSubmit={loadingApprove}
                title='อนุมัติ'
                message='คุณต้องการที่จะอนุมัติ ใช่หรือไม่'
                setOpen={setOpen}
                open={open}
                disabled={totalSelected === 0 || loadingApprove}
              />
            </div>
          </Paper>
        )}

        {purchaseRequests.length === 0 && (
          <div className='flex flex-col text-center justify-center items-center h-full gap-4 my-6'>
            <Image src={'/toolingmanage/images/undraw_no_data_re_kwbl.svg'} height={300} width={300} alt='Image' />

            <h3>No PR left to be approved</h3>
          </div>
        )}
      </Paper>
    </div>
  )
}

export default PurchaseRequestApproval
