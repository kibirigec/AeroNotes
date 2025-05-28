/**
 * Authentication Middleware
 * Enhanced with session management and token blacklisting
 */

import jwt from 'jsonwebtoken';
import SessionService from '../../../../lib/services/auth/SessionService.js';
import AuthService from '../../../../lib/services/auth/AuthService.js';
import { 
  AuthenticationError,
  ValidationError,
  sendErrorResponse 
} from '../../../../lib/core/errors/index.js';

/**
 * Extract JWT token from request headers
 */
export const extractToken = (request) => {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    throw new AuthenticationError('Authorization header missing');
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Invalid authorization header format');
  }
  
  const token = authHeader.substring(7);
  if (!token) {
    throw new AuthenticationError('Token missing from authorization header');
  }
  
  return token;
};

/**
 * Verify JWT token and check blacklist
 */
export const verifyToken = async (token) => {
  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is blacklisted
    if (decoded.jti && SessionService.isTokenBlacklisted(decoded.jti)) {
      throw new AuthenticationError('Token has been revoked');
    }
    
    // Verify token type
    if (decoded.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token');
    } else if (error instanceof AuthenticationError) {
      throw error;
    } else {
      throw new AuthenticationError('Token verification failed');
    }
  }
};

/**
 * Get user from token payload
 */
export const getUserFromToken = async (decoded) => {
  try {
    const user = await AuthService.getUserById(decoded.userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    if (!user.isActive) {
      throw new AuthenticationError('User account is deactivated');
    }
    
    return user;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Failed to retrieve user information');
  }
};

/**
 * Validate session if session ID is provided
 */
export const validateSession = (sessionId, userId) => {
  if (!sessionId) {
    return null; // Session validation is optional
  }
  
  const session = SessionService.getSession(sessionId);
  
  if (!session) {
    throw new AuthenticationError('Invalid session');
  }
  
  if (session.userId !== userId) {
    throw new AuthenticationError('Session user mismatch');
  }
  
  return session;
};

/**
 * Main authentication middleware
 */
export const authenticate = (options = {}) => {
  const {
    required = true,
    roles = [],
    permissions = [],
    validateSession: shouldValidateSession = false
  } = options;
  
  return async (request, response, next) => {
    try {
      // Extract token
      let token;
      try {
        token = extractToken(request);
      } catch (error) {
        if (!required) {
          // If authentication is optional and no token provided, continue
          return next();
        }
        throw error;
      }
      
      // Verify token
      const decoded = await verifyToken(token);
      
      // Get user information
      const user = await getUserFromToken(decoded);
      
      // Validate session if required
      let session = null;
      if (shouldValidateSession) {
        const sessionId = request.headers.get('x-session-id') || 
                         request.cookies?.sessionId;
        session = validateSession(sessionId, user.id);
      }
      
      // Check role-based access
      if (roles.length > 0 && !roles.includes(user.role)) {
        throw new AuthenticationError('Insufficient permissions - role required');
      }
      
      // Check permission-based access
      if (permissions.length > 0) {
        const userPermissions = user.permissions || [];
        const hasPermission = permissions.some(permission => 
          userPermissions.includes(permission)
        );
        
        if (!hasPermission) {
          throw new AuthenticationError('Insufficient permissions');
        }
      }
      
      // Add user and session to request
      request.user = user;
      request.session = session;
      request.tokenPayload = decoded;
      
      // Add user ID header for logging
      response.setHeader('X-User-ID', user.id);
      
      // Log successful authentication
      console.log(`[AUTH] Authenticated user ${user.id} for ${request.method} ${request.url}`);
      
      next();
      
    } catch (error) {
      // Log authentication failure
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      console.log(`[SECURITY] Authentication failed from IP ${ipAddress}: ${error.message}`);
      
      return sendErrorResponse(response, error);
    }
  };
};

/**
 * Middleware for optional authentication
 */
export const optionalAuth = (options = {}) => {
  return authenticate({ ...options, required: false });
};

/**
 * Middleware for admin-only routes
 */
export const requireAdmin = () => {
  return authenticate({ 
    required: true, 
    roles: ['admin', 'super_admin'],
    validateSession: true 
  });
};

/**
 * Middleware for user or admin routes
 */
export const requireUser = () => {
  return authenticate({ 
    required: true, 
    roles: ['user', 'admin', 'super_admin'],
    validateSession: true 
  });
};

/**
 * Middleware with specific permissions
 */
export const requirePermissions = (permissions) => {
  return authenticate({ 
    required: true, 
    permissions,
    validateSession: true 
  });
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 5, // 5 attempts per window
    keyGenerator = (req) => {
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown';
      return `auth:${ip}`;
    }
  } = options;
  
  // This would integrate with the rate limiter from security middleware
  // For now, return a placeholder
  return (req, res, next) => next();
};

/**
 * Logout all sessions for a user
 */
export const logoutAllSessions = async (userId, exceptSessionId = null) => {
  try {
    const count = SessionService.invalidateUserSessions(userId, exceptSessionId);
    console.log(`[AUTH] Logged out ${count} sessions for user ${userId}`);
    return count;
  } catch (error) {
    console.error('[AUTH] Error logging out all sessions:', error);
    return 0;
  }
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) {
    return false;
  }
  
  return user.permissions.includes(permission) || 
         user.role === 'admin' || 
         user.role === 'super_admin';
};

/**
 * Check if user has any of the specified roles
 */
export const hasRole = (user, roles) => {
  if (!user || !user.role) {
    return false;
  }
  
  return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
}; 
}; 