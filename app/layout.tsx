import type { Metadata } from 'next'
import './globals.css'
import './error-handler'
import AuthProvider from './components/AuthProvider'
import LayoutContent from './components/LayoutContent'
import ToastContainer from './components/Toast'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'
import PWAInstallPrompt from './components/PWAInstallPrompt'

export const metadata: Metadata = {
  title: 'Kasa Family Management',
  description: 'Family financial management system with age-based payment plans',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kasa',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%233b82f6\'/%3E%3Ctext x=\'50\' y=\'70\' font-size=\'60\' font-weight=\'bold\' text-anchor=\'middle\' fill=\'white\' font-family=\'Arial\'%3EK%3C/text%3E%3C/svg%3E',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%233b82f6\'/%3E%3Ctext x=\'50\' y=\'70\' font-size=\'60\' font-weight=\'bold\' text-anchor=\'middle\' fill=\'white\' font-family=\'Arial\'%3EK%3C/text%3E%3C/svg%3E',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kasa" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%233b82f6'/%3E%3Ctext x='50' y='70' font-size='60' font-weight='bold' text-anchor='middle' fill='white' font-family='Arial'%3EK%3C/text%3E%3C/svg%3E" />
      </head>
      <body className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
        <ServiceWorkerRegistration />
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
          <ToastContainer />
          <PWAInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  )
}
