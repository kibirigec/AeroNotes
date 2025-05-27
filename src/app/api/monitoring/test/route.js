/**
 * Monitoring Test API Route
 * GET /api/monitoring/test - Test monitoring system imports
 */

import { NextResponse } from 'next/server';

export const GET = async (request) => {
  try {
    // Test imports step by step
    const testResults = {
      timestamp: Date.now(),
      tests: {},
    };

    // Test logger import
    try {
      const { logger } = await import('../../../../../lib/core/monitoring/index.js');
      testResults.tests.logger = { status: 'ok', hasLogger: !!logger };
    } catch (error) {
      testResults.tests.logger = { status: 'error', error: error.message };
    }

    // Test metricsCollector import
    try {
      const { metricsCollector } = await import('../../../../../lib/core/monitoring/index.js');
      testResults.tests.metricsCollector = { 
        status: 'ok', 
        hasMetricsCollector: !!metricsCollector,
        canGetMetrics: !!metricsCollector?.getAllMetrics
      };
    } catch (error) {
      testResults.tests.metricsCollector = { status: 'error', error: error.message };
    }

    // Test healthMonitor import
    try {
      const { healthMonitor } = await import('../../../../../lib/core/monitoring/index.js');
      testResults.tests.healthMonitor = { 
        status: 'ok', 
        hasHealthMonitor: !!healthMonitor,
        canCheckAlerts: !!healthMonitor?.checkAlerts,
        canGetHealth: !!healthMonitor?.getSystemHealth
      };
    } catch (error) {
      testResults.tests.healthMonitor = { status: 'error', error: error.message };
    }

    // Test cacheManager import
    try {
      const { cacheManager } = await import('../../../../../lib/core/cache/index.js');
      testResults.tests.cacheManager = { 
        status: 'ok', 
        hasCacheManager: !!cacheManager,
        canGetStats: !!cacheManager?.getAllStats
      };
    } catch (error) {
      testResults.tests.cacheManager = { status: 'error', error: error.message };
    }

    return NextResponse.json({
      success: true,
      data: testResults,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: 'TEST_ERROR',
      },
    }, { status: 500 });
  }
}; 