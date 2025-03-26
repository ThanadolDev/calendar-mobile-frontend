// Next Imports
import type { Metadata } from 'next'

// Component Imports

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'
import LoginOg from '@/views/LoginOg'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account'
}

const LoginPage = () => {
  // Vars
  const mode = getServerMode()

  return <LoginOg mode={mode} />
}

export default LoginPage
