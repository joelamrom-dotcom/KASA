// Service Worker for Kasa Family Management PWA - Enhanced for Offline-First
const CACHE_NAME = 'kasa-pwa-v2'
const RUNTIME_CACHE = 'kasa-runtime-v2'
const API_CACHE = 'kasa-api-v2'

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/families',
  '/payments',
  '/dashboard',
  '/manifest.json',
  '/offline.html' // Offline fallback page
]

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          })
          .map((cacheName) => {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache, fallback to network (offline-first strategy)
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests with network-first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET requests
    if (request.method === 'GET') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Clone the response
            const responseToCache = response.clone()
            
            // Cache successful responses
            if (response.status === 200) {
              caches.open(API_CACHE).then((cache) => {
                cache.put(request, responseToCache)
              })
            }
            
            return response
          })
          .catch(() => {
            // Network failed, try cache
            return caches.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // Return offline response
              return new Response(
                JSON.stringify({ error: 'Offline', cached: true }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' },
                }
              )
            })
          })
      )
    }
    return
  }

  // Skip non-GET requests for static assets
  if (request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response
            const responseToCache = response.clone()

            // Cache the response
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // Return offline page if available
            if (event.request.destination === 'document') {
              return caches.match('/')
            }
          })
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments())
  }
})

async function syncPayments() {
  // Sync offline payments when back online
  // This would need to be implemented with IndexedDB
  console.log('Service Worker: Syncing payments')
}

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Kasa Family Management'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/kasa-logo.png',
    badge: '/kasa-logo.png',
    data: data.url || '/',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    requireInteraction: false
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})

