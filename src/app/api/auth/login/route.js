/**
 * User Login API Route
 * POST /api/auth/login
 */

import { NextResponse } from 'next/server';
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
    max: 5, // 5 login attempts per window
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
    const { email, password, rememberMe = false } = body;

    // Validate required fields
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Get client information for session
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown';

    // Authenticate user
    const authResult = await AuthService.login(email, password);
    
    if (!authResult.success) {
      throw new AuthenticationError(authResult.message || 'Invalid credentials');
    }

    const { user, accessToken, refreshToken } = authResult;

    // Create session
    const session = SessionService.createSession(user.id, {
      ipAddress,
      userAgent,
      deviceInfo: {
        userAgent,
        ipAddress,
        loginTime: new Date()
      },
      rememberMe
    });

    // Store refresh token in session service
    const refreshTokenExpiry = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
    SessionService.storeRefreshToken(refreshToken, session.sessionId, refreshTokenExpiry);

    // Log successful login
    console.log(`[AUTH] Successful login for user ${user.id} from IP ${ipAddress}`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          role: user.role
        },
        accessToken,
        refreshToken,
        sessionId: session.sessionId,
        expiresIn: 3600 // 1 hour
      }
    }, { 
      status: 200,
      headers: {
        'Set-Cookie': `sessionId=${session.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${rememberMe ? 2592000 : 604800}` // 30 days or 7 days
      }
    });

  } catch (error) {
    // Log failed login attempt
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    console.log(`[SECURITY] Failed login attempt from IP ${ipAddress}: ${error.message}`);
    
    return sendErrorResponse(NextResponse, error);
  }
} 