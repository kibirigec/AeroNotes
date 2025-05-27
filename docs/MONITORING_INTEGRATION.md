# AeroNotes Monitoring Integration Guide

This guide explains how to integrate and use the comprehensive monitoring system in AeroNotes.

## 🏗️ Architecture Overview

The monitoring system consists of several key components:

- **Logger**: Structured logging with different levels
- **MetricsCollector**: Collects counters, gauges, and histograms
- **PerformanceMonitor**: Tracks operation performance and timing
- **HealthMonitor**: Monitors system health and alerts
- **CacheManager**: Provides caching with monitoring integration

## 📦 Installation & Setup

### 1. Import Monitoring Components

```javascript
// In your main application file (e.g., app.js or server.js)
import { 
  logger, 
  metricsCollector, 
  performanceMonitor, 
  healthMonitor 
} from './lib/core/monitoring/index.js';
import { rateLimiters } from './lib/core/security/rateLimiter.js';
import { cacheManager } from './lib/core/cache/index.js';
```

### 2. Initialize Monitoring Middleware

```javascript
// Add to your Express/Next.js middleware
app.use(performanceMonitor.createRequestMiddleware());
app.use(rateLimiters.general);
```

### 3. Register Health Checks

```javascript
// Register health checks for your services
healthMonitor.registerHealthCheck('database', async () => {
  try {
    // Test database connection
    await database.query('SELECT 1');
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
});

healthMonitor.registerHealthCheck('cache', async () => {
  try {
    await cacheManager.apiCache.set('health_check', 'ok', 10);
    const result = await cacheManager.apiCache.get('health_check');
    return { healthy: result === 'ok' };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
});

healthMonitor.registerHealthCheck('storage', async () => {
  try {
    // Test storage service
    const storageService = new StorageService();
    await storageService.healthCheck();
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
});
```

## 🔧 Service Integration

### 1. Update BaseService

```javascript
// lib/core/base/BaseService.js
import { logger, performanceMonitor, metricsCollector } from '../monitoring/index.js';

export class BaseService {
  constructor(options = {}) {
    this.serviceName = options.serviceName || this.constructor.name;
    this.logger = logger;
    this.metrics = metricsCollector;
    this.performance = performanceMonitor;
  }

  async executeOperation(operationName, fn, metadata = {}) {
    const operationId = `${this.serviceName}_${operationName}_${Date.now()}`;
    
    return await this.performance.measureAsync(
      operationId,
      fn,
      {
        service: this.serviceName,
        operation: operationName,
        ...metadata
      }
    );
  }

  logOperation(operation, success, duration, metadata = {}) {
    this.logger.logOperation(
      this.serviceName,
      operation,
      success,
      duration,
      metadata
    );
  }

  incrementCounter(name, labels = {}) {
    this.metrics.incrementCounter(name, {
      service: this.serviceName,
      ...labels
    });
  }
}
```

### 2. Update API Routes

```javascript
// Example: src/app/api/notes/route.js
import { 
  logger, 
  metricsCollector, 
  performanceMonitor 
} from '../../../../lib/core/monitoring/index.js';
import { cacheMiddleware } from '../../../../lib/core/cache/index.js';

export const GET = asyncHandler(async (request) => {
  const startTime = Date.now();
  
  try {
    // Your existing logic here
    const notes = await notesService.getUserNotes(userId, options);
    
    // Record success metrics
    metricsCollector.incrementCounter('notes_retrieved', {
      success: 'true',
      userId: userId
    });
    
    logger.info('Notes retrieved successfully', {
      userId,
      count: notes.length,
      duration: Date.now() - startTime
    });
    
    return NextResponse.json({
      success: true,
      data: notes
    });
    
  } catch (error) {
    // Record error metrics
    metricsCollector.incrementCounter('notes_retrieved', {
      success: 'false',
      error: error.constructor.name
    });
    
    logger.error('Failed to retrieve notes', {
      userId,
      error: error.message,
      duration: Date.now() - startTime
    });
    
    throw error;
  }
});
```

### 3. Service-Specific Monitoring

