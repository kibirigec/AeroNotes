/**
 * Security Middleware
 * Comprehensive security controls for API endpoints
 */

import { 
  ValidationError,
  AuthenticationError,
  sendErrorResponse 
} from '../../../../lib/core/errors/index.js';

/**
 * Request size validator
 */
export const validateRequestSize = (maxSize = 10 * 1024 * 1024) => { // 10MB default
  return async (req, res, next) => {
    try {
      const contentLength = req.headers.get('content-length');
      
      if (contentLength && parseInt(contentLength) > maxSize) {
        throw new ValidationError(`Request too large. Maximum size is ${maxSize} bytes`);
      }
      
      next();
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  };
};

/**
 * Content type validator
 */
export const validateContentType = (allowedTypes = ['application/json', 'multipart/form-data']) => {
  return async (req, res, next) => {
    try {
      const contentType = req.headers.get('content-type');
      
      if (req.method !== 'GET' && req.method !== 'DELETE') {
        if (!contentType) {
          throw new ValidationError('Content-Type header is required');
        }
        
        const isAllowed = allowedTypes.some(type => 
          contentType.toLowerCase().includes(type.toLowerCase())
        );
        
        if (!isAllowed) {
          throw new ValidationError(`Invalid content type. Allowed: ${allowedTypes.join(', ')}`);
        }
      }
      
      next();
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  };
};

/**
 * Input sanitizer
 */
export const sanitizeInput = () => {
  return async (req, res, next) => {
    try {
      // Sanitize common attack vectors
      const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        
        return str
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .replace(/data:text\/html/gi, ''); // Remove data URLs
      };
      
      const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
          } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
              typeof item === 'string' ? sanitizeString(item) : item
            );
          } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      // Apply sanitization to request body
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }
      
      next();
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  };
};

/**
 * Rate limiter with Redis-like functionality (using memory for now)
 */
class MemoryRateLimiter {
  constructor() {
    this.clients = new Map();
    this.cleanup();
  }
  
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.clients.entries()) {
        if (now > data.resetTime) {
          this.clients.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }
  
  check(identifier, limit, windowMs) {
    const now = Date.now();
    const data = this.clients.get(identifier);
    
    if (!data || now > data.resetTime) {
      this.clients.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      });
      return { allowed: true, remaining: limit - 1 };
    }
    
    if (data.count >= limit) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: data.resetTime
      };
    }
    
    data.count++;
    this.clients.set(identifier, data);
    
    return { 
      allowed: true, 
      remaining: limit - data.count 
    };
  }
}

const rateLimiter = new MemoryRateLimiter();

/**
 * Rate limiting middleware
 */
export const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // requests per window
    keyGenerator = (req) => {
      // Use IP address or user ID for rate limiting
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 req.ip || 
                 'unknown';
      const userId = req.headers.get('x-user-id');
      return userId ? `user:${userId}` : `ip:${ip}`;
    },
    skipSuccessfulRequests = false,
  } = options;
  
  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const result = rateLimiter.check(key, max, windowMs);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      
      if (result.resetTime) {
        res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      }
      
      if (!result.allowed) {
        const error = new ValidationError('Too many requests, please try again later');
        error.statusCode = 429;
        throw error;
      }
      
      next();
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = () => {
  return async (req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove potentially sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
  };
};

/**
 * CORS middleware
 */
export const corsMiddleware = () => {
  return async (req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = req.headers.get('origin');
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return Response.json({}, { status: 200 });
    }
    
    next();
  };
};

/**
 * Audit logging middleware
 */
export const auditLog = () => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const userId = req.headers.get('x-user-id') || 'anonymous';
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               req.ip || 
               'unknown';
    
    // Log request
    console.log(`[AUDIT] ${timestamp} - ${req.method} ${req.url} - User: ${userId} - IP: ${ip}`);
    
    // Override response methods to log responses
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode || 200;
      
      console.log(`[AUDIT] ${timestamp} - Response: ${statusCode} - Duration: ${duration}ms - User: ${userId}`);
      
      // Log security events
      if (statusCode === 401 || statusCode === 403) {
        console.log(`[SECURITY] Authentication/Authorization failure - User: ${userId} - IP: ${ip} - Endpoint: ${req.url}`);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Combined security middleware
 */
export const applySecurity = (options = {}) => {
  const middlewares = [
    securityHeaders(),
    corsMiddleware(),
    validateRequestSize(options.maxSize),
    validateContentType(options.allowedContentTypes),
    rateLimit(options.rateLimit),
    sanitizeInput(),
    auditLog(),
  ];
  
  return async (req, res, next) => {
    let index = 0;
    
    const runNext = async () => {
      if (index >= middlewares.length) {
        return next();
      }
      
      const middleware = middlewares[index++];
      await middleware(req, res, runNext);
    };
    
    await runNext();
  };
}; 