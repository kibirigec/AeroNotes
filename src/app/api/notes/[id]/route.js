/**
 * Individual Note API Routes
 * GET /api/notes/[id] - Get specific note
 * PUT /api/notes/[id] - Update note
 * DELETE /api/notes/[id] - Delete note
 */

import { getNotesService } from '../../../../../lib/services/index.js';
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
    
    const notesService = getNotesService();
    const note = await notesService.getNote(id, userId);
    
    return Response.json({
      success: true,
      data: { note },
    });
    
  } catch (error) {
    console.error('Get note error:', error);
    
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
    
    const notesService = getNotesService();
    
    // Handle different types of updates
    if (body.text !== undefined) {
      // Update note text
      const note = await notesService.updateNote(id, userId, body.text);
      
      return Response.json({
        success: true,
        data: {
          note,
          message: 'Note updated successfully',
        },
      });
    } else if (body.autoDelete !== undefined) {
      // Toggle auto-delete
      const note = await notesService.toggleAutoDelete(id, userId, body.autoDelete);
      
      return Response.json({
        success: true,
        data: {
          note,
          message: 'Auto-delete setting updated',
        },
      });
    } else {
      throw new ValidationError('No valid update fields provided');
    }
    
  } catch (error) {
    console.error('Update note error:', error);
    
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
    
    const notesService = getNotesService();
    await notesService.deleteNote(id, userId);
    
    return Response.json({
      success: true,
      data: {
        message: 'Note deleted successfully',
      },
    });
    
  } catch (error) {
    console.error('Delete note error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}); 