```javascript
// lib/services/notes/NotesService.js
export class NotesService extends BaseService {
  constructor() {
    super({ serviceName: 'NotesService' });
  }

  async createNote(userId, noteData) {
    return await this.executeOperation('createNote', async () => {
      // Validate input
      this.incrementCounter('note_creation_attempts');
      
      // Create note
      const note = await this.repository.create({
        userId,
        ...noteData,
        createdAt: new Date(),
      });
      
      // Record success
      this.incrementCounter('notes_created', { success: 'true' });
      
      // Cache the note
      await cacheManager.dbCache.set(
        `note:${note.id}`,
        note,
        300 // 5 minutes
      );
      
      return note;
    }, { userId, operation: 'create' });
  }

  async getUserNotes(userId, options = {}) {
    return await this.executeOperation('getUserNotes', async () => {
      const cacheKey = `user_notes:${userId}:${JSON.stringify(options)}`;
      
      // Try cache first
      let notes = await cacheManager.dbCache.get(cacheKey);
      if (notes) {
        this.incrementCounter('notes_cache_hits');
        return notes;
      }
      
      // Fetch from database
      this.incrementCounter('notes_cache_misses');
      notes = await this.repository.findByUserId(userId, options);
      
      // Cache results
      await cacheManager.dbCache.set(cacheKey, notes, 60);
      
      return notes;
    }, { userId, cached: false });
  }
}
```

## 📊 Monitoring Dashboard Integration

### 1. Add to Your React App

```jsx
// pages/admin/monitoring.jsx or components/AdminDashboard.jsx
import MonitoringDashboard from '../components/monitoring/MonitoringDashboard';

const AdminPage = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <MonitoringDashboard />
    </div>
  );
};
```

### 2. Protect the Monitoring Route

```javascript
// middleware/adminAuth.js
export const adminAuthMiddleware = (req, res, next) => {
  // Check if user is admin
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// Apply to monitoring routes
app.use('/api/monitoring', adminAuthMiddleware);
```

## 🚨 Alerting Setup

### 1. Configure Alert Thresholds

```javascript
// config/monitoring.js
export const monitoringConfig = {
  alerts: {
    errorRate: 0.05, // 5%
    responseTime: 5000, // 5 seconds
    memoryUsage: 0.9, // 90%
    diskUsage: 0.85, // 85%
    cacheHitRate: 0.8, // 80%
  },
  healthChecks: {
    interval: 60000, // 1 minute
    timeout: 30000, // 30 seconds
  },
  metrics: {
    retentionPeriod: 86400000, // 24 hours
    aggregationInterval: 300000, // 5 minutes
  }
};
```

### 2. Custom Alert Handlers

```javascript
// lib/core/monitoring/alertHandlers.js
export class AlertHandler {
  constructor() {
    this.handlers = new Map();
  }

  registerHandler(alertType, handler) {
    this.handlers.set(alertType, handler);
  }

  async handleAlert(alert) {
    const handler = this.handlers.get(alert.type);
    if (handler) {
      await handler(alert);
    } else {
      logger.warn('No handler for alert type', { alertType: alert.type });
    }
  }
}

// Register alert handlers
const alertHandler = new AlertHandler();

alertHandler.registerHandler('high_error_rate', async (alert) => {
  // Send email notification
  await emailService.sendAlert({
    to: 'admin@aeronotes.com',
    subject: 'High Error Rate Alert',
    body: alert.message
  });
});

alertHandler.registerHandler('high_memory_usage', async (alert) => {
  // Log critical alert
  logger.error('Critical memory usage alert', alert);
  
  // Trigger garbage collection
  if (global.gc) {
    global.gc();
  }
});
```

## 📈 Custom Metrics

### 1. Business Metrics

