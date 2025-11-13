import type { Metadata } from 'next'
import './globals.css'
import './error-handler'
import Sidebar from './components/Sidebar'
import FloatingKasaButton from './components/FloatingKasaButton'

export const metadata: Metadata = {
  title: 'Kasa Family Management',
  description: 'Family financial management system with age-based payment plans',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
        <Sidebar />
        <main className="ml-64 min-h-screen">
          {children}
        </main>
        <FloatingKasaButton />
      </body>
    </html>
  )
}

