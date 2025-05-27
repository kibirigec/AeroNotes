/**
 * Centralized Configuration Management
 * Handles all app configurations including database, auth, storage, and services
 */

import { createClientConfig } from './supabase.config.js';
import { createAuthConfig } from './auth.config.js';
import { createStorageConfig } from './storage.config.js';
import { createOTPConfig } from './otp.config.js';

/**
 * Main configuration factory
 * @returns {Object} Complete application configuration
 */
export const createAppConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    env,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    
    // Core configurations
    supabase: createClientConfig(),
    auth: createAuthConfig(),
    storage: createStorageConfig(),
    otp: createOTPConfig(),
    
    // App settings
    app: {
      name: 'AeroNotes',
      version: process.env.npm_package_version || '1.0.0',
      secret: process.env.APP_SECRET,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    
    // Feature flags
    features: {
      enableOTP: true,
      enableAutoDelete: true,
      enableFileUploads: true,
      enableRealTime: true,
    },
    
    // Rate limiting
    rateLimits: {
      otp: {
        maxAttempts: 5,
        windowMinutes: 15,
      },
      login: {
        maxAttempts: 10,
        windowMinutes: 30,
      },
      fileUpload: {
        maxSize: 100 * 1024 * 1024, // 100MB
        maxFiles: 50,
      },
    },
    
    // Validation rules
    validation: {
      phone: {
        minLength: 10,
        maxLength: 15,
        format: /^\+[1-9]\d{1,14}$/,
      },
      pin: {
        length: 4,
        format: /^\d{4}$/,
      },
      otp: {
        length: 6,
        format: /^\d{6}$/,
        expiryMinutes: 10,
      },
    },
  };
};

/**
 * Get configuration instance (singleton)
 */
let configInstance = null;

export const getConfig = () => {
  if (!configInstance) {
    configInstance = createAppConfig();
  }
  return configInstance;
};

/**
 * Environment-specific configuration getters
 */
export const isDevelopment = () => getConfig().isDevelopment;
export const isProduction = () => getConfig().isProduction;

/**
 * Quick access to specific configs
 */
export const getSupabaseConfig = () => getConfig().supabase;
export const getAuthConfig = () => getConfig().auth;
export const getStorageConfig = () => getConfig().storage;
export const getOTPConfig = () => getConfig().otp;
export const getValidationConfig = () => getConfig().validation;
export const getRateLimits = () => getConfig().rateLimits; 