```javascript
// Track business-specific metrics
export class BusinessMetrics {
  static trackUserRegistration(success, method) {
    metricsCollector.incrementCounter('user_registrations', {
      success: success.toString(),
      method // 'phone', 'email', etc.
    });
  }

  static trackNoteCreation(userId, noteType) {
    metricsCollector.incrementCounter('notes_created', {
      noteType,
      userId
    });
  }

  static trackFileUpload(userId, fileSize, fileType) {
    metricsCollector.incrementCounter('files_uploaded', {
      fileType,
      userId
    });
    
    metricsCollector.recordHistogram('file_upload_size', {
      fileType
    }, fileSize);
  }

  static trackSearchQuery(userId, query, resultCount) {
    metricsCollector.incrementCounter('search_queries', {
      userId,
      hasResults: (resultCount > 0).toString()
    });
    
    metricsCollector.recordHistogram('search_results', {}, resultCount);
  }
}
```

### 2. Performance Tracking

```javascript
// Track specific performance metrics
export class PerformanceTracker {
  static async trackDatabaseQuery(queryType, fn) {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      metricsCollector.recordHistogram('database_query_duration', {
        queryType,
        success: 'true'
      }, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      metricsCollector.recordHistogram('database_query_duration', {
        queryType,
        success: 'false'
      }, duration);
      
      throw error;
    }
  }

  static trackCacheOperation(operation, hit) {
    metricsCollector.incrementCounter('cache_operations', {
      operation, // 'get', 'set', 'delete'
      hit: hit.toString()
    });
  }
}
```

## 🔍 Debugging & Troubleshooting

### 1. Enable Debug Logging

```javascript
// Set log level to debug
const logger = new Logger({ level: 'debug' });

// Or via environment variable
process.env.LOG_LEVEL = 'debug';
```

### 2. Monitor Specific Operations

```javascript
// Add detailed monitoring to specific operations
const monitoredOperation = async (operationName, fn) => {
  const operationId = `debug_${operationName}_${Date.now()}`;
  
  logger.debug(`Starting operation: ${operationName}`, { operationId });
  
  try {
    const result = await performanceMonitor.measureAsync(
      operationId,
      fn,
      { operation: operationName, debug: true }
    );
    
    logger.debug(`Operation completed: ${operationName}`, { 
      operationId,
      success: true 
    });
    
    return result;
  } catch (error) {
    logger.error(`Operation failed: ${operationName}`, {
      operationId,
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};
```

## 📋 Best Practices

### 1. Metric Naming Conventions

- Use snake_case for metric names
- Include units in metric names when applicable
- Use consistent labels across related metrics
- Avoid high-cardinality labels (like user IDs in labels)

### 2. Logging Guidelines

- Use appropriate log levels
- Include relevant context in log messages
- Avoid logging sensitive information
- Use structured logging with metadata

### 3. Performance Considerations

- Monitor the monitoring system itself
- Use sampling for high-frequency metrics
- Implement metric retention policies
- Consider using external monitoring services for production

### 4. Security

- Protect monitoring endpoints with authentication
- Sanitize log data to prevent injection attacks
- Use HTTPS for monitoring data transmission
- Implement proper access controls for monitoring data

## 🚀 Production Deployment

### 1. Environment Configuration

```javascript
// config/production.js
export const productionConfig = {
  monitoring: {
    enabled: true,
    logLevel: 'info',
    metricsRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
    healthCheckInterval: 30000, // 30 seconds
    alerting: {
      enabled: true,
      webhookUrl: process.env.ALERT_WEBHOOK_URL,
      emailNotifications: true
    }
  }
};
```

### 2. External Monitoring Integration

```javascript
// Integration with external services (Prometheus, Grafana, etc.)
export class PrometheusExporter {
  static exportMetrics() {
    const metrics = metricsCollector.getAllMetrics();
    
    // Convert to Prometheus format
    let output = '';
    
    // Export counters
    for (const [key, value] of Object.entries(metrics.counters)) {
      output += `# TYPE ${key} counter\n`;
      output += `${key} ${value}\n`;
    }
    
    // Export gauges
    for (const [key, gauge] of Object.entries(metrics.gauges)) {
      output += `# TYPE ${key} gauge\n`;
      output += `${key} ${gauge.value}\n`;
    }
    
    return output;
  }
}
```

This monitoring system provides comprehensive observability for your AeroNotes application, enabling you to track performance, detect issues, and maintain system health effectively. 