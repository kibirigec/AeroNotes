/**
 * Authentication Middleware
 * Handles user authentication using the new service layer
 */

import { getAuthService } from '../../../../lib/services/index.js';
import { 
  AuthenticationError, 
  ValidationError,
  sendErrorResponse 
} from '../../../../lib/core/errors/index.js';

/**
 * Extract user ID from request headers or session
 */
export const extractUserId = (req) => {
  // For now, using a simple header-based approach
  // In production, this would validate JWT tokens or sessions
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    throw new AuthenticationError('User ID not found in request');
  }
  
  return userId;
};

/**
 * Authentication middleware
 */
export const requireAuth = async (req, res, next) => {
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
 * Optional authentication middleware
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (userId) {
      const authService = getAuthService();
      const user = await authService.getUserById(userId);
      
      if (user) {
        req.user = {
          id: user.id,
          phone: user.phone,
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}; 