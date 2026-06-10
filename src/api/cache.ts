interface CacheEntry<T> {
  data: T
  timestamp: number
  ttlMs: number
}

const CACHE_PREFIX = 'gp_cache_'

export function setCacheEntry<T>(key: string, data: T, ttlMinutes: number): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttlMs: ttlMinutes * 60 * 1000,
  }
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch {
    // localStorage quota exceeded — skip caching silently
  }
}

export function getCacheEntry<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function getCacheAge(key: string): number | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<unknown> = JSON.parse(raw)
    return Math.floor((Date.now() - entry.timestamp) / 1000)
  } catch {
    return null
  }
}

export function clearAllCache(): void {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX))
  keys.forEach((k) => localStorage.removeItem(k))
}

export function clearCacheByKey(key: string): void {
  localStorage.removeItem(CACHE_PREFIX + key)
}
