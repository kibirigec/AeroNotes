/**
 * Document Download API Route
 * GET /api/documents/[id]/download - Download specific document
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get auth token from Authorization header or query parameter (for mobile form submissions)
    let token = null;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else {
      // Check for token in query parameters (mobile form submission)
      const url = new URL(request.url);
      token = url.searchParams.get('token');
    }
    
    if (!token) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Create authenticated supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return Response.json({ error: 'Invalid authentication' }, { status: 401 });
    }
    
    // Get file metadata from database
    const { data: fileRecord, error: fetchError } = await supabase
      .from('files')
      .select('file_path, bucket_id, file_name, content_type, user_id')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the file
      .single();
    
    if (fetchError || !fileRecord) {
      console.error('Error fetching file record:', fetchError);
      return Response.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(fileRecord.bucket_id)
      .download(fileRecord.file_path);
    
    if (downloadError) {
      console.error('Storage download error:', downloadError);
      return Response.json({ 
        error: 'File not available in storage',
        details: downloadError.message 
      }, { status: 404 });
    }
    
    // Convert to buffer
    const buffer = await fileData.arrayBuffer();
    
    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', fileRecord.content_type || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${fileRecord.file_name}"`);
    headers.set('Content-Length', buffer.byteLength.toString());
    headers.set('Cache-Control', 'no-cache');
    
    return new Response(buffer, {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('Download error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 