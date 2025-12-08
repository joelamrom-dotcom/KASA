import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from './i18n/provider'
import AccessibilityWrapper from './components/AccessibilityWrapper'
import { RealtimeProvider } from './components/RealtimeProvider'
import OnboardingProvider from './components/OnboardingProvider'
import PerformanceOptimizer from './components/PerformanceOptimizer'
import ResourceHints from './components/ResourceHints'
import ResourcePrioritizer from './components/ResourcePrioritizer'
import PreloadCriticalResources from './components/PreloadCriticalResources'
import HTTP3Optimizer from './components/HTTP3Optimizer'
import CriticalPathOptimizer from './components/CriticalPathOptimizer'
import FontSubsetter from './components/FontSubsetter'
import CacheWarmer from './components/CacheWarmer'
import NetworkOptimizer from './components/NetworkOptimizer'
import AnimationOptimizer from './components/AnimationOptimizer'
import PassiveEventListeners from './components/PassiveEventListeners'
import PreloadKeyRequests from './components/PreloadKeyRequests'
import ReduceJSExecution from './components/ReduceJSExecution'
import ReactQueryProvider from './components/ReactQueryProvider'

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kasa" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <ResourceHints />
        <ResourcePrioritizer />
        <PreloadCriticalResources />
        <HTTP3Optimizer />
        <CriticalPathOptimizer />
        <FontSubsetter />
        <CacheWarmer />
        <NetworkOptimizer />
        <AnimationOptimizer />
        <PassiveEventListeners />
        <PreloadKeyRequests />
        <ReduceJSExecution />
        <PerformanceOptimizer />
          <ReactQueryProvider>
            <I18nProvider>
              <AccessibilityWrapper>
                <RealtimeProvider>
                  <OnboardingProvider>
                    {children}
                  </OnboardingProvider>
                </RealtimeProvider>
              </AccessibilityWrapper>
            </I18nProvider>
          </ReactQueryProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => {
                      console.log('SW registered:', reg);
                      // Check for updates
                      reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              // New service worker available
                              console.log('New service worker available');
                            }
                          });
                        }
                      });
                    })
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
