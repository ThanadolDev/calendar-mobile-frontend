// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
// import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import HomeIcon from '@mui/icons-material/Home'

// import AppsIcon from '@mui/icons-material/Apps'

import { Divider } from '@mui/material'

import { IconLogout2 } from '@tabler/icons-react'

import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const smyleURL = process.env.NEXT_PUBLIC_SMYLE_URL

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Add this wrapper div with flex classes */}
      <div className='flex flex-col h-full'>
        {/* Main Menu */}
        <Menu
          popoutMenuOffset={{ mainAxis: 23 }}
          menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
          renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
          renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
          menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
        >
          <MenuItem href='/home' icon={<HomeIcon />}>
            หน้าหลัก
          </MenuItem>
        </Menu>

        <div className='mt-auto'>
          <Divider />
          <Menu
            popoutMenuOffset={{ mainAxis: 23 }}
            menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
            renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
            renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
            menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
          >
            <MenuItem
              icon={<IconLogout2 size={20} />}
              onClick={() => smyleURL && (window.location.href = smyleURL)}
              className='py-3'
            >
              BACK
            </MenuItem>
          </Menu>
        </div>
      </div>
    </ScrollWrapper>
  )
}

export default VerticalMenu
