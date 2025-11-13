import type { Metadata } from 'next'
<<<<<<< HEAD
// import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from './components/Sidebar'
import { ThemeProvider } from './components/ThemeProvider'
import ToastContainer from './components/Toast'
import CustomCursor from './components/CustomCursor'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI SaaS Platform',
  description: 'AI-powered SaaS staging platform',
=======
import './globals.css'
import './error-handler'
import Sidebar from './components/Sidebar'
import FloatingKasaButton from './components/FloatingKasaButton'

export const metadata: Metadata = {
  title: 'Kasa Family Management',
  description: 'Family financial management system with age-based payment plans',
>>>>>>> e871ae6ee9b954bce1542dbaba651a8702b4a713
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
<<<<<<< HEAD
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 transition-colors duration-200 relative overflow-x-hidden">
        <ThemeProvider>
          <div className="min-h-screen relative">
            {/* Animated background gradient */}
            <div className="fixed inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5 animate-pulse"></div>
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
            </div>
            <CustomCursor />
            <Sidebar />
            <div className="relative z-10 min-h-screen" id="main-content">
              {children}
            </div>
            <ToastContainer />
          </div>
        </ThemeProvider>
=======
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
        <Sidebar />
        <main className="ml-64 min-h-screen">
          {children}
        </main>
        <FloatingKasaButton />
>>>>>>> e871ae6ee9b954bce1542dbaba651a8702b4a713
      </body>
    </html>
  )
}
<<<<<<< HEAD
=======

>>>>>>> e871ae6ee9b954bce1542dbaba651a8702b4a713
