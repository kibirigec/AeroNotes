/**
 * Service Layer Registry
 * Centralized access to all application services
 */

import { AuthService } from './auth/AuthService.js';
import { OTPService } from './otp/OTPService.js';
import { StorageService } from './storage/StorageService.js';
import { NotesService } from './notes/NotesService.js';
import { FileService } from './files/FileService.js';
import { UserService } from './user/UserService.js';
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

/**
 * Service registry
 */
class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.initialized = false;
  }

  /**
   * Register a service
   */
  register(name, serviceInstance) {
    this.services.set(name, serviceInstance);
  }

  /**
   * Get a service
   */
  get(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }
    return service;
  }

  /**
   * Initialize all services
   */
  async initializeAll() {
    if (this.initialized) return;

    console.log('Initializing all services...');
    
    for (const [name, service] of this.services) {
      try {
        await service.initialize();
      } catch (error) {
        console.error(`Failed to initialize ${name} service:`, error);
        throw error;
      }
    }
    
    this.initialized = true;
    console.log('All services initialized successfully');
  }

  /**
   * Health check for all services
   */
  async healthCheckAll() {
    const results = {};
    
    for (const [name, service] of this.services) {
      try {
        results[name] = await service.healthCheck();
      } catch (error) {
        results[name] = {
          service: name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }
    }
    
    return results;
  }

  /**
   * Get metrics for all services
   */
  getAllMetrics() {
    const metrics = {};
    
    for (const [name, service] of this.services) {
      metrics[name] = service.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Shutdown all services
   */
  async shutdownAll() {
    console.log('Shutting down all services...');
    
    for (const [name, service] of this.services) {
      try {
        if (service.shutdown) {
          await service.shutdown();
        }
      } catch (error) {
        console.error(`Error shutting down ${name} service:`, error);
      }
    }
    
    this.initialized = false;
    console.log('All services shut down');
  }
}

// Create singleton registry
const registry = new ServiceRegistry();

// Register all services
registry.register('auth', new AuthService());
registry.register('otp', new OTPService());
registry.register('storage', new StorageService());
registry.register('notes', new NotesService());
registry.register('files', new FileService());
registry.register('user', new UserService());

/**
 * Service access helpers
 */
export const getService = (name) => registry.get(name);
export const getAuthService = () => registry.get('auth');
export const getOTPService = () => registry.get('otp');
export const getStorageService = () => registry.get('storage');
export const getNotesService = () => registry.get('notes');
export const getFileService = () => registry.get('files');
export const getUserService = () => registry.get('user');

/**
 * Initialize all services
 */
export const initializeServices = () => registry.initializeAll();

/**
 * Health check all services
 */
export const healthCheckServices = () => registry.healthCheckAll();

/**
 * Get all service metrics
 */
export const getServiceMetrics = () => registry.getAllMetrics();

/**
 * Shutdown all services
 */
export const shutdownServices = () => registry.shutdownAll();

export { registry as serviceRegistry };
export default registry; 