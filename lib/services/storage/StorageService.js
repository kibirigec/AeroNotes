/**
 * Storage Service
 * Handles file uploads, storage management, and file operations
 */

import { BaseService } from '../index.js';
import { BaseRepository } from '../../core/database/index.js';
import { 
  StorageError, 
  FileUploadError, 
  ValidationError,
  NotFoundError,
  ErrorHandler 
} from '../../core/errors/index.js';
import { getStorageConfig, getSupabaseConfig } from '../../core/config/index.js';
import { db } from '../../core/database/index.js';

/**
 * File repository
 */
class FileRepository extends BaseRepository {
  constructor() {
    super('files');
  }

  async findByPath(filePath, userId) {
    const result = await this.query()
      .selectForUser(userId)
      .eq('file_path', filePath)
      .single();
    
    if (result.error && result.error.code !== 'PGRST116') {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async findExpiredFiles(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await this.query(true)
      .query.select('*')
      .lt('created_at', cutoffDate.toISOString());
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async updateFileMetadata(fileId, userId, metadata) {
    const result = await this.query()
      .updateForUser(userId, fileId, metadata);
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }
}

/**
 * Storage service
 */
export class StorageService extends BaseService {
  constructor() {
    super('StorageService');
    this.fileRepository = new FileRepository();
    this.storageConfig = getStorageConfig();
    this.supabaseConfig = getSupabaseConfig();
    this.client = null;
  }

  async onInitialize() {
    // Initialize Supabase client
    this.client = db.getClient();
    
    // Validate storage configuration
    if (!this.storageConfig.buckets.images.name || !this.storageConfig.buckets.documents.name) {
      throw new ConfigurationError('Storage buckets not configured');
    }
  }

  /**
   * Generate file path with user isolation
   */
  generateFilePath(userId, fileName, bucketType = 'documents') {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${userId}/${timestamp}_${sanitizedFileName}`;
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file, bucketType = 'documents') {
    const bucketConfig = this.storageConfig.buckets[bucketType];
    
    if (!bucketConfig) {
      throw new ValidationError(`Invalid bucket type: ${bucketType}`);
    }
    
    // Validate file size
    if (file.size > bucketConfig.maxFileSize) {
      throw new FileUploadError(
        `File size exceeds limit of ${Math.round(bucketConfig.maxFileSize / 1024 / 1024)}MB`,
        file.name,
        file.size
      );
    }
    
    // Validate MIME type
    if (!bucketConfig.allowedMimeTypes.includes(file.type)) {
      throw new FileUploadError(
        `File type ${file.type} is not allowed`,
        file.name
      );
    }
  }

  /**
   * Upload file to storage
   */
  async uploadFile(file, userId, bucketType = 'documents', options = {}) {
    try {
      // Validate file
      this.validateFileUpload(file, bucketType);
      
      // Generate file path
      const filePath = this.generateFilePath(userId, file.name, bucketType);
      const bucketName = this.storageConfig.buckets[bucketType].name;
      
      // Upload to Supabase Storage
      const { data, error } = await this.client.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: this.storageConfig.cdn.cacheControl,
          upsert: options.upsert || false,
        });
      
      if (error) {
        throw new StorageError(`Upload failed: ${error.message}`, 'upload');
      }
      
      // Get public URL
      const { data: urlData } = this.client.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      // Save file metadata to database
      const fileMetadata = {
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        bucket_name: bucketName,
        public_url: urlData.publicUrl,
        upload_status: 'completed',
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          bucketType,
          ...options.metadata,
        },
      };
      
      const savedFile = await this.fileRepository.create(fileMetadata, userId);
      
      return {
        id: savedFile.id,
        fileName: savedFile.file_name,
        filePath: savedFile.file_path,
        fileSize: savedFile.file_size,
        fileType: savedFile.file_type,
        publicUrl: savedFile.public_url,
        uploadedAt: savedFile.created_at,
      };
      
    } catch (error) {
      if (error instanceof FileUploadError || error instanceof ValidationError) {
        throw error;
      }
      throw new StorageError(`Upload failed: ${error.message}`, 'upload');
    }
  }

  /**
   * Get file by ID
   */
  async getFile(fileId, userId) {
    const file = await this.fileRepository.findById(fileId, userId);
    
    if (!file) {
      throw new NotFoundError('File');
    }
    
    return {
      id: file.id,
      fileName: file.file_name,
      filePath: file.file_path,
      fileSize: file.file_size,
      fileType: file.file_type,
      publicUrl: file.public_url,
      uploadedAt: file.created_at,
      metadata: file.metadata,
    };
  }

  /**
   * Get all files for user
   */
  async getUserFiles(userId, options = {}) {
    const files = await this.fileRepository.findAllForUser(userId, options);
    
    return files.map(file => ({
      id: file.id,
      fileName: file.file_name,
      filePath: file.file_path,
      fileSize: file.file_size,
      fileType: file.file_type,
      publicUrl: file.public_url,
      uploadedAt: file.created_at,
      metadata: file.metadata,
    }));
  }

  /**
   * Delete file
   */
  async deleteFile(fileId, userId) {
    // Get file metadata
    const file = await this.fileRepository.findById(fileId, userId);
    
    if (!file) {
      throw new NotFoundError('File');
    }
    
    try {
      // Delete from storage
      const { error } = await this.client.storage
        .from(file.bucket_name)
        .remove([file.file_path]);
      
      if (error) {
        console.error('Storage deletion error:', error);
        // Continue with database deletion even if storage deletion fails
      }
      
      // Delete from database
      await this.fileRepository.delete(fileId, userId);
      
      return { success: true };
      
    } catch (error) {
      throw new StorageError(`Delete failed: ${error.message}`, 'delete');
    }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(fileId, userId, metadata) {
    const updatedFile = await this.fileRepository.updateFileMetadata(fileId, userId, {
      metadata: {
        ...metadata,
        updatedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    });
    
    return {
      id: updatedFile.id,
      fileName: updatedFile.file_name,
      metadata: updatedFile.metadata,
    };
  }

  /**
   * Get storage usage for user
   */
  async getStorageUsage(userId) {
    const files = await this.fileRepository.findAllForUser(userId);
    
    const usage = files.reduce((acc, file) => {
      acc.totalFiles += 1;
      acc.totalSize += file.file_size;
      
      if (file.file_type.startsWith('image/')) {
        acc.images.count += 1;
        acc.images.size += file.file_size;
      } else {
        acc.documents.count += 1;
        acc.documents.size += file.file_size;
      }
      
      return acc;
    }, {
      totalFiles: 0,
      totalSize: 0,
      images: { count: 0, size: 0 },
      documents: { count: 0, size: 0 },
    });
    
    const maxStorage = this.storageConfig.organization.maxStoragePerUser;
    
    return {
      ...usage,
      maxStorage,
      usagePercentage: (usage.totalSize / maxStorage) * 100,
      remainingStorage: maxStorage - usage.totalSize,
    };
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles() {
    const { defaultExpiry } = this.storageConfig.autoDelete;
    
    try {
      // Get expired images
      const expiredImages = await this.fileRepository.findExpiredFiles(defaultExpiry.images);
      
      // Get expired documents
      const expiredDocuments = await this.fileRepository.findExpiredFiles(defaultExpiry.documents);
      
      const allExpiredFiles = [...expiredImages, ...expiredDocuments];
      let deletedCount = 0;
      
      for (const file of allExpiredFiles) {
        try {
          // Delete from storage
          await this.client.storage
            .from(file.bucket_name)
            .remove([file.file_path]);
          
          // Delete from database
          await this.fileRepository.query(true)
            .query.delete()
            .eq('id', file.id);
          
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete expired file ${file.id}:`, error);
        }
      }
      
      return {
        success: true,
        deletedCount,
        totalExpired: allExpiredFiles.length,
      };
      
    } catch (error) {
      throw new StorageError(`Cleanup failed: ${error.message}`, 'cleanup');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    try {
      // Test storage connection by listing buckets
      const { data, error } = await this.client.storage.listBuckets();
      
      if (error) {
        throw new Error(error.message);
      }
      
      const buckets = data.map(bucket => bucket.name);
      const requiredBuckets = [
        this.storageConfig.buckets.images.name,
        this.storageConfig.buckets.documents.name,
      ];
      
      const missingBuckets = requiredBuckets.filter(bucket => !buckets.includes(bucket));
      
      return {
        ...baseHealth,
        storage: 'connected',
        buckets: {
          available: buckets,
          required: requiredBuckets,
          missing: missingBuckets,
        },
        features: {
          upload: true,
          download: true,
          delete: true,
          cleanup: this.storageConfig.autoDelete.enabled,
        },
      };
      
    } catch (error) {
      return {
        ...baseHealth,
        status: 'unhealthy',
        storage: 'disconnected',
        error: error.message,
      };
    }
  }
} 