import * as React from 'react'

import Image from 'next/image'

import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Grid from '@mui/material/Grid'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Divider, Paper, Tooltip } from '@mui/material'

import type { MenuUser } from '@/models/kmap'

export default function AppItemList({
  isGrid,
  searchTerm,
  tabValue,
  menuItems
}: {
  isGrid: boolean
  searchTerm: string
  tabValue: string
  menuItems: MenuUser[]
}) {
  // Filter data based on search term and tabValue
  const filteredData = menuItems
    .filter(item => item.TOOL_NAME.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(item => tabValue === 'all' || item.GROUP_ID.toString() === tabValue)

  const handleItemClick = (link: string) => {
    console.log('handleItemClick =', link)
    window.location.href = link
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        {filteredData.length === 0 ? (
          <Grid item xs={12}>
            <div className='flex flex-col text-center justify-center items-center h-full gap-4 my-6'>
              <Image src='/tooling/images/undraw_no_data_re_kwbl.svg' height={300} width={300} alt='ไม่มีข้อมูล' />
              <h3>ไม่มีข้อมูล</h3>
            </div>
          </Grid>
        ) : isGrid ? (
          filteredData.map((item, index) => (
            <Grid item xs={6} sm={4} lg={3} key={index}>
              <Paper
                onClick={() => handleItemClick(item.URL)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: 2,
                  borderRadius: 1,
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                <Avatar src={item.ICON_SRC} alt={item.TOOL_NAME} sx={{ width: 56, height: 56 }} />
                <Tooltip title={item.TOOL_NAME} arrow>
                  <Box
                    mt={1}
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%'
                    }}
                  >
                    {item.TOOL_NAME}
                  </Box>
                </Tooltip>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper>
              <List dense={false}>
                {filteredData.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      onClick={() => handleItemClick(item.URL)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={item.ICON_SRC} alt={item.TOOL_NAME} />
                      </ListItemAvatar>
                      <ListItemText primary={item.TOOL_NAME} secondary={''} />
                      <KeyboardArrowRightIcon />
                    </ListItem>
                    {/* Divider added after each ListItem */}
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
