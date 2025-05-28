/**
 * Session Management Service
 * Handles user sessions, token blacklisting, and session cleanup
 */

import { 
  ValidationError,
  AuthenticationError 
} from '../../core/errors/index.js';

class SessionService {
  constructor() {
    // In-memory storage for sessions and blacklisted tokens
    // In production, use Redis or a database
    this.activeSessions = new Map(); // userId -> Set of sessionIds
    this.sessionData = new Map(); // sessionId -> session data
    this.blacklistedTokens = new Set(); // Set of blacklisted token JTIs
    this.refreshTokens = new Map(); // refreshToken -> session data
    
    // Start cleanup interval
    this.startCleanupInterval();
  }
  
  /**
   * Create a new session
   */
  createSession(userId, sessionData = {}) {
    try {
      const sessionId = this.generateSessionId();
      const now = new Date();
      
      const session = {
        sessionId,
        userId,
        createdAt: now,
        lastActivity: now,
        ipAddress: sessionData.ipAddress || null,
        userAgent: sessionData.userAgent || null,
        deviceInfo: sessionData.deviceInfo || null,
        isActive: true,
        ...sessionData
      };
      
      // Store session data
      this.sessionData.set(sessionId, session);
      
      // Add to user's active sessions
      if (!this.activeSessions.has(userId)) {
        this.activeSessions.set(userId, new Set());
      }
      this.activeSessions.get(userId).add(sessionId);
      
      console.log(`[SESSION] Created session ${sessionId} for user ${userId}`);
      return session;
    } catch (error) {
      console.error('[SESSION] Error creating session:', error);
      throw new ValidationError('Failed to create session');
    }
  }
  
  /**
   * Get session by ID
   */
  getSession(sessionId) {
    const session = this.sessionData.get(sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }
    
    // Update last activity
    session.lastActivity = new Date();
    this.sessionData.set(sessionId, session);
    
    return session;
  }
  
  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId) {
    const sessionIds = this.activeSessions.get(userId);
    if (!sessionIds) {
      return [];
    }
    
    const sessions = [];
    for (const sessionId of sessionIds) {
      const session = this.sessionData.get(sessionId);
      if (session && session.isActive) {
        sessions.push(session);
      }
    }
    
    return sessions;
  }
  
  /**
   * Update session data
   */
  updateSession(sessionId, updates) {
    const session = this.sessionData.get(sessionId);
    if (!session) {
      throw new ValidationError('Session not found');
    }
    
    const updatedSession = {
      ...session,
      ...updates,
      lastActivity: new Date()
    };
    
    this.sessionData.set(sessionId, updatedSession);
    return updatedSession;
  }
  
  /**
   * Invalidate a specific session
   */
  invalidateSession(sessionId) {
    try {
      const session = this.sessionData.get(sessionId);
      if (!session) {
        return false;
      }
      
      // Mark session as inactive
      session.isActive = false;
      session.invalidatedAt = new Date();
      this.sessionData.set(sessionId, session);
      
      // Remove from active sessions
      const userSessions = this.activeSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.activeSessions.delete(session.userId);
        }
      }
      
      console.log(`[SESSION] Invalidated session ${sessionId} for user ${session.userId}`);
      return true;
    } catch (error) {
      console.error('[SESSION] Error invalidating session:', error);
      return false;
    }
  }
  
  /**
   * Invalidate all sessions for a user
   */
  invalidateUserSessions(userId, exceptSessionId = null) {
    try {
      const sessionIds = this.activeSessions.get(userId);
      if (!sessionIds) {
        return 0;
      }
      
      let invalidatedCount = 0;
      for (const sessionId of [...sessionIds]) {
        if (sessionId !== exceptSessionId) {
          if (this.invalidateSession(sessionId)) {
            invalidatedCount++;
          }
        }
      }
      
      console.log(`[SESSION] Invalidated ${invalidatedCount} sessions for user ${userId}`);
      return invalidatedCount;
    } catch (error) {
      console.error('[SESSION] Error invalidating user sessions:', error);
      return 0;
    }
  }
  
  /**
   * Store refresh token
   */
  storeRefreshToken(refreshToken, sessionId, expiresAt) {
    this.refreshTokens.set(refreshToken, {
      sessionId,
      expiresAt,
      createdAt: new Date()
    });
  }
  
  /**
   * Validate refresh token
   */
  validateRefreshToken(refreshToken) {
    const tokenData = this.refreshTokens.get(refreshToken);
    if (!tokenData) {
      return null;
    }
    
    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      this.refreshTokens.delete(refreshToken);
      return null;
    }
    
    // Check if session is still active
    const session = this.getSession(tokenData.sessionId);
    if (!session) {
      this.refreshTokens.delete(refreshToken);
      return null;
    }
    
    return { ...tokenData, session };
  }
  
  /**
   * Revoke refresh token
   */
  revokeRefreshToken(refreshToken) {
    return this.refreshTokens.delete(refreshToken);
  }
  
  /**
   * Blacklist a JWT token
   */
  blacklistToken(jti, expiresAt) {
    this.blacklistedTokens.add(jti);
    
    // Schedule removal after expiration
    const ttl = expiresAt - Date.now();
    if (ttl > 0) {
      setTimeout(() => {
        this.blacklistedTokens.delete(jti);
      }, ttl);
    }
    
    console.log(`[SESSION] Blacklisted token ${jti}`);
  }
  
  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(jti) {
    return this.blacklistedTokens.has(jti);
  }
  
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2);
    return `sess_${timestamp}_${randomPart}`;
  }
  
  /**
   * Cleanup expired sessions and tokens
   */
  cleanup() {
    try {
      const now = new Date();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      let cleanedSessions = 0;
      let cleanedTokens = 0;
      
      // Clean up expired sessions
      for (const [sessionId, session] of this.sessionData.entries()) {
        const age = now - session.lastActivity;
        if (age > maxAge || !session.isActive) {
          this.sessionData.delete(sessionId);
          
          // Remove from user's active sessions
          const userSessions = this.activeSessions.get(session.userId);
          if (userSessions) {
            userSessions.delete(sessionId);
            if (userSessions.size === 0) {
              this.activeSessions.delete(session.userId);
            }
          }
          
          cleanedSessions++;
        }
      }
      
      // Clean up expired refresh tokens
      for (const [token, data] of this.refreshTokens.entries()) {
        if (now > data.expiresAt) {
          this.refreshTokens.delete(token);
          cleanedTokens++;
        }
      }
      
      if (cleanedSessions > 0 || cleanedTokens > 0) {
        console.log(`[SESSION] Cleanup: removed ${cleanedSessions} sessions and ${cleanedTokens} refresh tokens`);
      }
    } catch (error) {
      console.error('[SESSION] Error during cleanup:', error);
    }
  }
  
  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
    
    console.log('[SESSION] Started cleanup interval');
  }
  
  /**
   * Get session statistics
   */
  getStats() {
    const totalSessions = this.sessionData.size;
    const activeSessions = Array.from(this.sessionData.values())
      .filter(session => session.isActive).length;
    const totalUsers = this.activeSessions.size;
    const blacklistedTokensCount = this.blacklistedTokens.size;
    const refreshTokensCount = this.refreshTokens.size;
    
    return {
      totalSessions,
      activeSessions,
      totalUsers,
      blacklistedTokensCount,
      refreshTokensCount
    };
  }
  
  /**
   * Force cleanup (for testing or manual cleanup)
   */
  forceCleanup() {
    this.cleanup();
  }
}

// Export singleton instance
export default new SessionService(); 