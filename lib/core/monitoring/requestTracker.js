/**
 * Simple Request Tracker for Monitoring
 * Tracks API requests, errors, and basic metrics
 */

// Global metrics store
const globalMetrics = {
  requestCount: 0,
  errorCount: 0,
  startTime: Date.now(),
  endpoints: new Map(),
  recentRequests: [],
  maxRecentRequests: 100,
};

/**
 * Track an API request
 */
export const trackRequest = (endpoint, method = 'GET', statusCode = 200, category = 'api') => {
  globalMetrics.requestCount++;
  
  // Track by endpoint
  const endpointKey = `${method} ${endpoint}`;
  if (!globalMetrics.endpoints.has(endpointKey)) {
    globalMetrics.endpoints.set(endpointKey, { 
      count: 0, 
      errors: 0, 
      lastAccess: null,
      category: category 
    });
  }
  
  const endpointStats = globalMetrics.endpoints.get(endpointKey);
  endpointStats.count++;
  endpointStats.lastAccess = Date.now();
  
  // Track errors (5xx status codes)
  if (statusCode >= 500) {
    globalMetrics.errorCount++;
    endpointStats.errors++;
  }
  
  // Keep recent requests for analysis
  globalMetrics.recentRequests.push({
    endpoint: endpointKey,
    statusCode,
    timestamp: Date.now(),
    category,
  });
  
  // Limit recent requests array size
  if (globalMetrics.recentRequests.length > globalMetrics.maxRecentRequests) {
    globalMetrics.recentRequests.shift();
  }
  
  return globalMetrics.requestCount;
};

/**
 * Track an error
 */
export const trackError = (endpoint, method = 'GET', errorCode = 500) => {
  return trackRequest(endpoint, method, errorCode);
};

/**
 * Get current metrics
 */
export const getMetrics = () => {
  return {
    totalRequests: globalMetrics.requestCount,
    totalErrors: globalMetrics.errorCount,
    uptime: Date.now() - globalMetrics.startTime,
    startTime: globalMetrics.startTime,
    endpoints: Object.fromEntries(globalMetrics.endpoints),
    recentRequests: [...globalMetrics.recentRequests],
    errorRate: globalMetrics.requestCount > 0 ? globalMetrics.errorCount / globalMetrics.requestCount : 0,
  };
};

/**
 * Reset metrics
 */
export const resetMetrics = () => {
  globalMetrics.requestCount = 0;
  globalMetrics.errorCount = 0;
  globalMetrics.startTime = Date.now();
  globalMetrics.endpoints.clear();
  globalMetrics.recentRequests = [];
};

/**
 * Get metrics summary for monitoring dashboard
 */
export const getMetricsSummary = () => {
  const metrics = getMetrics();
  return {
    requests: metrics.totalRequests,
    errors: metrics.totalErrors,
    uptime: metrics.uptime,
    errorRate: metrics.errorRate,
    endpointCount: Object.keys(metrics.endpoints).length,
  };
}; 