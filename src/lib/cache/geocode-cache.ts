/**
 * In-memory geocoding cache to reduce duplicate API calls
 * Caches address → coordinates mappings
 */

interface CacheEntry {
  coordinates: { lat: number; lng: number }
  address: string
  timestamp: number
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
const MAX_CACHE_SIZE = 100

class GeocodeCache {
  private cache = new Map<string, CacheEntry>()

  /**
   * Get cached coordinates for an address
   */
  get(address: string): { lat: number; lng: number } | null {
    const entry = this.cache.get(address.toLowerCase())
    if (!entry) return null

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(address.toLowerCase())
      return null
    }

    return entry.coordinates
  }

  /**
   * Store coordinates for an address
   */
  set(address: string, coordinates: { lat: number; lng: number }): void {
    const key = address.toLowerCase()

    // Remove oldest entry if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      coordinates,
      address,
      timestamp: Date.now()
    })
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const geocodeCache = new GeocodeCache()
