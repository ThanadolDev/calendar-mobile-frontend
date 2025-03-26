'use client'

import type { MouseEvent, SyntheticEvent } from 'react'
import { useEffect, useState } from 'react'

import { CircularProgress, IconButton, InputAdornment, Paper, Tab, Tabs } from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'

import { getUserInfo } from '@/utils/userInfo'
import AppItemList from './list/AppItemList'
import CustomTextField from '@/@core/components/mui/TextField'
import { getCategoryMenuByUserId, getMenuByUserId } from '@/services/apiService'
import type { CategoryMenuUser, MenuUser } from '@/models/kmap'

const AppsComponent = () => {
  const [loading, setLoading] = useState(true)
  const userInfo = getUserInfo()
  const [isGrid, setIsGrid] = useState(true)
  const [searchTerm, setSearchTerm] = useState('') // State for search input
  const [tabValue, setTabValue] = useState<string>('all')
  const [category, setCategory] = useState<CategoryMenuUser[]>([])
  const [menuItems, setMenuItems] = useState<MenuUser[]>([])

  const handleTabChange = (event: SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
  }

  const handleCheckboxIsGridChange = () => {
    setIsGrid(!isGrid)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const fetchData = async () => {
    setLoading(true)

    if (!userInfo?.id && !userInfo?.ORG_ID) {
      return
    }

    try {
      const resMenuUser: MenuUser[] = await getMenuByUserId(userInfo?.id)
      const resCategory: CategoryMenuUser[] = await getCategoryMenuByUserId(userInfo?.id)

      // Add the new object to the first index of resCategory
      const newCategory: CategoryMenuUser = {
        GROUP_ID: 'all',
        GROUP_NAME: 'ทั้งหมด',
        genId: 'dasdzxfasdasdasd'
      }

      const updatedCategory = [newCategory, ...resCategory]

      // console.log('resMenuUser', resMenuUser)
      // console.log('resCategory', updatedCategory)

      setCategory(updatedCategory)
      setMenuItems(resMenuUser)
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
      <div className='flex flex-col text-center justify-center items-center h-full'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-1 h-full'>
      <div className='p-2  flex-grow'>
        <Paper className='p-2 shadow w-full mb-2'>
          <div className='flex flex-row items-center'>
            {/* Search Field */}
            <CustomTextField
              placeholder='ค้นหา'
              value={searchTerm}
              onChange={handleSearchChange}
              className=' w-full'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <IconButton
              aria-label='capture screenshot'
              color='inherit'
              size='large'
              onClick={handleCheckboxIsGridChange}
            >
              {isGrid ? <i className='tabler-list' /> : <i className='tabler-layout-grid' />}
            </IconButton>
          </div>
        </Paper>
        {category.length > 0 && (
          <Paper className='p-2 shadow w-full mb-2'>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant='scrollable'
              scrollButtons='auto'
              aria-label='scrollable auto tabs example'
            >
              {category.map((tab, index) => (
                <Tab
                  key={index}
                  value={tab.GROUP_ID}
                  component='a'
                  label={tab.GROUP_NAME}
                  onClick={(e: MouseEvent<HTMLElement>) => e.preventDefault()}
                />
              ))}
            </Tabs>
          </Paper>
        )}

        <AppItemList isGrid={isGrid} searchTerm={searchTerm} tabValue={tabValue} menuItems={menuItems} />
      </div>
    </div>
  )
}

export default AppsComponent
