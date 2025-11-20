'use client'

import { useAuth } from './AuthProvider'
import Sidebar from './Sidebar'
import MobileSidebar from './MobileSidebar'
import FloatingKasaButton from './FloatingKasaButton'
import ImpersonationBanner from './ImpersonationBanner'
import OfflineIndicator from './OfflineIndicator'
import GlobalSearch from './GlobalSearch'
import KeyboardShortcuts from './KeyboardShortcuts'
import DarkModeToggle from './DarkModeToggle'
import HelpCenter from './HelpCenter'
import PerformanceMonitor from './PerformanceMonitor'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isPublicRoute } = useAuth()
  
  return (
    <>
      {!isPublicRoute && (
        <>
          <Sidebar />
          <MobileSidebar />
          <FloatingKasaButton />
          <ImpersonationBanner />
          <OfflineIndicator />
          <GlobalSearch />
          <KeyboardShortcuts />
          <DarkModeToggle />
          <HelpCenter />
          {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
        </>
      )}
      <main className={!isPublicRoute ? 'ml-0 md:ml-64 min-h-screen' : 'min-h-screen'}>
        {children}
      </main>
    </>
  )
}

