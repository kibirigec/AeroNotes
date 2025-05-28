/**
 * Session Management API
 * Endpoints for managing user sessions
 */

import { NextResponse } from 'next/server';
import SessionService from '../../../../../lib/services/auth/SessionService.js';
import { authenticate } from '../../middleware/auth.js';
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
    max: 30, // 30 requests per window
  }
};

/**
 * GET /api/auth/sessions
 * Get all active sessions for the authenticated user
 */
export async function GET(request) {
  // Apply security middleware
  const middlewareResult = await applySecurity(securityOptions)(request, NextResponse, () => {});
  if (middlewareResult instanceof Response) {
    return middlewareResult;
  }

  // Apply authentication middleware
  const authMiddleware = authenticate({ required: true, validateSession: true });
  const authResult = await authMiddleware(request, NextResponse, () => {});
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const userId = request.user.id;
    
    // Get all active sessions for the user
    const sessions = SessionService.getUserSessions(userId);
    
    // Format sessions for response (remove sensitive data)
    const formattedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceInfo: {
        browser: extractBrowserInfo(session.userAgent),
        os: extractOSInfo(session.userAgent),
        device: extractDeviceInfo(session.userAgent)
      },
      isCurrent: session.sessionId === request.session?.sessionId
    }));

    return NextResponse.json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: {
        sessions: formattedSessions,
        total: formattedSessions.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[SESSIONS] Error retrieving sessions:', error);
    return sendErrorResponse(NextResponse, error);
  }
}

/**
 * DELETE /api/auth/sessions
 * Revoke all sessions except the current one
 */
export async function DELETE(request) {
  // Apply security middleware
  const middlewareResult = await applySecurity(securityOptions)(request, NextResponse, () => {});
  if (middlewareResult instanceof Response) {
    return middlewareResult;
  }

  // Apply authentication middleware
  const authMiddleware = authenticate({ required: true, validateSession: true });
  const authResult = await authMiddleware(request, NextResponse, () => {});
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const userId = request.user.id;
    const currentSessionId = request.session?.sessionId;
    
    // Invalidate all sessions except the current one
    const revokedCount = SessionService.invalidateUserSessions(userId, currentSessionId);
    
    // Log the action
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    console.log(`[SESSIONS] User ${userId} revoked ${revokedCount} sessions from IP ${ipAddress}`);

    return NextResponse.json({
      success: true,
      message: `Successfully revoked ${revokedCount} sessions`,
      data: {
        revokedCount,
        currentSessionId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[SESSIONS] Error revoking sessions:', error);
    return sendErrorResponse(NextResponse, error);
  }
}

/**
 * Helper functions for parsing user agent
 */
function extractBrowserInfo(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
}

function extractOSInfo(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  
  return 'Unknown';
}

function extractDeviceInfo(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  
  return 'Desktop';
} 