/**
 * Centralized Database Layer
 * Provides connection management, query builders, and transaction support
 */

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../config/index.js';
import { DatabaseError, ValidationError } from '../errors/index.js';

/**
 * Database connection manager
 */
class DatabaseManager {
  constructor() {
    this.client = null;
    this.adminClient = null;
    this.config = getSupabaseConfig();
  }

  /**
   * Get standard client (user context)
   */
  getClient() {
    if (!this.client) {
      this.client = createClient(
        this.config.url,
        this.config.anonKey,
        this.config.client
      );
    }
    return this.client;
  }

  /**
   * Get admin client (service role)
   */
  getAdminClient() {
    if (!this.adminClient && this.config.serviceRoleKey) {
      this.adminClient = createClient(
        this.config.url,
        this.config.serviceRoleKey,
        {
          ...this.config.client,
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    }
    return this.adminClient;
  }

  /**
   * Execute query with error handling
   */
  async executeQuery(queryFn, options = {}) {
    const { useAdmin = false, throwOnError = true } = options;
    
    try {
      const client = useAdmin ? this.getAdminClient() : this.getClient();
      const result = await queryFn(client);
      
      if (result.error && throwOnError) {
        throw new DatabaseError(result.error.message, result.error);
      }
      
      return result;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Database operation failed', error);
    }
  }

  /**
   * Execute transaction
   */
  async executeTransaction(operations, options = {}) {
    const { useAdmin = false } = options;
    const client = useAdmin ? this.getAdminClient() : this.getClient();
    
    // Note: Supabase doesn't have explicit transactions in the client
    // This is a wrapper for multiple operations with rollback simulation
    const results = [];
    const rollbackOperations = [];
    
    try {
      for (const operation of operations) {
        const result = await operation(client);
        if (result.error) {
          throw new DatabaseError(result.error.message, result.error);
        }
        results.push(result);
        
        // Store rollback operation if provided
        if (operation.rollback) {
          rollbackOperations.unshift(operation.rollback);
        }
      }
      
      return results;
    } catch (error) {
      // Attempt to rollback
      for (const rollback of rollbackOperations) {
        try {
          await rollback(client);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      
      throw error;
    }
  }
}

/**
 * Query builder for common operations
 */
export class QueryBuilder {
  constructor(table, client) {
    this.table = table;
    this.client = client;
    this.query = client.from(table);
  }

  /**
   * Select with user isolation
   */
  selectForUser(userId, columns = '*') {
    return this.query
      .select(columns)
      .eq('user_id', userId);
  }

  /**
   * Insert with user context
   */
  insertForUser(userId, data) {
    return this.query
      .insert({ ...data, user_id: userId })
      .select();
  }

  /**
   * Update with user isolation
   */
  updateForUser(userId, id, data) {
    return this.query
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
  }

  /**
   * Delete with user isolation
   */
  deleteForUser(userId, id) {
    return this.query
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  }

  /**
   * Paginated query
   */
  paginate(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.query
      .range(offset, offset + limit - 1);
  }

  /**
   * Search query
   */
  search(column, term) {
    return this.query
      .ilike(column, `%${term}%`);
  }
}

/**
 * Repository base class
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = new DatabaseManager();
  }

  /**
   * Create query builder
   */
  query(useAdmin = false) {
    const client = useAdmin ? this.db.getAdminClient() : this.db.getClient();
    return new QueryBuilder(this.tableName, client);
  }

  /**
   * Find by ID with user context
   */
  async findById(id, userId) {
    const result = await this.query()
      .selectForUser(userId)
      .eq('id', id)
      .single();
    
    if (result.error) {
      if (result.error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  /**
   * Find all for user
   */
  async findAllForUser(userId, options = {}) {
    const { page, limit, orderBy = 'created_at', ascending = false } = options;
    
    let query = this.query().selectForUser(userId);
    
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }
    
    if (page && limit) {
      query = query.paginate(page, limit);
    }
    
    const result = await query;
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  /**
   * Create record
   */
  async create(data, userId) {
    const result = await this.query()
      .insertForUser(userId, data)
      .single();
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  /**
   * Update record
   */
  async update(id, data, userId) {
    const result = await this.query()
      .updateForUser(userId, id, data)
      .single();
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  /**
   * Delete record
   */
  async delete(id, userId) {
    const result = await this.query()
      .deleteForUser(userId, id);
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return true;
  }
}

// Singleton instance
const dbManager = new DatabaseManager();

export { dbManager as db };
export default DatabaseManager; 