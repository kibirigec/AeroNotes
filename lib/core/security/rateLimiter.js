/**
 * Rate Limiting System
 * Provides configurable rate limiting for API endpoints
 */

import { getConfig } from '../config/index.js';
import { RateLimitError } from '../errors/index.js';

/**
 * In-memory rate limiter store
 * In production, this should use Redis or similar distributed cache
 */
class RateLimiterStore {
  constructor() {
    this.store = new Map();
    this.cleanup();
  }

  /**
   * Get current count for a key
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return entry;
  }

  /**
   * Increment count for a key
   */
  increment(key, windowMs) {
    const now = Date.now();
    const entry = this.get(key);
    
    if (!entry) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
        firstHit: now,
      });
      return 1;
    }
    
    entry.count++;
    return entry.count;
  }

  /**
   * Reset count for a key
   */
  reset(key) {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Get all entries (for debugging)
   */
  getAll() {
    return Array.from(this.store.entries());
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  constructor(options = {}) {
    this.store = new RateLimiterStore();
    this.config = getConfig();
    
    // Default options
    this.defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
      keyGenerator: (req) => req.ip || 'anonymous',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options,
    };
  }

  /**
   * Create a rate limiter middleware
   */
  create(options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    return async (req, res, next) => {
      try {
        const key = opts.keyGenerator(req);
        const current = this.store.increment(key, opts.windowMs);
        
        // Add rate limit headers
        const entry = this.store.get(key);
        const remaining = Math.max(0, opts.max - current);
        const resetTime = entry ? Math.ceil(entry.resetTime / 1000) : Math.ceil((Date.now() + opts.windowMs) / 1000);
        
        if (res.setHeader) {
          res.setHeader('X-RateLimit-Limit', opts.max);
          res.setHeader('X-RateLimit-Remaining', remaining);
          res.setHeader('X-RateLimit-Reset', resetTime);
        }
        
        // Check if limit exceeded
        if (current > opts.max) {
          throw new RateLimitError(
            `Too many requests, please try again later. Limit: ${opts.max} requests per ${opts.windowMs / 1000 / 60} minutes`,
            {
              limit: opts.max,
              current,
              remaining: 0,
              resetTime,
            }
          );
        }
        
        next();
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw error;
        }
        console.error('Rate limiter error:', error);
        next(); // Continue on rate limiter errors
      }
    };
  }

  /**
   * Reset rate limit for a key
   */
  resetKey(key) {
    this.store.reset(key);
  }

  /**
   * Get current status for a key
   */
  getStatus(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return {
        count: 0,
        remaining: this.defaultOptions.max,
        resetTime: null,
      };
    }
    
    return {
      count: entry.count,
      remaining: Math.max(0, this.defaultOptions.max - entry.count),
      resetTime: entry.resetTime,
    };
  }
}

/**
 * Pre-configured rate limiters for different endpoint types
 */
export class EndpointRateLimiters {
  constructor() {
    this.limiter = new RateLimiter();
    this.config = getConfig();
  }

  /**
   * Authentication rate limiter
   */
  auth() {
    return this.limiter.create({
      windowMs: this.config.rateLimits.login.windowMs,
      max: this.config.rateLimits.login.maxAttempts,
      keyGenerator: (req) => {
        // Use phone number + IP for auth attempts
        const phoneNumber = req.body?.phoneNumber || 'unknown';
        const ip = req.ip || 'anonymous';
        return `auth:${phoneNumber}:${ip}`;
      },
      skipSuccessfulRequests: false, // Count all auth attempts
    });
  }

  /**
   * OTP rate limiter
   */
  otp() {
    return this.limiter.create({
      windowMs: this.config.rateLimits.otp.windowMs,
      max: this.config.rateLimits.otp.maxAttempts,
      keyGenerator: (req) => {
        const phoneNumber = req.body?.phoneNumber || req.query?.phoneNumber || 'unknown';
        return `otp:${phoneNumber}`;
      },
    });
  }

  /**
   * File upload rate limiter
   */
  fileUpload() {
    return this.limiter.create({
      windowMs: this.config.rateLimits.fileUpload.windowMs,
      max: this.config.rateLimits.fileUpload.maxFiles,
      keyGenerator: (req) => {
        const userId = req.headers['x-user-id'] || req.user?.id || 'anonymous';
        return `upload:${userId}`;
      },
    });
  }

  /**
   * API general rate limiter
   */
  api() {
    return this.limiter.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // 1000 requests per 15 minutes
      keyGenerator: (req) => {
        const userId = req.headers['x-user-id'] || req.user?.id;
        if (userId) {
          return `api:user:${userId}`;
        }
        return `api:ip:${req.ip || 'anonymous'}`;
      },
    });
  }

  /**
   * Notes creation rate limiter
   */
  notesCreation() {
    return this.limiter.create({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 10, // 10 notes per minute
      keyGenerator: (req) => {
        const userId = req.headers['x-user-id'] || req.user?.id || 'anonymous';
        return `notes:create:${userId}`;
      },
    });
  }

  /**
   * Search rate limiter
   */
  search() {
    return this.limiter.create({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // 60 searches per minute
      keyGenerator: (req) => {
        const userId = req.headers['x-user-id'] || req.user?.id || 'anonymous';
        return `search:${userId}`;
      },
    });
  }

  /**
   * Health check rate limiter (more lenient)
   */
  health() {
    return this.limiter.create({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 30, // 30 health checks per minute
      keyGenerator: (req) => `health:${req.ip || 'anonymous'}`,
    });
  }
}

/**
 * Adaptive rate limiter that adjusts based on system load
 */
export class AdaptiveRateLimiter {
  constructor() {
    this.baseLimiter = new RateLimiter();
    this.systemLoad = 0;
    this.responseTimeAvg = 0;
    this.monitoring = false;
    
    this.startMonitoring();
  }

  /**
   * Start system monitoring
   */
  startMonitoring() {
    if (this.monitoring) return;
    
    this.monitoring = true;
    setInterval(() => {
      this.updateSystemMetrics();
    }, 10000); // Update every 10 seconds
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics() {
    // Simple system load estimation
    // In production, use actual system metrics
    const memUsage = process.memoryUsage();
    const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
    
    this.systemLoad = heapUsedPercent;
  }

  /**
   * Calculate adaptive limit based on system load
   */
  getAdaptiveLimit(baseLimit) {
    if (this.systemLoad < 0.5) {
      return baseLimit; // Normal load
    } else if (this.systemLoad < 0.8) {
      return Math.floor(baseLimit * 0.7); // High load - reduce by 30%
    } else {
      return Math.floor(baseLimit * 0.4); // Very high load - reduce by 60%
    }
  }

  /**
   * Create adaptive rate limiter middleware
   */
  create(options = {}) {
    return async (req, res, next) => {
      const adaptiveMax = this.getAdaptiveLimit(options.max || 100);
      const adaptiveOptions = { ...options, max: adaptiveMax };
      
      const middleware = this.baseLimiter.create(adaptiveOptions);
      return middleware(req, res, next);
    };
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    return {
      load: this.systemLoad,
      responseTime: this.responseTimeAvg,
      status: this.systemLoad > 0.8 ? 'high-load' : this.systemLoad > 0.5 ? 'medium-load' : 'normal',
    };
  }
}

// Export singleton instances
export const rateLimiter = new RateLimiter();
export const endpointLimiters = new EndpointRateLimiters();
export const adaptiveLimiter = new AdaptiveRateLimiter(); 