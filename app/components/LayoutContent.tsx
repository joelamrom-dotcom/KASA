'use client'

import { useAuth } from './AuthProvider'
import Sidebar from './Sidebar'
import FloatingKasaButton from './FloatingKasaButton'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isPublicRoute } = useAuth()
  
  return (
    <>
      {!isPublicRoute && (
        <>
          <Sidebar />
          <FloatingKasaButton />
        </>
      )}
      <main className={!isPublicRoute ? 'ml-64 min-h-screen' : 'min-h-screen'}>
        {children}
      </main>
    </>
  )
}

