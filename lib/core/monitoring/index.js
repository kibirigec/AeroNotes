/**
 * Comprehensive Monitoring & Logging System
 * Provides metrics collection, performance tracking, and system monitoring
 */

import { getConfig } from '../config/index.js';
import { cacheManager } from '../cache/index.js';

/**
 * Logger class with different log levels and formatting
 */
export class Logger {
  constructor(options = {}) {
    this.config = getConfig();
    this.level = options.level || 'info';
    this.serviceName = options.serviceName || 'AeroNotes';
    this.environment = this.config.env;
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    };
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logLevel = level.toUpperCase();
    
    return {
      timestamp,
      level: logLevel,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...meta,
    };
  }

  /**
   * Check if log level should be printed
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, meta);
      console.error(JSON.stringify(formatted));
    }
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, meta);
      console.warn(JSON.stringify(formatted));
    }
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, meta);
      console.info(JSON.stringify(formatted));
    }
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, meta);
      console.debug(JSON.stringify(formatted));
    }
  }

  /**
   * Log trace message
   */
  trace(message, meta = {}) {
    if (this.shouldLog('trace')) {
      const formatted = this.formatMessage('trace', message, meta);
      console.trace(JSON.stringify(formatted));
    }
  }

  /**
   * Log API request
   */
  logRequest(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.headers['x-user-id'] || req.user?.id,
    };

    if (res.statusCode >= 400) {
      this.error('API Request Failed', meta);
    } else {
      this.info('API Request', meta);
    }
  }

  /**
   * Log service operation
   */
  logOperation(serviceName, operation, success, duration, meta = {}) {
    const logMeta = {
      service: serviceName,
      operation,
      success,
      duration: `${duration}ms`,
      ...meta,
    };

    if (success) {
      this.info('Service Operation Completed', logMeta);
    } else {
      this.error('Service Operation Failed', logMeta);
    }
  }
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.counters = new Map();
    this.histograms = new Map();
    this.gauges = new Map();
    
    this.startTime = Date.now();
    this.startCollectingSystemMetrics();
  }

  /**
   * Increment counter
   */
  incrementCounter(name, labels = {}, value = 1) {
    const key = this.getMetricKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set gauge value
   */
  setGauge(name, labels = {}, value) {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Record histogram value
   */
  recordHistogram(name, labels = {}, value) {
    const key = this.getMetricKey(name, labels);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
      });
    }
    
    const histogram = this.histograms.get(key);
    histogram.values.push(value);
    histogram.count++;
    histogram.sum += value;
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);
    
    // Keep only last 1000 values
    if (histogram.values.length > 1000) {
      histogram.values = histogram.values.slice(-1000);
    }
  }

  /**
   * Generate metric key from name and labels
   */
  getMetricKey(name, labels) {
    const labelString = Object.keys(labels).length > 0 
      ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` 
      : '';
    return `${name}${labelString}`;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(histogram) {
    if (histogram.count === 0) return null;
    
    const sorted = [...histogram.values].sort((a, b) => a - b);
    const count = sorted.length;
    
    return {
      count: histogram.count,
      sum: histogram.sum,
      min: histogram.min,
      max: histogram.max,
      avg: histogram.sum / histogram.count,
      p50: sorted[Math.floor(count * 0.5)],
      p90: sorted[Math.floor(count * 0.9)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result = {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {},
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
    };

    // Process histograms
    for (const [key, histogram] of this.histograms.entries()) {
      result.histograms[key] = this.getHistogramStats(histogram);
    }

    return result;
  }

  /**
   * Start collecting system metrics
   */
  startCollectingSystemMetrics() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      
      // Memory metrics
      this.setGauge('system_memory_heap_used', {}, memUsage.heapUsed);
      this.setGauge('system_memory_heap_total', {}, memUsage.heapTotal);
      this.setGauge('system_memory_external', {}, memUsage.external);
      
      // CPU usage approximation
      const cpuUsage = process.cpuUsage();
      this.setGauge('system_cpu_user', {}, cpuUsage.user);
      this.setGauge('system_cpu_system', {}, cpuUsage.system);
      
      // Event loop lag (simplified)
      const start = process.hrtime();
      setImmediate(() => {
        const lag = process.hrtime(start);
        const lagMs = lag[0] * 1000 + lag[1] / 1e6;
        this.recordHistogram('system_event_loop_lag', {}, lagMs);
      });
      
    }, 30000); // Every 30 seconds
  }

  /**
   * Reset metrics
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

/**
 * Performance monitor for tracking request and operation performance
 */
export class PerformanceMonitor {
  constructor(metricsCollector, logger) {
    this.metrics = metricsCollector;
    this.logger = logger;
    this.activeOperations = new Map();
  }

  /**
   * Start timing an operation
   */
  startTimer(operationId, metadata = {}) {
    this.activeOperations.set(operationId, {
      startTime: Date.now(),
      startHrTime: process.hrtime(),
      metadata,
    });
  }

  /**
   * End timing an operation
   */
  endTimer(operationId, success = true, additionalMeta = {}) {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      this.logger.warn('Timer not found for operation', { operationId });
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - operation.startTime;
    
    // Clean up
    this.activeOperations.delete(operationId);
    
    // Record metrics
    const labels = {
      success: success.toString(),
      ...operation.metadata,
    };
    
    this.metrics.recordHistogram('operation_duration', labels, duration);
    this.metrics.incrementCounter('operations_total', labels);
    
    // Log operation
    this.logger.logOperation(
      operation.metadata.service || 'unknown',
      operation.metadata.operation || operationId,
      success,
      duration,
      additionalMeta
    );
    
    return duration;
  }

  /**
   * Measure async function execution
   */
  async measureAsync(operationId, fn, metadata = {}) {
    this.startTimer(operationId, metadata);
    
    try {
      const result = await fn();
      this.endTimer(operationId, true);
      return result;
    } catch (error) {
      this.endTimer(operationId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Create middleware for measuring HTTP requests
   */
  createRequestMiddleware() {
    return (req, res, next) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();
      
      // Add request ID to headers
      res.setHeader('X-Request-ID', requestId);
      
      // Start timing
      this.startTimer(requestId, {
        service: 'api',
        operation: 'http_request',
        method: req.method,
        route: req.route?.path || req.path,
      });
      
      // Override res.end to capture completion
      const originalEnd = res.end.bind(res);
      res.end = (...args) => {
        const duration = this.endTimer(requestId, res.statusCode < 400, {
          statusCode: res.statusCode,
          contentLength: res.getHeader('content-length'),
        });
        
        // Log request
        this.logger.logRequest(req, res, duration);
        
        // Record API-specific metrics
        this.metrics.incrementCounter('api_requests_total', {
          method: req.method,
          status: res.statusCode.toString(),
        });
        
        return originalEnd(...args);
      };
      
      next();
    };
  }
}

/**
 * Health monitor for tracking service health
 */
export class HealthMonitor {
  constructor(metricsCollector, logger) {
    this.metrics = metricsCollector;
    this.logger = logger;
    this.healthChecks = new Map();
    this.alertThresholds = {
      errorRate: 0.05, // 5% error rate
      responseTime: 5000, // 5 seconds
      memoryUsage: 0.9, // 90% memory usage
    };
  }

  /**
   * Register a health check
   */
  registerHealthCheck(name, checkFn, interval = 60000) {
    this.healthChecks.set(name, {
      checkFn,
      interval,
      lastCheck: null,
      status: 'unknown',
    });
    
    // Start periodic checking
    setInterval(async () => {
      await this.runHealthCheck(name);
    }, interval);
  }

  /**
   * Run a specific health check
   */
  async runHealthCheck(name) {
    const check = this.healthChecks.get(name);
    if (!check) return null;
    
    try {
      const startTime = Date.now();
      const result = await check.checkFn();
      const duration = Date.now() - startTime;
      
      check.lastCheck = Date.now();
      check.status = result.healthy ? 'healthy' : 'unhealthy';
      
      // Record metrics
      this.metrics.setGauge('health_check_status', { name }, result.healthy ? 1 : 0);
      this.metrics.recordHistogram('health_check_duration', { name }, duration);
      
      // Log if unhealthy
      if (!result.healthy) {
        this.logger.error('Health check failed', {
          check: name,
          error: result.error,
          duration,
        });
      }
      
      return result;
    } catch (error) {
      check.status = 'error';
      this.logger.error('Health check error', {
        check: name,
        error: error.message,
      });
      
      this.metrics.setGauge('health_check_status', { name }, 0);
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Run all health checks
   */
  async runAllHealthChecks() {
    const results = {};
    
    for (const name of this.healthChecks.keys()) {
      results[name] = await this.runHealthCheck(name);
    }
    
    return results;
  }

  /**
   * Get overall system health
   */
  async getSystemHealth() {
    const healthChecks = await this.runAllHealthChecks();
    const metrics = this.metrics.getAllMetrics();
    const cacheStats = cacheManager.getAllStats();
    
    // Calculate overall health
    const healthyChecks = Object.values(healthChecks).filter(r => r?.healthy).length;
    const totalChecks = Object.keys(healthChecks).length;
    const healthPercentage = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100;
    
    // Determine status
    let status = 'healthy';
    if (healthPercentage < 100) {
      status = healthPercentage > 50 ? 'degraded' : 'unhealthy';
    }
    
    return {
      status,
      healthPercentage,
      timestamp: Date.now(),
      uptime: metrics.uptime,
      checks: healthChecks,
      metrics: {
        requests: metrics.counters['api_requests_total'] || 0,
        errors: metrics.counters['api_requests_total{status="500"}'] || 0,
        memory: {
          used: metrics.gauges['system_memory_heap_used']?.value || 0,
          total: metrics.gauges['system_memory_heap_total']?.value || 0,
        },
      },
      cache: cacheStats,
    };
  }

  /**
   * Check for alerts
   */
  checkAlerts() {
    const alerts = [];
    const metrics = this.metrics.getAllMetrics();
    
    // Check error rate
    const totalRequests = metrics.counters['api_requests_total'] || 0;
    const errorRequests = Object.entries(metrics.counters)
      .filter(([key]) => key.includes('status="5'))
      .reduce((sum, [, value]) => sum + value, 0);
    
    if (totalRequests > 0) {
      const errorRate = errorRequests / totalRequests;
      if (errorRate > this.alertThresholds.errorRate) {
        alerts.push({
          type: 'high_error_rate',
          message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
          severity: 'warning',
        });
      }
    }
    
    // Check memory usage
    const memUsed = metrics.gauges['system_memory_heap_used']?.value || 0;
    const memTotal = metrics.gauges['system_memory_heap_total']?.value || 1;
    const memUsage = memUsed / memTotal;
    
    if (memUsage > this.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'high_memory_usage',
        message: `High memory usage: ${(memUsage * 100).toFixed(2)}%`,
        severity: 'critical',
      });
    }
    
    return alerts;
  }
}

// Export singleton instances
export const logger = new Logger();
export const metricsCollector = new MetricsCollector();
export const performanceMonitor = new PerformanceMonitor(metricsCollector, logger);
export const healthMonitor = new HealthMonitor(metricsCollector, logger); 