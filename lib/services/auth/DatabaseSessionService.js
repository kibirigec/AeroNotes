/**
 * Database-Integrated Session Management Service
 * Writes to actual database tables: sessions, token_blacklist, audit_logs
 */

import supabaseAdmin from '../../supabaseAdmin.js';
import crypto from 'crypto';
import {
  ValidationError,
  AuthenticationError
} from '../../core/errors/index.js';

class DatabaseSessionService {
  constructor() {
    console.log('[DB_SESSION] Database session service initialized');
  }

  /**
   * Create a new session in the database
   */
  async createSession(userId, sessionData = {}) {
    try {
      const sessionId = this.generateSessionId();
      const now = new Date();
      
      // Create access and refresh token hashes for storage
      const accessTokenHash = sessionData.accessToken ? 
        crypto.createHash('sha256').update(sessionData.accessToken).digest('hex') : null;
      const refreshTokenHash = sessionData.refreshToken ? 
        crypto.createHash('sha256').update(sessionData.refreshToken).digest('hex') : null;

      const session = {
        id: sessionId,
        user_id: userId,
        access_token_hash: accessTokenHash,
        refresh_token_hash: refreshTokenHash,
        device_info: sessionData.deviceInfo || {},
        ip_address: sessionData.ipAddress || null,
        user_agent: sessionData.userAgent || null,
        is_active: true,
        expires_at: new Date(Date.now() + (sessionData.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
        created_at: now,
        updated_at: now
      };

      // Insert session into database
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .insert([session])
        .select('*')
        .single();

      if (error) {
        console.error('[DB_SESSION] Error creating session:', error);
        throw new ValidationError('Failed to create session');
      }

      // Log session creation to audit logs
      await this.logAuditEvent(userId, 'session_created', 'session', {
        session_id: sessionId,
        ip_address: sessionData.ipAddress,
        user_agent: sessionData.userAgent
      }, sessionData.ipAddress, sessionData.userAgent, true);

      console.log(`[DB_SESSION] Created session ${sessionId} for user ${userId}`);
      return {
        sessionId,
        ...data
      };
    } catch (error) {
      console.error('[DB_SESSION] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get session by ID from database
   */
  async getSession(sessionId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw error;
      }

      // Check if session is expired
      if (new Date() > new Date(data.expires_at)) {
        await this.invalidateSession(sessionId);
        return null;
      }

      // Update last activity
      await supabaseAdmin
        .from('sessions')
        .update({ updated_at: new Date() })
        .eq('id', sessionId);

      return data;
    } catch (error) {
      console.error('[DB_SESSION] Error getting session:', error);
      return null;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[DB_SESSION] Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Invalidate a specific session
   */
  async invalidateSession(sessionId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .update({ 
          is_active: false, 
          updated_at: new Date() 
        })
        .eq('id', sessionId)
        .select('user_id')
        .single();

      if (error) {
        console.error('[DB_SESSION] Error invalidating session:', error);
        return false;
      }

      // Log session invalidation
      if (data) {
        await this.logAuditEvent(data.user_id, 'session_invalidated', 'session', {
          session_id: sessionId
        }, null, null, true);
      }

      console.log(`[DB_SESSION] Invalidated session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('[DB_SESSION] Error invalidating session:', error);
      return false;
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateUserSessions(userId, exceptSessionId = null) {
    try {
      let query = supabaseAdmin
        .from('sessions')
        .update({ is_active: false, updated_at: new Date() })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (exceptSessionId) {
        query = query.neq('id', exceptSessionId);
      }

      const { data, error } = await query.select('id');

      if (error) {
        throw error;
      }

      const invalidatedCount = data ? data.length : 0;

      // Log bulk session invalidation
      await this.logAuditEvent(userId, 'sessions_bulk_invalidated', 'session', {
        invalidated_count: invalidatedCount,
        except_session: exceptSessionId
      }, null, null, true);

      console.log(`[DB_SESSION] Invalidated ${invalidatedCount} sessions for user ${userId}`);
      return invalidatedCount;
    } catch (error) {
      console.error('[DB_SESSION] Error invalidating user sessions:', error);
      return 0;
    }
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(token, tokenType, expiresAt) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const { error } = await supabaseAdmin
        .from('token_blacklist')
        .insert([{
          token_hash: tokenHash,
          token_type: tokenType,
          expires_at: expiresAt,
          blacklisted_at: new Date()
        }]);

      if (error) {
        console.error('[DB_SESSION] Error blacklisting token:', error);
        return false;
      }

      console.log(`[DB_SESSION] Blacklisted ${tokenType} token`);
      return true;
    } catch (error) {
      console.error('[DB_SESSION] Error blacklisting token:', error);
      return false;
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const { data, error } = await supabaseAdmin
        .from('token_blacklist')
        .select('id')
        .eq('token_hash', tokenHash)
        .gte('expires_at', new Date().toISOString())
        .limit(1);

      if (error) {
        console.error('[DB_SESSION] Error checking token blacklist:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('[DB_SESSION] Error checking token blacklist:', error);
      return false;
    }
  }

  /**
   * Log audit event to database
   */
  async logAuditEvent(userId, action, resource, details, ipAddress, userAgent, success) {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert([{
          user_id: userId,
          action,
          resource,
          details: details || {},
          ip_address: ipAddress,
          user_agent: userAgent,
          success,
          created_at: new Date()
        }]);

      if (error) {
        console.error('[DB_SESSION] Error logging audit event:', error);
      }
    } catch (error) {
      console.error('[DB_SESSION] Error logging audit event:', error);
    }
  }

  /**
   * Get session statistics
   */
  async getStats() {
    try {
      // Get active sessions count
      const { count: activeSessions } = await supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get total sessions count
      const { count: totalSessions } = await supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true });

      // Get blacklisted tokens count
      const { count: blacklistedTokens } = await supabaseAdmin
        .from('token_blacklist')
        .select('*', { count: 'exact', head: true })
        .gte('expires_at', new Date().toISOString());

      // Get unique users with active sessions
      const { data: uniqueUsers } = await supabaseAdmin
        .from('sessions')
        .select('user_id')
        .eq('is_active', true);

      const uniqueActiveUsers = uniqueUsers ? 
        new Set(uniqueUsers.map(s => s.user_id)).size : 0;

      return {
        activeSessions: activeSessions || 0,
        totalSessions: totalSessions || 0,
        blacklistedTokens: blacklistedTokens || 0,
        uniqueActiveUsers
      };
    } catch (error) {
      console.error('[DB_SESSION] Error getting stats:', error);
      return {
        activeSessions: 0,
        totalSessions: 0,
        blacklistedTokens: 0,
        uniqueActiveUsers: 0
      };
    }
  }

  /**
   * Cleanup expired sessions and tokens
   */
  async cleanup() {
    try {
      const now = new Date();

      // Remove expired sessions
      const { data: expiredSessions } = await supabaseAdmin
        .from('sessions')
        .delete()
        .lt('expires_at', now.toISOString())
        .select('id');

      // Remove expired blacklisted tokens
      const { data: expiredTokens } = await supabaseAdmin
        .from('token_blacklist')
        .delete()
        .lt('expires_at', now.toISOString())
        .select('id');

      const expiredSessionsCount = expiredSessions ? expiredSessions.length : 0;
      const expiredTokensCount = expiredTokens ? expiredTokens.length : 0;

      console.log(`[DB_SESSION] Cleanup: Removed ${expiredSessionsCount} expired sessions and ${expiredTokensCount} expired tokens`);

      return {
        expiredSessions: expiredSessionsCount,
        expiredTokens: expiredTokensCount
      };
    } catch (error) {
      console.error('[DB_SESSION] Error during cleanup:', error);
      return { expiredSessions: 0, expiredTokens: 0 };
    }
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    // Generate a UUID v4 compatible with PostgreSQL
    return crypto.randomUUID();
  }
}

// Export singleton instance
export default new DatabaseSessionService(); 