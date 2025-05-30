/**
 * Service Layer Registry
 * Centralized access to all application services
 */

import { BaseService } from './BaseService.js';
import { AuthService } from './auth/AuthService.js';
import { OTPService } from './otp/OTPService.js';
import { StorageService } from './storage/StorageService.js';
import { NotesService } from './notes/NotesService.js';
import { FileService } from './files/FileService.js';
import { UserService } from './user/UserService.js';

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
 * Perform health check (alias for compatibility)
 */
export const performHealthCheck = () => registry.healthCheckAll();

/**
 * Get all service metrics
 */
export const getServiceMetrics = () => registry.getAllMetrics();

/**
 * Shutdown all services
 */
export const shutdownServices = () => registry.shutdownAll();

// Export BaseService for inheritance
export { BaseService };

export { registry as serviceRegistry };
export default registry; 