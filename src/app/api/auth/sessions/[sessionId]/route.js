/**
 * Individual Session Management API
 * Endpoint for managing a specific session
 */

import { NextResponse } from 'next/server';
import SessionService from '../../../../../../lib/services/auth/SessionService.js';
import { authenticate } from '../../../middleware/auth.js';
import { 
  ValidationError,
  AuthenticationError,
  sendErrorResponse 
} from '../../../../../../lib/core/errors/index.js';
import { applySecurity } from '../../../middleware/security.js';

// Apply security middleware
const securityOptions = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
  }
};

/**
 * DELETE /api/auth/sessions/[sessionId]
 * Revoke a specific session
 */
export async function DELETE(request, { params }) {
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
    const { sessionId } = params;
    const userId = request.user.id;
    const currentSessionId = request.session?.sessionId;

    // Validate session ID
    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    // Prevent users from revoking their current session via this endpoint
    if (sessionId === currentSessionId) {
      throw new ValidationError('Cannot revoke current session. Use logout endpoint instead.');
    }

    // Get the session to verify ownership
    const session = SessionService.getSession(sessionId);
    
    if (!session) {
      throw new ValidationError('Session not found or already expired');
    }

    // Verify the session belongs to the authenticated user
    if (session.userId !== userId) {
      throw new AuthenticationError('You can only revoke your own sessions');
    }

    // Revoke the session
    const success = SessionService.invalidateSession(sessionId);
    
    if (!success) {
      throw new ValidationError('Failed to revoke session');
    }

    // Log the action
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    console.log(`[SESSIONS] User ${userId} revoked session ${sessionId} from IP ${ipAddress}`);

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
      data: {
        revokedSessionId: sessionId,
        revokedAt: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[SESSIONS] Error revoking session:', error);
    return sendErrorResponse(NextResponse, error);
  }
}

/**
 * GET /api/auth/sessions/[sessionId]
 * Get details of a specific session
 */
export async function GET(request, { params }) {
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
    const { sessionId } = params;
    const userId = request.user.id;

    // Validate session ID
    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    // Get the session
    const session = SessionService.getSession(sessionId);
    
    if (!session) {
      throw new ValidationError('Session not found or expired');
    }

    // Verify the session belongs to the authenticated user
    if (session.userId !== userId) {
      throw new AuthenticationError('You can only view your own sessions');
    }

    // Format session for response
    const formattedSession = {
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
      isCurrent: session.sessionId === request.session?.sessionId,
      isActive: session.isActive
    };

    return NextResponse.json({
      success: true,
      message: 'Session details retrieved successfully',
      data: {
        session: formattedSession
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[SESSIONS] Error retrieving session:', error);
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