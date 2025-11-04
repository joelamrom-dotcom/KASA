import React from 'react';

// Client-side caching utility for localStorage
export class ClientCache {
  private static instance: ClientCache;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  static getInstance(): ClientCache {
    if (!ClientCache.instance) {
      ClientCache.instance = new ClientCache();
    }
    return ClientCache.instance;
  }

  // Set cache with TTL (Time To Live)
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl
      }));
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  }

  // Get cached data
  get(key: string): any | null {
    // Check memory cache first
    const memoryItem = this.cache.get(key);
    if (memoryItem && Date.now() - memoryItem.timestamp < memoryItem.ttl) {
      return memoryItem.data;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const item = JSON.parse(stored);
        if (Date.now() - item.timestamp < item.ttl) {
          // Update memory cache
          this.cache.set(key, item);
          return item.data;
        } else {
          // Expired, remove from localStorage
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    return null;
  }

  // Remove specific cache entry
  remove(key: string): void {
    this.cache.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // Get cache statistics
  getStats(): { memorySize: number; localStorageSize: number } {
    let localStorageSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          localStorageSize += localStorage.getItem(key)?.length || 0;
        }
      }
    } catch (error) {
      console.warn('Failed to calculate localStorage size:', error);
    }

    return {
      memorySize: this.cache.size,
      localStorageSize
    };
  }
}

// API wrapper with caching
export class CachedAPI {
  private static cache = ClientCache.getInstance();

  static async get<T>(url: string, ttl: number = 5 * 60 * 1000): Promise<T> {
    const cacheKey = `api:${url}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    this.cache.set(cacheKey, data, ttl);
    
    return data;
  }

  static async post<T>(url: string, body: any): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Invalidate related cache entries
    this.invalidateCache(url);
    
    return data;
  }

  static async put<T>(url: string, body: any): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Invalidate related cache entries
    this.invalidateCache(url);
    
    return data;
  }

  static async delete(url: string): Promise<void> {
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    // Invalidate related cache entries
    this.invalidateCache(url);
  }

  private static invalidateCache(url: string): void {
    // Remove cache entries that match the URL pattern
    const keysToRemove: string[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('api:') && key.includes(url.split('/').pop() || '')) {
          keysToRemove.push(key);
        }
      }
    } catch (error) {
      console.warn('Failed to invalidate cache:', error);
    }

    keysToRemove.forEach(key => this.cache.remove(key));
  }
}

// Hook for React components
export function useCachedAPI<T>(url: string, ttl: number = 5 * 60 * 1000) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await CachedAPI.get<T>(url, ttl);
        
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [url, ttl]);

  return { data, loading, error };
}
