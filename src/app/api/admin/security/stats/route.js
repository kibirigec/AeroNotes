/**
 * Security Statistics API
 * Admin endpoint for monitoring security metrics
 */

import { NextResponse } from 'next/server';
import SessionService from '../../../../../../lib/services/auth/SessionService.js';
import { requireAdmin } from '../../../middleware/auth.js';
import { 
  ValidationError,
  AuthenticationError,
  sendErrorResponse 
} from '../../../../../../lib/core/errors/index.js';
import { applySecurity } from '../../../middleware/security.js';

// Apply security middleware
const securityOptions = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window for admin
  }
};

/**
 * GET /api/admin/security/stats
 * Get comprehensive security statistics
 */
export async function GET(request) {
  // Apply security middleware
  const middlewareResult = await applySecurity(securityOptions)(request, NextResponse, () => {});
  if (middlewareResult instanceof Response) {
    return middlewareResult;
  }

  // Apply admin authentication middleware
  const authMiddleware = requireAdmin();
  const authResult = await authMiddleware(request, NextResponse, () => {});
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    // Get session statistics
    const sessionStats = SessionService.getStats();
    
    // Get current timestamp for calculations
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate additional metrics
    const securityMetrics = {
      // Session metrics
      sessions: {
        total: sessionStats.totalSessions,
        active: sessionStats.activeSessions,
        inactive: sessionStats.totalSessions - sessionStats.activeSessions,
        uniqueUsers: sessionStats.totalUsers,
        averageSessionsPerUser: sessionStats.totalUsers > 0 ? 
          (sessionStats.activeSessions / sessionStats.totalUsers).toFixed(2) : 0
      },
      
      // Token metrics
      tokens: {
        blacklisted: sessionStats.blacklistedTokensCount,
        refreshTokens: sessionStats.refreshTokensCount
      },
      
      // Security events (placeholder - would be from audit logs)
      securityEvents: {
        failedLogins: await getFailedLoginCount(oneDayAgo),
        suspiciousActivity: await getSuspiciousActivityCount(oneDayAgo),
        blockedRequests: await getBlockedRequestCount(oneDayAgo)
      },
      
      // System health
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      },
      
      // Rate limiting stats (placeholder)
      rateLimiting: {
        totalRequests: await getTotalRequestCount(oneHourAgo),
        blockedRequests: await getBlockedRequestCount(oneHourAgo),
        topIPs: await getTopIPs(oneDayAgo)
      }
    };

    // Log admin access
    console.log(`[ADMIN] Security stats accessed by user ${request.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Security statistics retrieved successfully',
      data: {
        timestamp: now.toISOString(),
        metrics: securityMetrics
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[ADMIN] Error retrieving security stats:', error);
    return sendErrorResponse(NextResponse, error);
  }
}

/**
 * Helper functions for security metrics
 * In a real implementation, these would query audit logs or monitoring systems
 */

async function getFailedLoginCount(since) {
  // Placeholder - would query audit logs
  // For now, return a mock value
  return Math.floor(Math.random() * 50);
}

async function getSuspiciousActivityCount(since) {
  // Placeholder - would analyze patterns in audit logs
  return Math.floor(Math.random() * 10);
}

async function getBlockedRequestCount(since) {
  // Placeholder - would query rate limiter logs
  return Math.floor(Math.random() * 100);
}

async function getTotalRequestCount(since) {
  // Placeholder - would query access logs
  return Math.floor(Math.random() * 10000);
}

async function getTopIPs(since) {
  // Placeholder - would analyze access logs
  return [
    { ip: '192.168.1.100', requests: 150, blocked: 5 },
    { ip: '10.0.0.50', requests: 120, blocked: 2 },
    { ip: '172.16.0.25', requests: 95, blocked: 0 }
  ];
} 