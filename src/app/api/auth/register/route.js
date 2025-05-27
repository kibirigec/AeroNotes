/**
 * User Registration API Route
 * POST /api/auth/register
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
    const user = await authService.register(phoneNumber, pin);
    
    return Response.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          createdAt: user.createdAt,
        },
        message: 'User registered successfully',
      },
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    const errorResponse = sendErrorResponse(res, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}); 