/**
 * Simple in-memory cache with TTL
 * Для production используйте Redis
 */
class CacheService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate cache key
   */
  generateKey(query, filters) {
    return `${query}:${JSON.stringify(filters)}`;
  }

  /**
   * Get cached data
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] HIT: ${key}`);
    return item.data;
  }

  /**
   * Set cache data
   */
  set(key, data, ttlSeconds = 300) {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
    console.log(`[Cache] SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    console.log('[Cache] Cleared all cache');
  }

  /**
   * Get cache stats
   */
  stats() {
    const total = this.cache.size;
    let valid = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.expires > now) {
        valid++;
      }
    }

    return { total, valid, expired: total - valid };
  }
}

export default new CacheService();
