/**
 * User Logout API Route
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server';
import DatabaseSessionService from '../../../../../lib/services/auth/DatabaseSessionService.js';
import { verifyJWT, extractTokenFromRequest } from '../../../../../lib/core/utils/jwt.js';
import { sendErrorResponse } from '../../../../../lib/core/errors/index.js';

export async function POST(request) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown';

    let userId = null;
    let sessionId = null;
    let accessToken = null;
    let refreshToken = null;

    try {
      // Try to extract and verify access token
      accessToken = extractTokenFromRequest(request);
      
      if (accessToken) {
        const decoded = verifyJWT(accessToken);
        userId = decoded.sub;
        sessionId = decoded.sessionId;
      }
    } catch (tokenError) {
      // If access token verification fails, try to get from legacy header
      const legacyUserId = request.headers.get('x-user-id');
      if (legacyUserId) {
        userId = legacyUserId;
      }
    }

    // Try to get refresh token from request body
    try {
      const body = await request.json();
      refreshToken = body.refreshToken;
    } catch (bodyError) {
      // No body or invalid JSON, continue without refresh token
    }

    // If we have a user ID, log the logout attempt
    if (userId) {
      await DatabaseSessionService.logAuditEvent(userId, 'logout_attempt', 'auth', {
        session_id: sessionId,
        has_access_token: !!accessToken,
        has_refresh_token: !!refreshToken
      }, ipAddress, userAgent, true);
    }

    // Blacklist the access token if present
    if (accessToken) {
      try {
        const decoded = verifyJWT(accessToken);
        const expiresAt = new Date(decoded.exp * 1000);
        await DatabaseSessionService.blacklistToken(accessToken, 'access', expiresAt);
        console.log(`[AUTH] Blacklisted access token for user ${userId}`);
      } catch (error) {
        console.error('[AUTH] Error blacklisting access token:', error);
      }
    }

    // Blacklist the refresh token if present
    if (refreshToken) {
      try {
        const decoded = verifyJWT(refreshToken, process.env.JWT_REFRESH_SECRET);
        const expiresAt = new Date(decoded.exp * 1000);
        await DatabaseSessionService.blacklistToken(refreshToken, 'refresh', expiresAt);
        console.log(`[AUTH] Blacklisted refresh token for user ${userId}`);
      } catch (error) {
        console.error('[AUTH] Error blacklisting refresh token:', error);
      }
    }

    // Invalidate the session if we have a session ID
    if (sessionId) {
      await DatabaseSessionService.invalidateSession(sessionId);
      console.log(`[AUTH] Invalidated session ${sessionId}`);
    }

    // Log successful logout
    if (userId) {
      await DatabaseSessionService.logAuditEvent(userId, 'logout_success', 'auth', {
        session_id: sessionId,
        tokens_blacklisted: {
          access_token: !!accessToken,
          refresh_token: !!refreshToken
        }
      }, ipAddress, userAgent, true);
      
      console.log(`[AUTH] User ${userId} logged out successfully from IP ${ipAddress}`);
    }

    // Always return success, even if there were errors
    // This prevents information leakage about session states
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { 
      status: 200,
      headers: {
        // Clear the session cookie
        'Set-Cookie': 'sessionId=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      }
    });

  } catch (error) {
    console.error('[AUTH] Error during logout:', error);
    
    // Always return success for logout, even on errors
    // This prevents information leakage about internal errors
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });
  }
} 