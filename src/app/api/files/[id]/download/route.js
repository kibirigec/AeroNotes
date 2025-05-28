/**
 * File Download API Route
 * GET /api/files/[id]/download - Download specific file
 */

import { getFileService } from '../../../../../../lib/services/index.js';
import { 
  NotFoundError,
  AuthenticationError,
  sendErrorResponse,
  asyncHandler 
} from '../../../../../../lib/core/errors/index.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET = asyncHandler(async (req, { params }) => {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }
    
    const { id } = params;
    
    // Get file metadata first
    const fileService = getFileService();
    const file = await fileService.getFile(id, userId);
    
    if (!file) {
      throw new NotFoundError('File');
    }
    
    // Create supabase client with service role for file access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Determine bucket name from file metadata
    let bucketName;
    if (file.fileType?.startsWith('image/')) {
      bucketName = 'images';
    } else {
      bucketName = 'aeronotes-documents';
    }
    
    // Download file from storage
    const { data: fileData, error } = await supabase.storage
      .from(bucketName)
      .download(file.filePath);
    
    if (error) {
      console.error('Storage download error:', error);
      throw new NotFoundError('File not available');
    }
    
    // Convert to buffer and stream
    const buffer = await fileData.arrayBuffer();
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', file.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${file.fileName}"`);
    headers.set('Content-Length', buffer.byteLength.toString());
    
    return new Response(buffer, {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('Download file error:', error);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}); 