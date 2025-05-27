/**
 * Supabase Configuration
 */

export const createClientConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing required Supabase configuration. Please check your environment variables.');
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
    
    // Client options
    client: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    },
    
    // Storage configuration
    storage: {
      buckets: {
        images: 'images',
        documents: 'aeronotes-documents',
      },
      policies: {
        maxFileSize: {
          images: 50 * 1024 * 1024, // 50MB
          documents: 100 * 1024 * 1024, // 100MB
        },
        allowedTypes: {
          images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
          documents: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv'
          ],
        },
      },
    },
    
    // Database tables
    tables: {
      files: 'files',
      otpCodes: 'otp_codes',
      users: 'auth.users',
    },
    
    // RLS policies
    rls: {
      enabled: true,
      ownershipColumn: 'user_id',
    },
  };
}; 