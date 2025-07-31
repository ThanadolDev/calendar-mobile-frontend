'use client'

import React from 'react'

import MobileCalendar from './MobileCalendar'
import { useAuth } from '../../contexts/AuthContext'

const HomeComponent3 = () => {
  const { user } = useAuth()
  
  return <MobileCalendar employeeId={user?.id} />
}

export default HomeComponent3
