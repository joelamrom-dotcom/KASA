// Offline-first storage using IndexedDB
// This allows the app to work offline and sync when online

interface OfflineQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  timestamp: number
  retries: number
}

class OfflineStorage {
  private dbName = 'kasa-offline-db'
  private version = 1
  private db: IDBDatabase | null = null
  private queue: OfflineQueueItem[] = []
  private isOnline = navigator.onLine

  constructor() {
    this.init()
    this.setupOnlineListener()
  }

  private async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.loadQueue()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('families')) {
          db.createObjectStore('families', { keyPath: '_id' })
        }
        if (!db.objectStoreNames.contains('payments')) {
          db.createObjectStore('payments', { keyPath: '_id' })
        }
        if (!db.objectStoreNames.contains('members')) {
          db.createObjectStore('members', { keyPath: '_id' })
        }
      }
    })
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // Cache data for offline access
  async cacheData(store: string, key: string, data: any) {
    if (!this.db) await this.init()

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const objectStore = transaction.objectStore('cache')
      const request = objectStore.put({ key: `${store}:${key}`, data, timestamp: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get cached data
  async getCachedData(store: string, key: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly')
      const objectStore = transaction.objectStore('cache')
      const request = objectStore.get(`${store}:${key}`)

      request.onsuccess = () => {
        const result = request.result
        if (result && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
          // Cache valid for 24 hours
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Store data in IndexedDB
  async storeData(store: string, data: any) {
    if (!this.db) await this.init()

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get data from IndexedDB
  async getStoredData(store: string, key: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.get(key)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  // Get all data from a store
  async getAllStoredData(store: string): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Add to offline queue
  async queueRequest(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) {
    if (!this.db) await this.init()

    const queueItem: OfflineQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    }

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['queue'], 'readwrite')
      const objectStore = transaction.objectStore('queue')
      const request = objectStore.add(queueItem)

      request.onsuccess = () => {
        this.queue.push(queueItem)
        if (this.isOnline) {
          this.syncQueue()
        }
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Load queue from IndexedDB
  private async loadQueue() {
    if (!this.db) return

    const transaction = this.db.transaction(['queue'], 'readonly')
    const objectStore = transaction.objectStore('queue')
    const request = objectStore.getAll()

    request.onsuccess = () => {
      this.queue = request.result || []
      if (this.isOnline) {
        this.syncQueue()
      }
    }
  }

  // Sync queue when online
  private async syncQueue() {
    if (!this.isOnline || this.queue.length === 0) return

    const itemsToSync = [...this.queue]
    this.queue = []

    for (const item of itemsToSync) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: item.data ? JSON.stringify(item.data) : undefined,
        })

        if (response.ok) {
          // Remove from queue
          if (this.db) {
            const transaction = this.db.transaction(['queue'], 'readwrite')
            const objectStore = transaction.objectStore('queue')
            objectStore.delete(item.id)
          }
        } else {
          // Retry later
          item.retries++
          if (item.retries < 3) {
            this.queue.push(item)
            if (this.db) {
              const transaction = this.db.transaction(['queue'], 'readwrite')
              const objectStore = transaction.objectStore('queue')
              objectStore.put(item)
            }
          }
        }
      } catch (error) {
        console.error('Sync error:', error)
        item.retries++
        if (item.retries < 3) {
          this.queue.push(item)
        }
      }
    }
  }

  // Get queue status
  getQueueStatus() {
    return {
      count: this.queue.length,
      items: this.queue,
      isOnline: this.isOnline,
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage()

// Helper function for offline-aware fetch
export async function offlineFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const isOnline = navigator.onLine

  if (isOnline) {
    try {
      const response = await fetch(url, options)
      
      // Cache successful GET requests
      if (options.method === 'GET' || !options.method) {
        const cacheKey = url
        const data = await response.clone().json().catch(() => null)
        if (data) {
          await offlineStorage.cacheData('api', cacheKey, data)
        }
      }

      return response
    } catch (error) {
      // If fetch fails, try to get from cache
      const cached = await offlineStorage.getCachedData('api', url)
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw error
    }
  } else {
    // Offline: try cache first
    const cached = await offlineStorage.getCachedData('api', url)
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If POST/PUT/DELETE, queue it
    if (options.method && options.method !== 'GET') {
      const body = options.body ? JSON.parse(options.body as string) : undefined
      await offlineStorage.queueRequest({
        type: options.method === 'POST' ? 'create' : options.method === 'PUT' ? 'update' : 'delete',
        endpoint: url,
        method: options.method as any,
        data: body,
      })

      return new Response(JSON.stringify({ queued: true, message: 'Request queued for sync' }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    throw new Error('No internet connection and no cached data available')
  }
}

