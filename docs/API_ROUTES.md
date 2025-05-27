# AeroNotes API Routes Documentation

This document outlines all API routes available in the AeroNotes application using the new modular service architecture.

## Authentication

All protected routes require the `x-user-id` header to be set with a valid user ID.

### Authentication Routes

#### Register User
- **POST** `/api/auth/register`
- **Body**: `{ phoneNumber: string, pin: string }`
- **Response**: User object with registration confirmation
- **Description**: Register a new user with phone number and PIN

#### Login User
- **POST** `/api/auth/login`
- **Body**: `{ phoneNumber: string, pin: string }`
- **Response**: User object with authentication confirmation
- **Description**: Authenticate user with phone number and PIN

## Notes Management

### Notes Collection Routes

#### List User Notes
- **GET** `/api/notes`
- **Headers**: `x-user-id: string` (required)
- **Query Parameters**:
  - `includeExpired`: boolean (default: false)
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
- **Response**: Array of notes with pagination info
- **Description**: Retrieve all notes for the authenticated user

#### Create New Note
- **POST** `/api/notes`
- **Headers**: `x-user-id: string` (required)
- **Body**: `{ text: string, autoDelete?: boolean, expiryHours?: number }`
- **Response**: Created note object
- **Description**: Create a new note for the authenticated user

### Individual Note Routes

#### Get Specific Note
- **GET** `/api/notes/[id]`
- **Headers**: `x-user-id: string` (required)
- **Response**: Note object
- **Description**: Retrieve a specific note by ID

#### Update Note
- **PUT** `/api/notes/[id]`
- **Headers**: `x-user-id: string` (required)
- **Body**: `{ text?: string, autoDelete?: boolean }`
- **Response**: Updated note object
- **Description**: Update note text or auto-delete setting

#### Delete Note
- **DELETE** `/api/notes/[id]`
- **Headers**: `x-user-id: string` (required)
- **Response**: Deletion confirmation
- **Description**: Delete a specific note

## File Management

### File Collection Routes

#### List User Files
- **GET** `/api/files`
- **Headers**: `x-user-id: string` (required)
- **Query Parameters**:
  - `category`: string (filter by category)
  - `tags`: string (comma-separated tags)
  - `search`: string (search in file names/descriptions)
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
- **Response**: Array of files with pagination and filter info
- **Description**: Retrieve all files for the authenticated user

#### Upload New File
- **POST** `/api/files`
- **Headers**: `x-user-id: string` (required)
- **Body**: FormData with:
  - `file`: File (required)
  - `category`: string (optional)
  - `tags`: string (comma-separated, optional)
  - `description`: string (optional)
  - `makePublic`: boolean (optional)
- **Response**: Uploaded file object
- **Description**: Upload a new file for the authenticated user

### Individual File Routes

#### Get Specific File
- **GET** `/api/files/[id]`
- **Headers**: `x-user-id: string` (required)
- **Response**: File object with metadata
- **Description**: Retrieve a specific file by ID

#### Update File Metadata
- **PUT** `/api/files/[id]`
- **Headers**: `x-user-id: string` (required)
- **Body**: 
  - For metadata update: `{ category?: string, tags?: string[], description?: string, makePublic?: boolean }`
  - For share link: `{ action: "share", expiresIn?: number, allowDownload?: boolean }`
- **Response**: Updated file object or share link
- **Description**: Update file metadata or generate share link

#### Delete File
- **DELETE** `/api/files/[id]`
- **Headers**: `x-user-id: string` (required)
- **Response**: Deletion confirmation
- **Description**: Delete a specific file

## User Management

### User Profile Routes

#### Get User Profile
- **GET** `/api/user/profile`
- **Headers**: `x-user-id: string` (required)
- **Response**: User profile object
- **Description**: Retrieve the authenticated user's profile

#### Update User Profile
- **PUT** `/api/user/profile`
- **Headers**: `x-user-id: string` (required)
- **Body**: `{ displayName?: string, preferences?: object, settings?: object }`
- **Response**: Updated profile object
- **Description**: Update user profile information

### User Storage Routes

#### Get Storage Usage
- **GET** `/api/user/storage`
- **Headers**: `x-user-id: string` (required)
- **Response**: Storage usage statistics
- **Description**: Get storage usage information for the authenticated user

## System Health

### Health Check Routes

#### System Health Check
- **GET** `/api/health`
- **Query Parameters**:
  - `metrics`: boolean (include service metrics)
- **Response**: System health status and service information
- **Description**: Check the health of all system services

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400,
    "details": {
      // Additional error details
    }
  }
}
```

## Error Codes

- `VALIDATION_ERROR` (400): Invalid input data
- `AUTHENTICATION_ERROR` (401): Authentication required or failed
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `NOT_FOUND_ERROR` (404): Resource not found
- `DATABASE_ERROR` (500): Database operation failed
- `STORAGE_ERROR` (500): File storage operation failed
- `OTP_ERROR` (400): OTP related error
- `RATE_LIMIT_ERROR` (429): Rate limit exceeded
- `FILE_UPLOAD_ERROR` (400): File upload failed
- `CONFIGURATION_ERROR` (500): System configuration error

## Authentication Middleware

The application uses custom authentication middleware that:

1. Extracts the user ID from the `x-user-id` header
2. Validates the user exists in the database
3. Adds user information to the request object
4. Provides both required and optional authentication modes

## Service Integration

All routes are built using the modular service architecture:

- **AuthService**: User authentication and management
- **NotesService**: Note creation, retrieval, and management
- **FileService**: File upload, storage, and metadata management
- **StorageService**: Storage operations and usage tracking
- **UserService**: User profile and settings management

Each service provides:
- Comprehensive error handling
- Input validation
- User isolation
- Health monitoring
- Metrics collection

## Rate Limiting

Rate limiting is implemented at the service level and can be configured per endpoint. Default limits apply to prevent abuse.

## Security Features

- User isolation: All operations are scoped to the authenticated user
- Input validation: All inputs are validated before processing
- Error sanitization: Sensitive information is not exposed in error messages
- File type validation: Only allowed file types can be uploaded
- Size limits: File uploads are limited by size and user quotas 