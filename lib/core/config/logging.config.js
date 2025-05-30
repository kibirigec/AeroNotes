/**
 * Logging Configuration
 * Controls logging behavior based on environment
 */

export const createLoggingConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || (env === 'production' ? 'error' : 'debug');
  
  return {
    enabled: {
      debug: env === 'development' || logLevel === 'debug',
      info: env === 'development' || ['debug', 'info'].includes(logLevel),
      warn: true,
      error: true,
      audit: true, // Always log audit events
      security: true, // Always log security events
    },
    
    // Console logging for development
    console: {
      enabled: env === 'development',
      colors: true,
      timestamps: true,
    },
    
    // File logging for production
    file: {
      enabled: env === 'production',
      path: process.env.LOG_FILE_PATH || './logs',
      maxSize: '10m',
      maxFiles: 5,
    },
    
    // External logging service
    external: {
      enabled: env === 'production' && !!process.env.LOG_SERVICE_URL,
      serviceUrl: process.env.LOG_SERVICE_URL,
      apiKey: process.env.LOG_SERVICE_API_KEY,
    },
  };
};

/**
 * Logger utility that respects environment settings
 */
class Logger {
  constructor() {
    this.config = createLoggingConfig();
  }
  
  debug(...args) {
    if (this.config.enabled.debug) {
      console.log('[DEBUG]', ...args);
    }
  }
  
  info(...args) {
    if (this.config.enabled.info) {
      console.log('[INFO]', ...args);
    }
  }
  
  warn(...args) {
    if (this.config.enabled.warn) {
      console.warn('[WARN]', ...args);
    }
  }
  
  error(...args) {
    if (this.config.enabled.error) {
      console.error('[ERROR]', ...args);
    }
  }
  
  audit(...args) {
    if (this.config.enabled.audit) {
      console.log('[AUDIT]', ...args);
    }
  }
  
  security(...args) {
    if (this.config.enabled.security) {
      console.log('[SECURITY]', ...args);
    }
  }
}

export const logger = new Logger();
export const getLoggingConfig = () => createLoggingConfig(); 