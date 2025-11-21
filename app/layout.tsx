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
    icon: '/kasa-logo.png',
    apple: '/kasa-logo.png',
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
        <link rel="apple-touch-icon" href="/kasa-logo.png" />
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
