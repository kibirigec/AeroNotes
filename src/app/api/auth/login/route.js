/**
 * User Login API Route
 * POST /api/auth/login
 */

import { getAuthService } from '../../../../../lib/services/index.js';
import { 
  ValidationError,
  sendErrorResponse,
  asyncHandler 
} from '../../../../../lib/core/errors/index.js';

export const POST = asyncHandler(async (req, res) => {
  try {
    const { phoneNumber, pin } = await req.json();
    
    if (!phoneNumber || !pin) {
      throw new ValidationError('Phone number and PIN are required');
    }
    
    const authService = getAuthService();
    const user = await authService.authenticate(phoneNumber, pin);
    
    // Generate JWT tokens
    const accessToken = authService.generateJWTToken(user);
    const refreshToken = authService.generateRefreshToken(user.id);
    
    return Response.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          lastSignInAt: user.lastSignInAt,
        },
        tokens: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: '7d',
        },
        message: 'Login successful',
      },
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    const errorResponse = sendErrorResponse(res, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}); 