/**
 * Authentication Service
 * Handles user authentication, session management, and security
 */

import { BaseService } from '../index.js';
import { BaseRepository } from '../../core/database/index.js';
import { 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError,
  ErrorHandler 
} from '../../core/errors/index.js';
import { getAuthConfig } from '../../core/config/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * User repository
 */
class UserRepository extends BaseRepository {
  constructor() {
    super('auth.users');
  }

  async findByPhone(phoneNumber) {
    const result = await this.query(true)
      .query.select('*')
      .eq('phone', phoneNumber)
      .single();
    
    if (result.error && result.error.code !== 'PGRST116') {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async createUser(userData) {
    const result = await this.query(true)
      .query.insert(userData)
      .select()
      .single();
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async updateUser(userId, updates) {
    const result = await this.query(true)
      .query.update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }
}

/**
 * Authentication service
 */
export class AuthService extends BaseService {
  constructor() {
    super('AuthService');
    this.userRepository = new UserRepository();
    this.authConfig = getAuthConfig();
  }

  async onInitialize() {
    // Validate configuration
    if (!this.authConfig.security.bcrypt.saltRounds) {
      throw new ConfigurationError('BCrypt salt rounds not configured');
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    const { pattern, minLength, maxLength } = this.authConfig.phone.validation;
    
    if (!phoneNumber) {
      throw new ValidationError('Phone number is required', 'phoneNumber');
    }
    
    if (phoneNumber.length < minLength || phoneNumber.length > maxLength) {
      throw new ValidationError(
        `Phone number must be between ${minLength} and ${maxLength} characters`,
        'phoneNumber',
        phoneNumber
      );
    }
    
    ErrorHandler.validateFormat(
      phoneNumber,
      pattern,
      'phoneNumber',
      'Invalid phone number format. Use E.164 format (+1234567890)'
    );
  }

  /**
   * Normalize phone number
   */
  normalizePhoneNumber(phoneNumber) {
    const { normalization } = this.authConfig.phone;
    let normalized = phoneNumber;
    
    if (normalization.removeSpaces) {
      normalized = normalized.replace(/\s/g, '');
    }
    
    if (normalization.removeHyphens) {
      normalized = normalized.replace(/-/g, '');
    }
    
    if (normalization.removeDots) {
      normalized = normalized.replace(/\./g, '');
    }
    
    if (normalization.addCountryCode && !normalized.startsWith('+')) {
      normalized = normalization.defaultCountryCode + normalized;
    }
    
    return normalized;
  }

  /**
   * Validate PIN format
   */
  validatePIN(pin) {
    const { pattern, blockedPatterns } = this.authConfig.pin.validation;
    
    if (!pin) {
      throw new ValidationError('PIN is required', 'pin');
    }
    
    ErrorHandler.validateFormat(
      pin,
      pattern,
      'pin',
      'PIN must be 4 digits'
    );
    
    if (blockedPatterns.includes(pin)) {
      throw new ValidationError(
        'PIN is too common. Please choose a different PIN',
        'pin'
      );
    }
  }

  /**
   * Hash PIN
   */
  async hashPIN(pin) {
    const saltRounds = this.authConfig.security.bcrypt.saltRounds;
    return await bcrypt.hash(pin, saltRounds);
  }

  /**
   * Verify PIN
   */
  async verifyPIN(pin, hashedPIN) {
    return await bcrypt.compare(pin, hashedPIN);
  }

  /**
   * Register new user
   */
  async register(phoneNumber, pin) {
    // Validate inputs
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    this.validatePhoneNumber(normalizedPhone);
    this.validatePIN(pin);
    
    // Check if user already exists
    const existingUser = await this.userRepository.findByPhone(normalizedPhone);
    if (existingUser) {
      throw new ValidationError('User already exists with this phone number');
    }
    
    // Hash PIN
    const hashedPIN = await this.hashPIN(pin);
    
    // Create user
    const userData = {
      phone: normalizedPhone,
      encrypted_password: hashedPIN,
      email_confirmed_at: new Date().toISOString(),
      phone_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const user = await this.userRepository.createUser(userData);
    
    return {
      id: user.id,
      phone: user.phone,
      createdAt: user.created_at,
    };
  }

  /**
   * Authenticate user
   */
  async authenticate(phoneNumber, pin) {
    // Validate inputs
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    this.validatePhoneNumber(normalizedPhone);
    this.validatePIN(pin);
    
    // Find user
    const user = await this.userRepository.findByPhone(normalizedPhone);
    if (!user) {
      throw new AuthenticationError('Invalid phone number or PIN');
    }
    
    // Verify PIN
    const isValidPIN = await this.verifyPIN(pin, user.encrypted_password);
    if (!isValidPIN) {
      throw new AuthenticationError('Invalid phone number or PIN');
    }
    
    // Update last sign in
    await this.userRepository.updateUser(user.id, {
      last_sign_in_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    return {
      id: user.id,
      phone: user.phone,
      lastSignInAt: user.last_sign_in_at,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    const result = await this.userRepository.query(true)
      .query.select('id, phone, created_at, last_sign_in_at')
      .eq('id', userId)
      .single();
    
    if (result.error) {
      if (result.error.code === 'PGRST116') {
        throw new AuthenticationError('User not found');
      }
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return {
      id: result.data.id,
      phone: result.data.phone,
      createdAt: result.data.created_at,
      lastSignInAt: result.data.last_sign_in_at,
    };
  }

  /**
   * Update user PIN
   */
  async updatePIN(userId, currentPIN, newPIN) {
    // Validate inputs
    this.validatePIN(currentPIN);
    this.validatePIN(newPIN);
    
    // Get user
    const user = await this.userRepository.query(true)
      .query.select('encrypted_password')
      .eq('id', userId)
      .single();
    
    if (user.error) {
      throw new AuthenticationError('User not found');
    }
    
    // Verify current PIN
    const isValidPIN = await this.verifyPIN(currentPIN, user.data.encrypted_password);
    if (!isValidPIN) {
      throw new AuthenticationError('Current PIN is incorrect');
    }
    
    // Hash new PIN
    const hashedNewPIN = await this.hashPIN(newPIN);
    
    // Update user
    await this.userRepository.updateUser(userId, {
      encrypted_password: hashedNewPIN,
      updated_at: new Date().toISOString(),
    });
    
    return { success: true };
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId, pin) {
    // Validate PIN
    this.validatePIN(pin);
    
    // Get user
    const user = await this.userRepository.query(true)
      .query.select('encrypted_password')
      .eq('id', userId)
      .single();
    
    if (user.error) {
      throw new AuthenticationError('User not found');
    }
    
    // Verify PIN
    const isValidPIN = await this.verifyPIN(pin, user.data.encrypted_password);
    if (!isValidPIN) {
      throw new AuthenticationError('PIN is incorrect');
    }
    
    // Delete user (this will cascade to related data)
    const result = await this.userRepository.query(true)
      .query.delete()
      .eq('id', userId);
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return { success: true };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    try {
      // Test database connection
      await this.userRepository.query().query.select('count').limit(1);
      
      return {
        ...baseHealth,
        database: 'connected',
        features: {
          registration: true,
          authentication: true,
          pinUpdate: true,
          accountDeletion: true,
        },
      };
    } catch (error) {
      return {
        ...baseHealth,
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Generate JWT token for user
   */
  generateJWTToken(user) {
    const payload = {
      userId: user.id,
      phone: user.phone,
      iat: Math.floor(Date.now() / 1000),
    };
    
    const options = {
      expiresIn: this.authConfig.security.jwt.expiresIn,
      issuer: this.authConfig.security.jwt.issuer,
      algorithm: this.authConfig.security.jwt.algorithm,
    };
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ConfigurationError('JWT_SECRET not configured');
    }
    
    return jwt.sign(payload, secret, options);
  }

  /**
   * Verify and decode JWT token
   */
  verifyJWTToken(token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new ConfigurationError('JWT_SECRET not configured');
      }
      
      const decoded = jwt.verify(token, secret, {
        issuer: this.authConfig.security.jwt.issuer,
        algorithms: [this.authConfig.security.jwt.algorithm],
      });
      
      return {
        valid: true,
        payload: decoded,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    };
    
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    return jwt.sign(payload, secret, { expiresIn: '30d' });
  }
} 