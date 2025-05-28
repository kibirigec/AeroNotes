/**
 * Authentication Middleware
 * Handles user authentication using JWT tokens
 */

import { getAuthService } from '../../../../lib/services/index.js';
import { 
  AuthenticationError, 
  ValidationError,
  sendErrorResponse 
} from '../../../../lib/core/errors/index.js';

/**
 * Extract JWT token from request
 */
export const extractToken = (req) => {
  const authHeader = req.headers.get('authorization') || req.headers['authorization'];
  
  if (!authHeader) {
    throw new AuthenticationError('Authorization header missing');
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Invalid authorization header format. Use "Bearer <token>"');
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Extract user ID from request headers (legacy support)
 */
export const extractUserId = (req) => {
  // Legacy header-based approach - should be deprecated
  const userId = req.headers.get('x-user-id') || req.headers['x-user-id'];
  
  if (!userId) {
    throw new AuthenticationError('User ID not found in request');
  }
  
  return userId;
};

/**
 * JWT Authentication middleware
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    // Verify JWT token
    const authService = getAuthService();
    const verification = authService.verifyJWTToken(token);
    
    if (!verification.valid) {
      throw new AuthenticationError(`Invalid token: ${verification.error}`);
    }
    
    // Get user from token payload
    const userId = verification.payload.userId;
    const user = await authService.getUserById(userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    // Add user to request
    req.user = {
      id: user.id,
      phone: user.phone,
      tokenPayload: verification.payload,
    };
    
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/**
 * Legacy authentication middleware (for backward compatibility)
 * TODO: Remove once all clients migrate to JWT
 */
export const requireAuthLegacy = async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    
    // Verify user exists
    const authService = getAuthService();
    const user = await authService.getUserById(userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    // Add user to request
    req.user = {
      id: user.id,
      phone: user.phone,
    };
    
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/**
 * Optional JWT authentication middleware
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.get('authorization') || req.headers['authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const authService = getAuthService();
      const verification = authService.verifyJWTToken(token);
      
      if (verification.valid) {
        const userId = verification.payload.userId;
        const user = await authService.getUserById(userId);
        
        if (user) {
          req.user = {
            id: user.id,
            phone: user.phone,
            tokenPayload: verification.payload,
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}; 