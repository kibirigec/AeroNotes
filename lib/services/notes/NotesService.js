/**
 * Notes Service
 * Handles note creation, management, and auto-deletion
 */

import { BaseService } from '../index.js';
import { BaseRepository } from '../../core/database/index.js';
import { 
  ValidationError, 
  NotFoundError,
  ErrorHandler 
} from '../../core/errors/index.js';
import { getConfig } from '../../core/config/index.js';

/**
 * Notes repository
 */
class NotesRepository extends BaseRepository {
  constructor() {
    super('notes');
  }

  async findByUserId(userId, options = {}) {
    const { includeExpired = false, orderBy = 'created_at', ascending = false } = options;
    
    let query = this.query().selectForUser(userId);
    
    if (!includeExpired) {
      const now = new Date().toISOString();
      query = query.or(`expiry_date.is.null,expiry_date.gt.${now}`);
    }
    
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }
    
    const result = await query;
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async findExpiredNotes() {
    const now = new Date().toISOString();
    
    const result = await this.query(true)
      .query.select('*')
      .not('expiry_date', 'is', null)
      .lt('expiry_date', now);
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async updateAutoDelete(noteId, userId, autoDelete) {
    let expiryDate = null;
    if (autoDelete) {
      expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1); // Default 1 hour expiry
    }

    const result = await this.query()
      .updateForUser(userId, noteId, {
        autoDelete: autoDelete,
        expiry_date: expiryDate ? expiryDate.toISOString() : null,
        updated_at: new Date().toISOString(),
      });
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }
}

/**
 * Notes service
 */
export class NotesService extends BaseService {
  constructor() {
    super('NotesService');
    this.notesRepository = new NotesRepository();
    this.config = getConfig();
  }

  async onInitialize() {
    // Validate notes configuration
    if (!this.config.features.enableAutoDelete) {
      console.warn('Auto-delete feature is disabled');
    }
  }

  /**
   * Validate note text
   */
  validateNoteText(text) {
    if (!text || typeof text !== 'string') {
      throw new ValidationError('Note text is required', 'text');
    }
    
    if (text.trim().length === 0) {
      throw new ValidationError('Note text cannot be empty', 'text');
    }
    
    if (text.length > 10000) {
      throw new ValidationError('Note text cannot exceed 10,000 characters', 'text');
    }
  }

  /**
   * Create a new note
   */
  async createNote(userId, text, options = {}) {
    this.validateNoteText(text);
    
    const { autoDelete = true, expiryHours = 1 } = options;
    
    let expiryDate = null;
    if (autoDelete && this.config.features.enableAutoDelete) {
      expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + expiryHours);
    }
    
    const noteData = {
      text: text.trim(),
      autoDelete: autoDelete && this.config.features.enableAutoDelete,
      expiry_date: expiryDate ? expiryDate.toISOString() : null,
    };
    
    const note = await this.notesRepository.create(noteData, userId);
    
    return {
      id: note.id,
      text: note.text,
      autoDelete: note.autoDelete,
      expiryDate: note.expiry_date,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };
  }

  /**
   * Get all notes for user
   */
  async getUserNotes(userId, options = {}) {
    const notes = await this.notesRepository.findByUserId(userId, options);
    
    return notes.map(note => ({
      id: note.id,
      text: note.text,
      autoDelete: note.autoDelete,
      expiryDate: note.expiry_date,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      isExpired: note.expiry_date ? new Date(note.expiry_date) < new Date() : false,
    }));
  }

  /**
   * Get note by ID
   */
  async getNote(noteId, userId) {
    const note = await this.notesRepository.findById(noteId, userId);
    
    if (!note) {
      throw new NotFoundError('Note');
    }
    
    // Check if note is expired
    const isExpired = note.expiry_date ? new Date(note.expiry_date) < new Date() : false;
    
    if (isExpired) {
      throw new NotFoundError('Note (expired)');
    }
    
    return {
      id: note.id,
      text: note.text,
      autoDelete: note.autoDelete,
      expiryDate: note.expiry_date,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };
  }

  /**
   * Update note text
   */
  async updateNote(noteId, userId, text) {
    this.validateNoteText(text);
    
    const updatedNote = await this.notesRepository.update(noteId, {
      text: text.trim(),
      updated_at: new Date().toISOString(),
    }, userId);
    
    return {
      id: updatedNote.id,
      text: updatedNote.text,
      autoDelete: updatedNote.autoDelete,
      expiryDate: updatedNote.expiry_date,
      createdAt: updatedNote.created_at,
      updatedAt: updatedNote.updated_at,
    };
  }

  /**
   * Toggle auto-delete for a note
   */
  async toggleAutoDelete(noteId, userId, autoDelete) {
    const updatedNote = await this.notesRepository.updateAutoDelete(noteId, userId, autoDelete);
    
    return {
      id: updatedNote.id,
      text: updatedNote.text,
      autoDelete: updatedNote.autoDelete,
      expiryDate: updatedNote.expiry_date,
      updatedAt: updatedNote.updated_at,
    };
  }

  /**
   * Delete note
   */
  async deleteNote(noteId, userId) {
    const success = await this.notesRepository.delete(noteId, userId);
    
    if (!success) {
      throw new NotFoundError('Note');
    }
    
    return { success: true };
  }

  /**
   * Clean up expired notes
   */
  async cleanupExpiredNotes() {
    const expiredNotes = await this.notesRepository.findExpiredNotes();
    let deletedCount = 0;
    
    for (const note of expiredNotes) {
      try {
        await this.notesRepository.query(true)
          .query.delete()
          .eq('id', note.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete expired note ${note.id}:`, error);
      }
    }
    
    return {
      success: true,
      deletedCount,
      totalExpired: expiredNotes.length,
    };
  }

  /**
   * Get notes statistics for user
   */
  async getNotesStats(userId) {
    const allNotes = await this.notesRepository.findByUserId(userId, { includeExpired: true });
    
    const now = new Date();
    const stats = allNotes.reduce((acc, note) => {
      acc.total++;
      
      if (note.autoDelete) {
        acc.autoDelete++;
        
        if (note.expiry_date && new Date(note.expiry_date) < now) {
          acc.expired++;
        }
      }
      
      return acc;
    }, {
      total: 0,
      autoDelete: 0,
      expired: 0,
      permanent: 0,
    });
    
    stats.permanent = stats.total - stats.autoDelete;
    
    return stats;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    try {
      // Test database connection
      await this.notesRepository.query().query.select('count').limit(1);
      
      return {
        ...baseHealth,
        database: 'connected',
        features: {
          createNote: true,
          autoDelete: this.config.features.enableAutoDelete,
          cleanup: true,
        },
      };
    } catch (error) {
      return {
        ...baseHealth,
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
      };
    }
  }
} 