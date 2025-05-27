/**
 * Files API Routes
 * GET /api/files - List user files
 * POST /api/files - Upload new file
 */

import { getFileService } from '../../../../lib/services/index.js';
import { 
  ValidationError,
  AuthenticationError,
  FileUploadError,
  sendErrorResponse,
  asyncHandler 
} from '../../../../lib/core/errors/index.js';

export const GET = asyncHandler(async (req) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    
    const fileService = getFileService();
    let files;
    
    if (search) {
      files = await fileService.searchFiles(userId, search);
    } else if (category) {
      files = await fileService.getFilesByCategory(userId, category);
    } else if (tags && tags.length > 0) {
      files = await fileService.getFilesByTags(userId, tags);
    } else {
      files = await fileService.getUserFiles(userId, { page, limit });
    }
    
    return Response.json({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total: files.length,
        },
        filters: {
          category,
          tags,
          search,
        },
      },
    });
    
  } catch (error) {
    console.error('Get files error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
});

export const POST = asyncHandler(async (req) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const formData = await req.formData();
    const file = formData.get('file');
    const category = formData.get('category');
    const tags = formData.get('tags')?.split(',').filter(Boolean) || [];
    const description = formData.get('description');
    const makePublic = formData.get('makePublic') === 'true';
    
    if (!file) {
      throw new ValidationError('File is required');
    }
    
    if (!(file instanceof File)) {
      throw new ValidationError('Invalid file format');
    }
    
    const fileService = getFileService();
    const uploadedFile = await fileService.uploadFile(file, userId, {
      category,
      tags,
      description,
      makePublic,
    });
    
    return Response.json({
      success: true,
      data: {
        file: uploadedFile,
        message: 'File uploaded successfully',
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Upload file error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}); 