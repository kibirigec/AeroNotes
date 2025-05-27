/**
 * Individual File API Routes
 * GET /api/files/[id] - Get specific file
 * PUT /api/files/[id] - Update file metadata
 * DELETE /api/files/[id] - Delete file
 */

import { getFileService } from '../../../../../lib/services/index.js';
import { 
  ValidationError,
  NotFoundError,
  AuthenticationError,
  sendErrorResponse,
  asyncHandler 
} from '../../../../../lib/core/errors/index.js';

export const GET = asyncHandler(async (req, { params }) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const { id } = params;
    
    const fileService = getFileService();
    const file = await fileService.getFile(id, userId);
    
    return Response.json({
      success: true,
      data: { file },
    });
    
  } catch (error) {
    console.error('Get file error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
});

export const PUT = asyncHandler(async (req, { params }) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const { id } = params;
    const body = await req.json();
    
    const fileService = getFileService();
    
    // Handle different types of updates
    if (body.category || body.tags || body.description !== undefined || body.makePublic !== undefined) {
      // Update file metadata
      const metadata = {};
      if (body.category) metadata.category = body.category;
      if (body.tags) metadata.tags = body.tags;
      if (body.description !== undefined) metadata.description = body.description;
      if (body.makePublic !== undefined) metadata.makePublic = body.makePublic;
      
      const file = await fileService.updateFileMetadata(id, userId, metadata);
      
      return Response.json({
        success: true,
        data: {
          file,
          message: 'File metadata updated successfully',
        },
      });
    } else if (body.action === 'share') {
      // Generate shareable link
      const shareLink = await fileService.generateShareLink(id, userId, {
        expiresIn: body.expiresIn || 24, // hours
        allowDownload: body.allowDownload !== false,
      });
      
      return Response.json({
        success: true,
        data: {
          shareLink,
          message: 'Share link generated successfully',
        },
      });
    } else {
      throw new ValidationError('No valid update fields or action provided');
    }
    
  } catch (error) {
    console.error('Update file error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
});

export const DELETE = asyncHandler(async (req, { params }) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const { id } = params;
    
    const fileService = getFileService();
    await fileService.deleteFile(id, userId);
    
    return Response.json({
      success: true,
      data: {
        message: 'File deleted successfully',
      },
    });
    
  } catch (error) {
    console.error('Delete file error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}); 