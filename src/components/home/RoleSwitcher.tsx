'use client'

import { useState, useEffect } from 'react'

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Paper
} from '@mui/material'

import { usePermission } from '../../contexts/PermissionContext'

// Define all available roles for switching
const AVAILABLE_ROLES = [
  { id: 'DIECUT_STAMPING_MANAGER_POS', label: 'หัวหน้าห้องแบบ' },
  { id: 'DIECUT_CHG_MOD_TYPE_LIST', label: 'พนักงานห้องแบบ' },
  { id: 'DIECUT_PLANNING_POS', label: 'วางแผน' },
  { id: null, label: 'ดู' }
]

const RoleSwitcher = () => {
  const { setOverrideRole, overrideRole, isRoleOverrideActive, setRoleOverrideActive } = usePermission()
  const [selectedRole, setSelectedRole] = useState<string | null>(overrideRole || null)

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedRoleOverride = localStorage.getItem('roleOverrideActive') === 'true'
    const savedRole = localStorage.getItem('overrideRole')

    if (savedRoleOverride) {
      setRoleOverrideActive(true)

      if (savedRole) {
        setSelectedRole(savedRole)
        setOverrideRole(savedRole)
      }
    }
  }, [setRoleOverrideActive, setOverrideRole])

  // Handle role override toggle
  const handleRoleOverrideToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.checked

    setRoleOverrideActive(newMode)
    localStorage.setItem('roleOverrideActive', String(newMode))

    // If turning off role override, clear override role
    if (!newMode) {
      setOverrideRole(null)
      localStorage.removeItem('overrideRole')
    }
  }

  // Handle role change
  const handleRoleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const roleId = event.target.value as string | null

    setSelectedRole(roleId)
    setOverrideRole(roleId)
    localStorage.setItem('overrideRole', roleId || '')
  }

  return (
    <Paper sx={{ p: 2, mb: 2, border: '1px dashed #3f51b5' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}></Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <FormControlLabel
          control={<Switch checked={isRoleOverrideActive} onChange={handleRoleOverrideToggle} color='primary' />}
          label='Enable Role Override'
        />

        {isRoleOverrideActive && (
          <FormControl size='small' sx={{ minWidth: 200 }}>
            <InputLabel>Simulate Role</InputLabel>
            <Select value={selectedRole || ''} onChange={handleRoleChange as any} label='Simulate Role'>
              {AVAILABLE_ROLES.map(role => (
                <MenuItem key={role.id || 'null'} value={role.id || ''}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='body2'>{role.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    </Paper>
  )
}

export default RoleSwitcher
