/**
 * Notes API Routes
 * GET /api/notes - List user notes
 * POST /api/notes - Create new note
 */

import { getNotesService } from '../../../../lib/services/index.js';
import { 
  ValidationError,
  AuthenticationError,
  sendErrorResponse,
  asyncHandler 
} from '../../../../lib/core/errors/index.js';
import { requireAuth } from '../middleware/auth.js';
import { trackRequest } from '../../../../lib/core/monitoring/requestTracker.js';

export const GET = asyncHandler(async (req) => {
  try {
    // Track this request
    trackRequest('/api/notes', 'GET', 200);
    
    // Extract user from auth middleware (simplified for Next.js API routes)
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const url = new URL(req.url);
    const includeExpired = url.searchParams.get('includeExpired') === 'true';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    
    const notesService = getNotesService();
    const notes = await notesService.getUserNotes(userId, {
      includeExpired,
      page,
      limit,
    });
    
    return Response.json({
      success: true,
      data: {
        notes,
        pagination: {
          page,
          limit,
          total: notes.length,
        },
      },
    });
    
  } catch (error) {
    console.error('Get notes error:', error);
    
    // Track error
    trackRequest('/api/notes', 'GET', error.statusCode || 500);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
});

export const POST = asyncHandler(async (req) => {
  try {
    // Track this request
    trackRequest('/api/notes', 'POST', 201);
    
    // Extract user from auth middleware
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const { text, autoDelete = true, expiryHours = 1 } = await req.json();
    
    if (!text) {
      throw new ValidationError('Note text is required');
    }
    
    const notesService = getNotesService();
    const note = await notesService.createNote(userId, text, {
      autoDelete,
      expiryHours,
    });
    
    return Response.json({
      success: true,
      data: {
        note,
        message: 'Note created successfully',
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create note error:', error);
    
    // Track error
    trackRequest('/api/notes', 'POST', error.statusCode || 500);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}); 