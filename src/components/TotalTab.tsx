import type { SyntheticEvent } from 'react';
import { useState } from 'react'

import { Tab, Chip, Typography } from '@mui/material'
import { TabList, TabPanel, TabContext } from '@mui/lab'

import { calculateTotalValueSelected, formatToTwoDecimals, type HeadPr } from '@/models/PurchaseRequest'

interface Props {
  currIds: string[]
  data: HeadPr[]
  defaultTab: string
}

const TotalTab = ({ currIds, data, defaultTab }: Props) => {
  const [value, setValue] = useState(defaultTab)
  const filteredIds = currIds.filter((id) => calculateTotalValueSelected(id, data) !== 0)

  return (
    <div className='w-full'>
      <TabContext value={value}>
        <TabList
          centered={true}
          onChange={(e: SyntheticEvent, newValue: string) => setValue(newValue)}
          variant='scrollable'
          scrollButtons
        >
          {filteredIds.map((id) => (
            <Tab value={id} label={id} key={id} />
          ))}
        </TabList>
        {filteredIds.map((id) => (
          <TabPanel value={id} key={id}>
            <div className='w-full flex gap-1 items-center'>
              <p className='min-w-[80px]'>รวมทั้งสิ้น</p>
              <Chip
                className='w-full'
                label={
                  <Typography variant='h5' className='text-green-500'>
                    {formatToTwoDecimals(calculateTotalValueSelected(id, data))}
                  </Typography>
                }
                color='success'
                variant='tonal'
              />
              <Typography variant='h5'>{id}</Typography>
            </div>
          </TabPanel>
        ))}
      </TabContext>
    </div>
  )
}

export default TotalTab
