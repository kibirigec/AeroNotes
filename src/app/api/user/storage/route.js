/**
 * User Storage API Routes
 * GET /api/user/storage - Get storage usage statistics
 */

import { getStorageService } from '../../../../../lib/services/index.js';
import { 
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
    
    const storageService = getStorageService();
    const usage = await storageService.getStorageUsage(userId);
    
    return Response.json({
      success: true,
      data: { usage },
    });
    
  } catch (error) {
    console.error('Get storage usage error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}); 