// components/PermissionButton.tsx
import React from 'react'

import type { ButtonProps, IconButtonProps } from '@mui/material'
import { Button, IconButton, Tooltip } from '@mui/material'

// import type { SxProps, Theme } from '@mui/material/styles'

import { usePermission } from '../contexts/PermissionContext'

// Permission Button Props
interface PermissionButtonProps extends ButtonProps {
  requiredPermission?: keyof Omit<ReturnType<typeof usePermission>, 'userRole'>
  permissions?: Array<keyof Omit<ReturnType<typeof usePermission>, 'userRole'>>
  requiresManager?: boolean
  showDisabled?: boolean
  disabledTooltip?: string
}

/**
 * A Button component that checks permissions before enabling
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  requiredPermission,
  permissions = [],
  requiresManager = false,
  showDisabled = true,
  disabledTooltip = "You don't have permission for this action",
  disabled = false,
  children,
  ...props
}) => {
  const userPermissions = usePermission()

  // Check permissions
  let hasPermission = true

  if (requiredPermission) {
    hasPermission = userPermissions[requiredPermission]
  } else if (permissions.length > 0) {
    hasPermission = permissions.some(permission => userPermissions[permission])
  }

  // Additional check for manager requirement
  if (requiresManager && !userPermissions.isManager) {
    hasPermission = false
  }

  // If user doesn't have permission and showDisabled is false, don't render
  if (!hasPermission && !showDisabled) {
    return null
  }

  // Render button in disabled state if no permission
  return !hasPermission && showDisabled ? (
    <Tooltip title={disabledTooltip}>
      <span>
        {' '}
        {/* Wrapper needed for disabled buttons */}
        <Button {...props} disabled={true}>
          {children}
        </Button>
      </span>
    </Tooltip>
  ) : (
    <Button {...props} disabled={disabled || !hasPermission}>
      {children}
    </Button>
  )
}

// Permission IconButton Props
interface PermissionIconButtonProps extends IconButtonProps {
  requiredPermission?: keyof Omit<ReturnType<typeof usePermission>, 'userRole'>
  permissions?: Array<keyof Omit<ReturnType<typeof usePermission>, 'userRole'>>
  requiresManager?: boolean
  showDisabled?: boolean
}

/**
 * An IconButton component that checks permissions before enabling
 */
export const PermissionIconButton: React.FC<PermissionIconButtonProps> = ({
  requiredPermission,
  permissions = [],
  requiresManager = false,
  showDisabled = true,
  disabled = false,
  children,
  ...props
}) => {
  const userPermissions = usePermission()

  // Check permissions
  let hasPermission = true

  if (requiredPermission) {
    hasPermission = userPermissions[requiredPermission]
  } else if (permissions.length > 0) {
    hasPermission = permissions.some(permission => userPermissions[permission])
  }

  // Additional check for manager requirement
  if (requiresManager && !userPermissions.isManager) {
    hasPermission = false
  }

  // If user doesn't have permission and showDisabled is false, don't render
  if (!hasPermission && !showDisabled) {
    return null
  }

  // Render button in disabled state if no permission
  return (
    <IconButton {...props} disabled={disabled || !hasPermission}>
      {children}
    </IconButton>
  )
}
