/**
 * User Profile API Routes
 * GET /api/user/profile - Get user profile
 * PUT /api/user/profile - Update user profile
 */

import { getUserService } from '../../../../../lib/services/index.js';
import { 
  ValidationError,
  AuthenticationError,
  sendErrorResponse,
  asyncHandler 
} from '../../../../../lib/core/errors/index.js';

export const GET = asyncHandler(async (req) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const userService = getUserService();
    const profile = await userService.getUserProfile(userId);
    
    return Response.json({
      success: true,
      data: { profile },
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
});

export const PUT = asyncHandler(async (req) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const body = await req.json();
    const { displayName, preferences, settings } = body;
    
    const userService = getUserService();
    const profile = await userService.updateUserProfile(userId, {
      displayName,
      preferences,
      settings,
    });
    
    return Response.json({
      success: true,
      data: {
        profile,
        message: 'Profile updated successfully',
      },
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}); 