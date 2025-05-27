/**
 * Storage Configuration
 */

export const createStorageConfig = () => {
  return {
    // Bucket configuration
    buckets: {
      images: {
        name: 'images',
        public: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp',
          'image/svg+xml'
        ],
        quality: {
          compression: 0.8,
          maxWidth: 2048,
          maxHeight: 2048,
        },
      },
      documents: {
        name: 'aeronotes-documents',
        public: true,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'application/rtf'
        ],
      },
    },
    
    // File organization
    organization: {
      userFolders: true,
      folderStructure: '{userId}/{timestamp}_{filename}',
      maxFilesPerUser: 1000,
      maxStoragePerUser: 5 * 1024 * 1024 * 1024, // 5GB
    },
    
    // Auto-delete configuration
    autoDelete: {
      enabled: true,
      defaultExpiry: {
        images: 30, // days
        documents: 90, // days
      },
      cleanupInterval: '0 2 * * *', // Daily at 2 AM
      gracePeriod: 7, // days before permanent deletion
    },
    
    // CDN and caching
    cdn: {
      enabled: process.env.NODE_ENV === 'production',
      cacheControl: 'public, max-age=31536000', // 1 year
      transformations: {
        images: {
          thumbnail: { width: 150, height: 150, quality: 80 },
          medium: { width: 800, height: 600, quality: 85 },
          large: { width: 1920, height: 1080, quality: 90 },
        },
      },
    },
    
    // Security policies
    security: {
      rls: {
        enabled: true,
        userIsolation: true,
      },
      virus: {
        scanning: process.env.NODE_ENV === 'production',
        quarantine: true,
      },
      encryption: {
        atRest: true,
        inTransit: true,
      },
    },
    
    // Upload configuration
    upload: {
      chunkSize: 1024 * 1024, // 1MB chunks
      maxConcurrent: 3,
      retryAttempts: 3,
      timeout: 30000, // 30 seconds
      progressCallback: true,
    },
    
    // Metadata
    metadata: {
      extractExif: true,
      generateThumbnails: true,
      indexContent: false, // For search functionality
      trackVersions: false,
    },
  };
}; 