/**
 * Comprehensive Caching System
 * Provides multiple cache types with TTL, invalidation, and performance optimization
 */

import { getConfig } from '../config/index.js';

/**
 * In-memory cache implementation
 */
class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
    
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.maxSize = options.maxSize || 1000;
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute
    
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = this.defaultTTL) {
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Check cache size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const expiresAt = Date.now() + ttl;
    const entry = {
      value,
      expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
    this.stats.sets++;

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
    
    return true;
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    const existed = this.cache.delete(key);
    
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    
    if (existed) {
      this.stats.deletes++;
    }
    
    return existed;
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.timers.clear();
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Start cleanup routine
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.delete(key);
    }
  }

  /**
   * Get all keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

/**
 * Cache manager with multiple cache instances
 */
export class CacheManager {
  constructor() {
    this.config = getConfig();
    this.caches = new Map();
    
    // Initialize default caches
    this.initializeDefaultCaches();
  }

  /**
   * Initialize default cache instances
   */
  initializeDefaultCaches() {
    // API response cache - short TTL
    this.caches.set('api', new MemoryCache({
      defaultTTL: 2 * 60 * 1000, // 2 minutes
      maxSize: 500,
    }));

    // Database query cache - medium TTL
    this.caches.set('db', new MemoryCache({
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
    }));

    // User session cache - long TTL
    this.caches.set('session', new MemoryCache({
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      maxSize: 200,
    }));

    // File metadata cache - medium TTL
    this.caches.set('files', new MemoryCache({
      defaultTTL: 10 * 60 * 1000, // 10 minutes
      maxSize: 800,
    }));

    // Configuration cache - very long TTL
    this.caches.set('config', new MemoryCache({
      defaultTTL: 60 * 60 * 1000, // 1 hour
      maxSize: 100,
    }));

    // Health check cache - very short TTL
    this.caches.set('health', new MemoryCache({
      defaultTTL: 30 * 1000, // 30 seconds
      maxSize: 50,
    }));
  }

  /**
   * Get cache instance
   */
  getCache(name) {
    return this.caches.get(name);
  }

  /**
   * Create new cache instance
   */
  createCache(name, options = {}) {
    const cache = new MemoryCache(options);
    this.caches.set(name, cache);
    return cache;
  }

  /**
   * Get value from specific cache
   */
  get(cacheName, key) {
    const cache = this.getCache(cacheName);
    return cache ? cache.get(key) : null;
  }

  /**
   * Set value in specific cache
   */
  set(cacheName, key, value, ttl) {
    const cache = this.getCache(cacheName);
    return cache ? cache.set(key, value, ttl) : false;
  }

  /**
   * Delete value from specific cache
   */
  delete(cacheName, key) {
    const cache = this.getCache(cacheName);
    return cache ? cache.delete(key) : false;
  }

  /**
   * Clear specific cache
   */
  clear(cacheName) {
    const cache = this.getCache(cacheName);
    if (cache) {
      cache.clear();
      return true;
    }
    return false;
  }

  /**
   * Clear all caches
   */
  clearAll() {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Get statistics for all caches
   */
  getAllStats() {
    const stats = {};
    
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    
    return stats;
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(cacheName, pattern) {
    const cache = this.getCache(cacheName);
    if (!cache) return false;
    
    const regex = new RegExp(pattern);
    const keysToDelete = cache.keys().filter(key => regex.test(key));
    
    for (const key of keysToDelete) {
      cache.delete(key);
    }
    
    return keysToDelete.length;
  }

  /**
   * Invalidate user-specific cache entries
   */
  invalidateUser(userId) {
    let totalInvalidated = 0;
    
    for (const [cacheName, cache] of this.caches.entries()) {
      const userPattern = `.*:${userId}:.*|.*:user:${userId}.*`;
      totalInvalidated += this.invalidatePattern(cacheName, userPattern);
    }
    
    return totalInvalidated;
  }
}

/**
 * Cache middleware for API responses
 */
export class CacheMiddleware {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
  }

  /**
   * Create cache middleware for API routes
   */
  create(options = {}) {
    const {
      cacheName = 'api',
      ttl,
      keyGenerator = (req) => `${req.method}:${req.originalUrl || req.url}`,
      skipCache = () => false,
      skipUserCache = false,
    } = options;

    return async (req, res, next) => {
      // Skip caching if specified
      if (skipCache(req)) {
        return next();
      }

      // Generate cache key
      let cacheKey = keyGenerator(req);
      
      // Add user isolation if not skipped
      if (!skipUserCache) {
        const userId = req.headers['x-user-id'] || req.user?.id;
        if (userId) {
          cacheKey = `user:${userId}:${cacheKey}`;
        }
      }

      // Try to get from cache
      const cached = this.cacheManager.get(cacheName, cacheKey);
      if (cached) {
        // Set cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return res.json(cached);
      }

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.cacheManager.set(cacheName, cacheKey, data, ttl);
        }
        
        // Set cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return originalJson(data);
      };

      next();
    };
  }

  /**
   * Cache for GET requests only
   */
  getOnly(options = {}) {
    return this.create({
      ...options,
      skipCache: (req) => req.method !== 'GET',
    });
  }

  /**
   * Cache for authenticated users only
   */
  authenticatedOnly(options = {}) {
    return this.create({
      ...options,
      skipCache: (req) => !req.headers['x-user-id'] && !req.user?.id,
    });
  }
}

/**
 * Query result cache helper
 */
export class QueryCache {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.cacheName = 'db';
  }

  /**
   * Cache database query result
   */
  async cacheQuery(key, queryFn, ttl) {
    // Try cache first
    const cached = this.cacheManager.get(this.cacheName, key);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const result = await queryFn();
    
    // Cache result
    this.cacheManager.set(this.cacheName, key, result, ttl);
    
    return result;
  }

  /**
   * Generate cache key for user-specific queries
   */
  userKey(userId, query, params = {}) {
    const paramString = Object.keys(params).length > 0 
      ? `:${JSON.stringify(params)}` 
      : '';
    return `user:${userId}:${query}${paramString}`;
  }

  /**
   * Generate cache key for global queries
   */
  globalKey(query, params = {}) {
    const paramString = Object.keys(params).length > 0 
      ? `:${JSON.stringify(params)}` 
      : '';
    return `global:${query}${paramString}`;
  }

  /**
   * Invalidate user queries
   */
  invalidateUser(userId) {
    return this.cacheManager.invalidatePattern(this.cacheName, `user:${userId}:.*`);
  }

  /**
   * Invalidate specific query pattern
   */
  invalidateQuery(pattern) {
    return this.cacheManager.invalidatePattern(this.cacheName, pattern);
  }
}

// Export singleton instances
export const cacheManager = new CacheManager();
export const cacheMiddleware = new CacheMiddleware(cacheManager);
export const queryCache = new QueryCache(cacheManager); 