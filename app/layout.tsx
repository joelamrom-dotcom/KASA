import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from './i18n/provider'
import AccessibilityWrapper from './components/AccessibilityWrapper'
import { RealtimeProvider } from './components/RealtimeProvider'

export const metadata: Metadata = {
  title: 'Real Estate SaaS Platform',
  description: 'Comprehensive real estate management system',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kasa" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <I18nProvider>
          <AccessibilityWrapper>
            <RealtimeProvider>
              {children}
            </RealtimeProvider>
          </AccessibilityWrapper>
        </I18nProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('SW registered:', reg))
                    .catch(err => console.log('SW registration failed:', err));
                });
              }
            `
          }}
        />
      </body>
    </html>
  )
}
