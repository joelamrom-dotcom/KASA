'use client'

import { useAuth } from './AuthProvider'
import Sidebar from './Sidebar'
import FloatingKasaButton from './FloatingKasaButton'
import ImpersonationBanner from './ImpersonationBanner'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isPublicRoute } = useAuth()
  
  return (
    <>
      {!isPublicRoute && (
        <>
          <Sidebar />
          <FloatingKasaButton />
          <ImpersonationBanner />
        </>
      )}
      <main className={!isPublicRoute ? 'ml-64 min-h-screen' : 'min-h-screen'}>
        {children}
      </main>
    </>
  )
}

