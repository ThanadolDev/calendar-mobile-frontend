import HomeComponent from '@/components/home/HomeComponent'

import { AuthProvider } from '@/contexts/AuthContext'

export default function Page() {
  return (
    <AuthProvider>
      <HomeComponent />
    </AuthProvider>
  )
}
