/**
 * Monitoring Alerts API Route
 * POST /api/monitoring/alerts - Get system alerts
 */

import { NextResponse } from 'next/server';
import { 
  healthMonitor, 
  logger 
} from '../../../../../lib/core/monitoring/index.js';

/**
 * POST /api/monitoring/alerts - Check for system alerts
 */
export const POST = async (request) => {
  try {
    const alerts = healthMonitor.checkAlerts();
    const health = await healthMonitor.getSystemHealth();
    
    // Log alert check
    logger.info('Alert check performed', {
      alertCount: alerts.length,
      systemStatus: health.status,
      timestamp: Date.now(),
    });
    
    return NextResponse.json({
      success: true,
      data: {
        alerts,
        systemStatus: health.status,
        healthPercentage: health.healthPercentage,
        timestamp: Date.now(),
      },
    });
    
  } catch (error) {
    logger.error('Alert check error', {
      error: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json({
      success: false,
      error: {
        message: error.message || 'Failed to check alerts',
        code: 'ALERT_ERROR',
      },
    }, { status: 500 });
  }
}; 