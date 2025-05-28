/**
 * Token Refresh API Route
 * POST /api/auth/refresh
 */

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import AuthService from '../../../../../lib/services/auth/AuthService.js';
import SessionService from '../../../../../lib/services/auth/SessionService.js';
import { 
  ValidationError,
  AuthenticationError,
  sendErrorResponse 
} from '../../../../../lib/core/errors/index.js';
import { applySecurity } from '../../middleware/security.js';

// Apply security middleware
const securityOptions = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 refresh attempts per window
  }
};

export async function POST(request) {
  // Apply security middleware
  const middlewareResult = await applySecurity(securityOptions)(request, NextResponse, () => {});
  if (middlewareResult instanceof Response) {
    return middlewareResult;
  }

  try {
    const body = await request.json();
    const { refreshToken } = body;

    // Validate refresh token presence
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Validate refresh token with session service
    const tokenData = SessionService.validateRefreshToken(refreshToken);
    if (!tokenData) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Verify JWT refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (jwtError) {
      // Remove invalid token from session service
      SessionService.revokeRefreshToken(refreshToken);
      throw new AuthenticationError('Invalid refresh token');
    }

    // Verify token type
    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    // Get user from AuthService
    const user = await AuthService.getUserById(decoded.userId);
    if (!user) {
      // Remove token for non-existent user
      SessionService.revokeRefreshToken(refreshToken);
      throw new AuthenticationError('User not found');
    }

    // Update session activity
    SessionService.updateSession(tokenData.sessionId, {
      lastRefresh: new Date()
    });

    // Generate new tokens
    const newAccessToken = AuthService.generateJWTToken(user);
    const newRefreshToken = AuthService.generateRefreshToken(user.id);

    // Store new refresh token and revoke old one
    SessionService.revokeRefreshToken(refreshToken);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    SessionService.storeRefreshToken(newRefreshToken, tokenData.sessionId, refreshTokenExpiry);

    // Log token refresh
    console.log(`[AUTH] Token refreshed for user ${user.id} in session ${tokenData.sessionId}`);

    // Return new tokens
    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          role: user.role
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionId: tokenData.sessionId,
        expiresIn: 3600 // 1 hour
      }
    }, { status: 200 });

  } catch (error) {
    // Log failed refresh attempt
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    console.log(`[SECURITY] Failed token refresh from IP ${ipAddress}: ${error.message}`);
    
    return sendErrorResponse(NextResponse, error);
  }
} 