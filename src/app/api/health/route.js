/**
 * Health Check API Route
 * GET /api/health - Check system health
 */

import { 
  performHealthCheck,
  getServiceMetrics 
} from '../../../../lib/services/index.js';
import { 
  sendErrorResponse,
  asyncHandler 
} from '../../../../lib/core/errors/index.js';
import { trackRequest } from '../../../../lib/core/monitoring/requestTracker.js';

export const GET = asyncHandler(async (req) => {
  try {
    // Track this health check request
    trackRequest('/api/health', 'GET', 200);
    
    const url = new URL(req.url);
    const includeMetrics = url.searchParams.get('metrics') === 'true';
    
    // Perform health check on all services
    const healthStatus = await performHealthCheck();
    
    const response = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: healthStatus,
      },
    };
    
    // Include metrics if requested
    if (includeMetrics) {
      const metrics = await getServiceMetrics();
      response.data.metrics = metrics;
    }
    
    // Determine overall status
    const hasUnhealthyServices = Object.values(healthStatus).some(
      service => !service.healthy
    );
    
    if (hasUnhealthyServices) {
      response.data.status = 'degraded';
      trackRequest('/api/health', 'GET', 503); // Track as service unavailable
      return Response.json(response, { status: 503 });
    }
    
    return Response.json(response);
    
  } catch (error) {
    console.error('Health check error:', error);
    
    // Track this as an error
    trackRequest('/api/health', 'GET', 503);
    
    const errorResponse = sendErrorResponse(null, error);
    return Response.json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorResponse.message,
      },
    }, { status: 503 });
  }
}); 