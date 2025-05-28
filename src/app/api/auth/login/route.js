/**
 * User Login API Route
 * POST /api/auth/login
 */

import { NextResponse } from 'next/server';
import AuthService from '../../../../../lib/services/auth/AuthService.js';
import DatabaseSessionService from '../../../../../lib/services/auth/DatabaseSessionService.js';
import { 
  ValidationError,
  AuthenticationError,
  sendErrorResponse 
} from '../../../../../lib/core/errors/index.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phoneNumber, phone, last4, pin, rememberMe = false } = body;

    // Support multiple input formats:
    // 1. phoneNumber + pin (full phone)
    // 2. phone + pin (full phone, alternative field name)
    // 3. last4 + pin (last 4 digits)
    const phoneInput = phoneNumber || phone || last4;

    // Validate required fields
    if (!phoneInput || !pin) {
      throw new ValidationError('Phone number (or last 4 digits) and PIN are required');
    }

    // Get client information for session
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown';

    // Authenticate user using phone/PIN
    const authResult = await AuthService.login(phoneInput, pin);
    
    if (!authResult.success) {
      // Log failed login attempt to audit logs
      await DatabaseSessionService.logAuditEvent(null, 'login_failed', 'auth', {
        phone: phoneInput,
        reason: authResult.message || 'Invalid credentials'
      }, ipAddress, userAgent, false);
      
      throw new AuthenticationError(authResult.message || 'Invalid credentials');
    }

    const { user, accessToken, refreshToken } = authResult;

    // Create session in database
    const session = await DatabaseSessionService.createSession(user.id, {
      ipAddress,
      userAgent,
      deviceInfo: {
        userAgent,
        ipAddress,
        loginTime: new Date()
      },
      rememberMe,
      accessToken,
      refreshToken
    });

    // Log successful login to audit logs
    await DatabaseSessionService.logAuditEvent(user.id, 'login_success', 'auth', {
      phone: phoneInput,
      session_id: session.sessionId
    }, ipAddress, userAgent, true);

    console.log(`[AUTH] Successful login for user ${user.id} from IP ${ipAddress}`);

    // Return success response with security headers
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          phone: phoneInput,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          isPinSet: user.isPinSet,
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
        'Set-Cookie': `sessionId=${session.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${rememberMe ? 2592000 : 604800}`, // 30 days or 7 days
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });

    return response;

  } catch (error) {
    // Log failed login attempt
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    console.log(`[SECURITY] Failed login attempt from IP ${ipAddress}: ${error.message}`);
    
    return sendErrorResponse(NextResponse, error);
  }
} 