import HomeComponent from '@/components/home/HomeComponent3'

import { AuthProvider } from '@/contexts/AuthContext'

import  ThemeProvider  from '../../providers/ThemeProvider'

export default function Page() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <HomeComponent />
      </ThemeProvider>
    </AuthProvider>
  )
}
