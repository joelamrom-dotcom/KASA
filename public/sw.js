// Enhanced Service Worker for PWA with aggressive caching
const CACHE_NAME = 'kasa-cache-v2'
const STATIC_CACHE = 'kasa-static-v2'
const API_CACHE = 'kasa-api-v2'

// Cache static assets
const staticAssets = [
  '/',
  '/manifest.json',
  '/offline',
]

// Cache API responses (with shorter TTL)
const apiCachePatterns = [
  /\/api\/kasa\/families/,
  /\/api\/kasa\/payments/,
  /\/api\/kasa\/dashboard/,
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(staticAssets)
      }),
      self.skipWaiting(), // Activate immediately
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== API_CACHE && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      }),
      self.clients.claim(), // Take control of all pages
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // API requests - Network first with cache fallback
  if (apiCachePatterns.some(pattern => pattern.test(url.pathname))) {
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
          // Fallback to cache if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return offline response if no cache
            return new Response(JSON.stringify({ error: 'Offline' }), {
              headers: { 'Content-Type': 'application/json' },
            })
          })
        })
    )
    return
  }

  // Static assets - Cache first with network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        return fetch(request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          const responseToCache = response.clone()
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })
          
          return response
        })
      })
    )
    return
  }

  // External resources - Network only
  event.respondWith(fetch(request))
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments())
  }
})

async function syncPayments() {
  // Implement background sync logic
  console.log('Syncing payments...')
}
