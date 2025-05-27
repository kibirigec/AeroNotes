/**
 * Comprehensive API Tests
 * Tests all API routes with the new modular service architecture
 */

import request from 'supertest';
import { app } from '../../src/app/app.js'; // Assuming we have an Express app export
import { 
  initializeServices,
  shutdownServices,
  getAuthService,
  getNotesService,
  getFileService 
} from '../../lib/services/index.js';

describe('AeroNotes API Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Initialize services before tests
    await initializeServices();
    
    // Create a test user
    const authService = getAuthService();
    testUser = await authService.register('1234567890', '1234');
    authToken = testUser.id;
  });

  afterAll(async () => {
    // Clean up after tests
    await shutdownServices();
  });

  describe('Authentication Routes', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '9876543210',
            pin: '5678'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user.phone).toBe('+19876543210');
      });

      it('should reject registration with invalid phone number', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: 'invalid',
            pin: '1234'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject registration with weak PIN', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '5555555555',
            pin: '1111' // Blocked pattern
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '1234567890',
            pin: '1234'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user).toHaveProperty('lastSignInAt');
      });

      it('should reject login with invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '1234567890',
            pin: 'wrong'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      });
    });
  });

  describe('Notes Routes', () => {
    let testNoteId;

    describe('POST /api/notes', () => {
      it('should create a new note', async () => {
        const response = await request(app)
          .post('/api/notes')
          .set('x-user-id', authToken)
          .send({
            text: 'Test note content',
            autoDelete: true,
            expiryHours: 24
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.note).toHaveProperty('id');
        expect(response.body.data.note.text).toBe('Test note content');
        expect(response.body.data.note.autoDelete).toBe(true);
        
        testNoteId = response.body.data.note.id;
      });

      it('should reject empty note text', async () => {
        const response = await request(app)
          .post('/api/notes')
          .set('x-user-id', authToken)
          .send({
            text: ''
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/notes')
          .send({
            text: 'Test note'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/notes', () => {
      it('should list user notes', async () => {
        const response = await request(app)
          .get('/api/notes')
          .set('x-user-id', authToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.notes)).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/notes?page=1&limit=5')
          .set('x-user-id', authToken);

        expect(response.status).toBe(200);
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(5);
      });
    });

    describe('GET /api/notes/:id', () => {
      it('should get a specific note', async () => {
        const response = await request(app)
          .get(`/api/notes/${testNoteId}`)
          .set('x-user-id', authToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.note.id).toBe(testNoteId);
        expect(response.body.data.note.text).toBe('Test note content');
      });

      it('should return 404 for non-existent note', async () => {
        const response = await request(app)
          .get('/api/notes/999999')
          .set('x-user-id', authToken);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
      });
    });

    describe('PUT /api/notes/:id', () => {
      it('should update note text', async () => {
        const response = await request(app)
          .put(`/api/notes/${testNoteId}`)
          .set('x-user-id', authToken)
          .send({
            text: 'Updated note content'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.note.text).toBe('Updated note content');
      });

      it('should toggle auto-delete setting', async () => {
        const response = await request(app)
          .put(`/api/notes/${testNoteId}`)
          .set('x-user-id', authToken)
          .send({
            autoDelete: false
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.note.autoDelete).toBe(false);
      });
    });

    describe('DELETE /api/notes/:id', () => {
      it('should delete a note', async () => {
        const response = await request(app)
          .delete(`/api/notes/${testNoteId}`)
          .set('x-user-id', authToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('deleted successfully');
      });

      it('should return 404 for already deleted note', async () => {
        const response = await request(app)
          .delete(`/api/notes/${testNoteId}`)
          .set('x-user-id', authToken);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
      });
    });
  });

  describe('Files Routes', () => {
    let testFileId;

    describe('POST /api/files', () => {
      it('should upload a file', async () => {
        const response = await request(app)
          .post('/api/files')
          .set('x-user-id', authToken)
          .attach('file', Buffer.from('test file content'), 'test.txt')
          .field('category', 'document')
          .field('tags', 'test,upload')
          .field('description', 'Test file upload');

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.file).toHaveProperty('id');
        expect(response.body.data.file.category).toBe('document');
        
        testFileId = response.body.data.file.id;
      });

      it('should reject upload without file', async () => {
        const response = await request(app)
          .post('/api/files')
          .set('x-user-id', authToken);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/files', () => {
      it('should list user files', async () => {
        const response = await request(app)
          .get('/api/files')
          .set('x-user-id', authToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.files)).toBe(true);
      });

      it('should filter files by category', async () => {
        const response = await request(app)
          .get('/api/files?category=document')
          .set('x-user-id', authToken);

        expect(response.status).toBe(200);
        expect(response.body.data.filters.category).toBe('document');
      });

      it('should search files', async () => {
        const response = await request(app)
          .get('/api/files?search=test')
          .set('x-user-id', authToken);

        expect(response.status).toBe(200);
        expect(response.body.data.filters.search).toBe('test');
      });
    });
  });

  describe('User Routes', () => {
    describe('GET /api/user/profile', () => {
      it('should get user profile', async () => {
        const response = await request(app)
          .get('/api/user/profile')
          .set('x-user-id', authToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.profile).toHaveProperty('id');
        expect(response.body.data.profile).toHaveProperty('phone');
        expect(response.body.data.profile).toHaveProperty('preferences');
      });
    });

    describe('PUT /api/user/profile', () => {
      it('should update user profile', async () => {
        const response = await request(app)
          .put('/api/user/profile')
          .set('x-user-id', authToken)
          .send({
            displayName: 'Test User',
            preferences: {
              theme: 'dark'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.profile.displayName).toBe('Test User');
      });
    });

    describe('GET /api/user/storage', () => {
      it('should get storage usage', async () => {
        const response = await request(app)
          .get('/api/user/storage')
          .set('x-user-id', authToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.usage).toHaveProperty('totalSize');
        expect(response.body.data.usage).toHaveProperty('fileCount');
      });
    });
  });

  describe('Health Route', () => {
    describe('GET /api/health', () => {
      it('should return system health status', async () => {
        const response = await request(app)
          .get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status');
        expect(response.body.data).toHaveProperty('services');
      });

      it('should include metrics when requested', async () => {
        const response = await request(app)
          .get('/api/health?metrics=true');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('metrics');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors consistently', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('x-user-id', authToken)
        .send({
          text: 'x'.repeat(10001) // Exceed character limit
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('statusCode');
    });

    it('should handle authentication errors consistently', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('x-user-id', 'invalid-user-id');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should handle not found errors consistently', async () => {
      const response = await request(app)
        .get('/api/notes/999999')
        .set('x-user-id', authToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND_ERROR');
    });
  });

  describe('Service Integration', () => {
    it('should properly integrate with all services', async () => {
      // Test that services are properly initialized and accessible
      const authService = getAuthService();
      const notesService = getNotesService();
      const fileService = getFileService();

      expect(authService).toBeDefined();
      expect(notesService).toBeDefined();
      expect(fileService).toBeDefined();

      // Test service health checks
      const authHealth = await authService.healthCheck();
      const notesHealth = await notesService.healthCheck();
      const fileHealth = await fileService.healthCheck();

      expect(authHealth.status).toBe('healthy');
      expect(notesHealth.status).toBe('healthy');
      expect(fileHealth.status).toBe('healthy');
    });
  });
}); 