/**
 * Centralized Error Handling System
 * Provides custom error classes and error handling utilities
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, 400, 'VALIDATION_ERROR', { field, value });
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR', { originalError: originalError?.message });
    this.originalError = originalError;
  }
}

/**
 * Storage error
 */
export class StorageError extends AppError {
  constructor(message, operation = null) {
    super(message, 500, 'STORAGE_ERROR', { operation });
  }
}

/**
 * OTP error
 */
export class OTPError extends AppError {
  constructor(message, type = 'GENERAL') {
    const codes = {
      EXPIRED: 'OTP_EXPIRED',
      INVALID: 'OTP_INVALID',
      RATE_LIMITED: 'OTP_RATE_LIMITED',
      SEND_FAILED: 'OTP_SEND_FAILED',
      GENERAL: 'OTP_ERROR',
    };
    
    super(message, 400, codes[type] || codes.GENERAL);
  }
}

/**
 * Rate limiting error
 */
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

/**
 * File upload error
 */
export class FileUploadError extends AppError {
  constructor(message, fileName = null, fileSize = null) {
    super(message, 400, 'FILE_UPLOAD_ERROR', { fileName, fileSize });
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AppError {
  constructor(message, configKey = null) {
    super(message, 500, 'CONFIGURATION_ERROR', { configKey });
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Handle API errors
   */
  static handleAPIError(error, req = null) {
    // Log error
    console.error('API Error:', {
      message: error.message,
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      timestamp: new Date().toISOString(),
    });

    // Return appropriate response
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
        statusCode: error.statusCode,
      };
    }

    // Handle unknown errors
    return {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      statusCode: 500,
    };
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error) {
    if (error.code === '23505') {
      return new ValidationError('Duplicate entry', null, error.detail);
    }
    
    if (error.code === '23503') {
      return new ValidationError('Referenced record not found');
    }
    
    if (error.code === '42P01') {
      return new DatabaseError('Table does not exist');
    }
    
    return new DatabaseError(error.message, error);
  }

  /**
   * Handle Supabase errors
   */
  static handleSupabaseError(error) {
    const { message, status, statusCode } = error;
    
    if (status === 401 || statusCode === 401) {
      return new AuthenticationError(message);
    }
    
    if (status === 403 || statusCode === 403) {
      return new AuthorizationError(message);
    }
    
    if (status === 404 || statusCode === 404) {
      return new NotFoundError();
    }
    
    if (status === 409 || statusCode === 409) {
      return new ValidationError(message);
    }
    
    return new DatabaseError(message, error);
  }

  /**
   * Validate required fields
   */
  static validateRequired(data, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0 && data[field] !== false) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missing.join(', ')}`,
        missing[0]
      );
    }
  }

  /**
   * Validate field format
   */
  static validateFormat(value, pattern, fieldName, message = null) {
    if (!pattern.test(value)) {
      throw new ValidationError(
        message || `Invalid format for ${fieldName}`,
        fieldName,
        value
      );
    }
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file, config) {
    const { maxFileSize, allowedMimeTypes } = config;
    
    if (file.size > maxFileSize) {
      throw new FileUploadError(
        `File size exceeds limit of ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        file.name,
        file.size
      );
    }
    
    if (!allowedMimeTypes.includes(file.type)) {
      throw new FileUploadError(
        `File type ${file.type} is not allowed`,
        file.name
      );
    }
  }
}

/**
 * Async error wrapper
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error response helper for Next.js
 */
export const sendErrorResponse = (NextResponse, error) => {
  const response = ErrorHandler.handleAPIError(error);
  return NextResponse.json(response, { status: response.statusCode });
}; 