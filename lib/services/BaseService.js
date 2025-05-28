/**
 * Base Service Class
 * Foundation for all application services
 */

import { getAppConfig } from '../core/config/index.js';

/**
 * Base service class
 */
export class BaseService {
  constructor(name) {
    this.name = name;
    this.config = getAppConfig();
    this.initialized = false;
  }

  /**
   * Initialize service
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log(`Initializing ${this.name} service...`);
    await this.onInitialize();
    this.initialized = true;
    console.log(`${this.name} service initialized`);
  }

  /**
   * Override in child classes
   */
  async onInitialize() {
    // Override in child classes
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      service: this.name,
      status: this.initialized ? 'healthy' : 'not_initialized',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      service: this.name,
      initialized: this.initialized,
      uptime: process.uptime(),
    };
  }
} 