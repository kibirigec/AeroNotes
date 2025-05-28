/**
 * User Logout API Route
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
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
    max: 20, // 20 logout attempts per window
  }
};

export async function POST(request) {
  // Apply security middleware
  const middlewareResult = await applySecurity(securityOptions)(request, NextResponse, () => {});
  if (middlewareResult instanceof Response) {
    return middlewareResult;
  }

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    let token = null;
    let sessionId = null;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Also check for session ID in cookies or body
    const cookies = request.headers.get('cookie');
    if (cookies) {
      const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('sessionId='));
      if (sessionCookie) {
        sessionId = sessionCookie.split('=')[1];
      }
    }

    // Try to get session ID from request body as fallback
    try {
      const body = await request.json();
      if (body.sessionId) {
        sessionId = body.sessionId;
      }
      if (body.refreshToken) {
        // Revoke refresh token if provided
        SessionService.revokeRefreshToken(body.refreshToken);
      }
    } catch (e) {
      // Body parsing failed, continue with other methods
    }

    // If we have a token, verify it and extract user info
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        
        // Blacklist the access token
        if (decoded.jti) {
          const expiresAt = decoded.exp * 1000; // Convert to milliseconds
          SessionService.blacklistToken(decoded.jti, expiresAt);
        }
      } catch (jwtError) {
        // Token is invalid, but we can still proceed with logout
        console.log('[AUTH] Invalid token during logout, proceeding anyway');
      }
    }

    // If we have a session ID, invalidate the session
    if (sessionId) {
      const session = SessionService.getSession(sessionId);
      if (session) {
        userId = session.userId;
        SessionService.invalidateSession(sessionId);
      }
    }

    // Log logout event
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (userId) {
      console.log(`[AUTH] User ${userId} logged out from IP ${ipAddress}`);
    } else {
      console.log(`[AUTH] Logout attempt from IP ${ipAddress} (no valid session)`);
    }

    // Return success response regardless of whether we found valid tokens/sessions
    // This prevents information leakage about valid sessions
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    }, { 
      status: 200,
      headers: {
        // Clear session cookie
        'Set-Cookie': 'sessionId=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      }
    });

  } catch (error) {
    // Log error but still return success to prevent information leakage
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    console.error(`[AUTH] Logout error from IP ${ipAddress}:`, error.message);
    
    // Return success even on error to prevent information disclosure
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    }, { 
      status: 200,
      headers: {
        'Set-Cookie': 'sessionId=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      }
    });
  }
} 