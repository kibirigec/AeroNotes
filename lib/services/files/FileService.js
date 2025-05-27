/**
 * File Service
 * Handles file-specific business logic and metadata management
 * Extends StorageService functionality with additional features
 */

import { BaseService } from '../index.js';
import { getStorageService } from '../index.js';
import { BaseRepository } from '../../core/database/index.js';
import { 
  ValidationError, 
  NotFoundError,
  FileUploadError 
} from '../../core/errors/index.js';
import { getConfig } from '../../core/config/index.js';

/**
 * File metadata repository
 */
class FileMetadataRepository extends BaseRepository {
  constructor() {
    super('files');
  }

  async findByCategory(userId, category) {
    const result = await this.query()
      .selectForUser(userId)
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async findByTags(userId, tags) {
    const result = await this.query()
      .selectForUser(userId)
      .contains('tags', tags)
      .order('created_at', { ascending: false });
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async searchFiles(userId, searchTerm) {
    const result = await this.query()
      .selectForUser(userId)
      .or(`file_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async updateMetadata(fileId, userId, metadata) {
    const result = await this.query()
      .updateForUser(userId, fileId, {
        ...metadata,
        updated_at: new Date().toISOString(),
      });
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }
}

/**
 * File service
 */
export class FileService extends BaseService {
  constructor() {
    super('FileService');
    this.fileRepository = new FileMetadataRepository();
    this.config = getConfig();
  }

  async onInitialize() {
    // Get storage service dependency
    this.storageService = getStorageService();
    
    if (!this.storageService) {
      throw new Error('StorageService dependency not available');
    }
  }

  /**
   * Validate file metadata
   */
  validateFileMetadata(metadata) {
    if (metadata.category && typeof metadata.category !== 'string') {
      throw new ValidationError('Category must be a string', 'category');
    }
    
    if (metadata.tags && !Array.isArray(metadata.tags)) {
      throw new ValidationError('Tags must be an array', 'tags');
    }
    
    if (metadata.description && metadata.description.length > 500) {
      throw new ValidationError('Description cannot exceed 500 characters', 'description');
    }
  }

  /**
   * Determine bucket type from file type
   */
  getBucketType(fileType) {
    if (fileType.startsWith('image/')) {
      return 'images';
    }
    return 'documents';
  }

  /**
   * Extract file metadata
   */
  extractFileMetadata(file) {
    const isImage = file.type.startsWith('image/');
    const category = isImage ? 'image' : 'document';
    
    return {
      category,
      originalName: file.name,
      mimeType: file.type,
      isImage,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Upload file with enhanced metadata
   */
  async uploadFile(file, userId, options = {}) {
    const { 
      category, 
      tags = [], 
      description, 
      makePublic = false,
      ...storageOptions 
    } = options;
    
    // Validate metadata
    this.validateFileMetadata({ category, tags, description });
    
    // Determine bucket type
    const bucketType = this.getBucketType(file.type);
    
    // Extract file metadata
    const extractedMetadata = this.extractFileMetadata(file);
    
    // Prepare enhanced metadata
    const enhancedMetadata = {
      ...extractedMetadata,
      category: category || extractedMetadata.category,
      tags,
      description,
      isPublic: makePublic,
      ...storageOptions.metadata,
    };
    
    // Upload using storage service
    const uploadedFile = await this.storageService.uploadFile(
      file, 
      userId, 
      bucketType,
      {
        ...storageOptions,
        metadata: enhancedMetadata,
      }
    );
    
    // Update file record with enhanced metadata
    await this.fileRepository.updateMetadata(uploadedFile.id, userId, {
      category: enhancedMetadata.category,
      tags: enhancedMetadata.tags,
      description: enhancedMetadata.description,
      is_public: enhancedMetadata.isPublic,
      metadata: enhancedMetadata,
    });
    
    return {
      ...uploadedFile,
      category: enhancedMetadata.category,
      tags: enhancedMetadata.tags,
      description: enhancedMetadata.description,
      isPublic: enhancedMetadata.isPublic,
    };
  }

  /**
   * Get file with enhanced metadata
   */
  async getFile(fileId, userId) {
    const file = await this.storageService.getFile(fileId, userId);
    
    return {
      ...file,
      category: file.metadata?.category,
      tags: file.metadata?.tags || [],
      description: file.metadata?.description,
      isPublic: file.metadata?.isPublic || false,
    };
  }

  /**
   * Get files by category
   */
  async getFilesByCategory(userId, category, options = {}) {
    const files = await this.fileRepository.findByCategory(userId, category);
    
    return files.map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileSize: file.file_size,
      fileType: file.file_type,
      publicUrl: file.public_url,
      category: file.category,
      tags: file.tags || [],
      description: file.description,
      isPublic: file.is_public || false,
      uploadedAt: file.created_at,
      updatedAt: file.updated_at,
    }));
  }

  /**
   * Get files by tags
   */
  async getFilesByTags(userId, tags) {
    const files = await this.fileRepository.findByTags(userId, tags);
    
    return files.map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileSize: file.file_size,
      fileType: file.file_type,
      publicUrl: file.public_url,
      category: file.category,
      tags: file.tags || [],
      description: file.description,
      isPublic: file.is_public || false,
      uploadedAt: file.created_at,
      updatedAt: file.updated_at,
    }));
  }

  /**
   * Search files
   */
  async searchFiles(userId, searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters', 'searchTerm');
    }
    
    const files = await this.fileRepository.searchFiles(userId, searchTerm.trim());
    
    return files.map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileSize: file.file_size,
      fileType: file.file_type,
      publicUrl: file.public_url,
      category: file.category,
      tags: file.tags || [],
      description: file.description,
      isPublic: file.is_public || false,
      uploadedAt: file.created_at,
      updatedAt: file.updated_at,
    }));
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(fileId, userId, updates) {
    const { category, tags, description, isPublic } = updates;
    
    this.validateFileMetadata({ category, tags, description });
    
    const updatedFile = await this.fileRepository.updateMetadata(fileId, userId, {
      category,
      tags,
      description,
      is_public: isPublic,
    });
    
    return {
      id: updatedFile.id,
      fileName: updatedFile.file_name,
      category: updatedFile.category,
      tags: updatedFile.tags || [],
      description: updatedFile.description,
      isPublic: updatedFile.is_public || false,
      updatedAt: updatedFile.updated_at,
    };
  }

  /**
   * Get file categories for user
   */
  async getUserCategories(userId) {
    const files = await this.fileRepository.findAllForUser(userId);
    
    const categories = [...new Set(files.map(file => file.category).filter(Boolean))];
    
    const categoryCounts = categories.map(category => ({
      category,
      count: files.filter(file => file.category === category).length,
    }));
    
    return categoryCounts;
  }

  /**
   * Get file tags for user
   */
  async getUserTags(userId) {
    const files = await this.fileRepository.findAllForUser(userId);
    
    const allTags = files.reduce((tags, file) => {
      if (file.tags && Array.isArray(file.tags)) {
        tags.push(...file.tags);
      }
      return tags;
    }, []);
    
    const uniqueTags = [...new Set(allTags)];
    
    const tagCounts = uniqueTags.map(tag => ({
      tag,
      count: allTags.filter(t => t === tag).length,
    }));
    
    return tagCounts.sort((a, b) => b.count - a.count);
  }

  /**
   * Delete file (delegates to storage service)
   */
  async deleteFile(fileId, userId) {
    return await this.storageService.deleteFile(fileId, userId);
  }

  /**
   * Get user files (delegates to storage service with enhanced formatting)
   */
  async getUserFiles(userId, options = {}) {
    const files = await this.storageService.getUserFiles(userId, options);
    
    return files.map(file => ({
      ...file,
      category: file.metadata?.category,
      tags: file.metadata?.tags || [],
      description: file.metadata?.description,
      isPublic: file.metadata?.isPublic || false,
    }));
  }

  /**
   * Get storage usage (delegates to storage service)
   */
  async getStorageUsage(userId) {
    return await this.storageService.getStorageUsage(userId);
  }

  /**
   * Health check
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    try {
      // Check storage service dependency
      const storageHealth = await this.storageService.healthCheck();
      
      // Test database connection
      await this.fileRepository.query().query.select('count').limit(1);
      
      return {
        ...baseHealth,
        dependencies: {
          storage: storageHealth.status,
        },
        database: 'connected',
        features: {
          upload: true,
          metadata: true,
          search: true,
          categories: true,
          tags: true,
        },
      };
    } catch (error) {
      return {
        ...baseHealth,
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
} 