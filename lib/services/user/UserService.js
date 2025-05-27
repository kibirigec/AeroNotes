/**
 * User Service
 * Handles user profile management, preferences, and user-related business logic
 */

import { BaseService } from '../index.js';
import { getAuthService } from '../index.js';
import { BaseRepository } from '../../core/database/index.js';
import { 
  ValidationError, 
  NotFoundError,
  AuthenticationError 
} from '../../core/errors/index.js';
import { getConfig } from '../../core/config/index.js';

/**
 * User profile repository
 */
class UserProfileRepository extends BaseRepository {
  constructor() {
    super('user_profiles');
  }

  async findByUserId(userId) {
    const result = await this.query()
      .query.select('*')
      .eq('user_id', userId)
      .single();
    
    if (result.error && result.error.code !== 'PGRST116') {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async createProfile(userId, profileData) {
    const result = await this.query()
      .query.insert({
        user_id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async updateProfile(userId, updates) {
    const result = await this.query()
      .query.update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async deleteProfile(userId) {
    const result = await this.query()
      .query.delete()
      .eq('user_id', userId);
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return true;
  }
}

/**
 * User preferences repository
 */
class UserPreferencesRepository extends BaseRepository {
  constructor() {
    super('user_preferences');
  }

  async findByUserId(userId) {
    const result = await this.query()
      .query.select('*')
      .eq('user_id', userId)
      .single();
    
    if (result.error && result.error.code !== 'PGRST116') {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }

  async upsertPreferences(userId, preferences) {
    const result = await this.query()
      .query.upsert({
        user_id: userId,
        preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (result.error) {
      throw new DatabaseError(result.error.message, result.error);
    }
    
    return result.data;
  }
}

/**
 * User service
 */
export class UserService extends BaseService {
  constructor() {
    super('UserService');
    this.profileRepository = new UserProfileRepository();
    this.preferencesRepository = new UserPreferencesRepository();
    this.config = getConfig();
  }

  async onInitialize() {
    // Get auth service dependency
    this.authService = getAuthService();
    
    if (!this.authService) {
      throw new Error('AuthService dependency not available');
    }
  }

  /**
   * Default user preferences
   */
  getDefaultPreferences() {
    return {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        autoDelete: true,
      },
      privacy: {
        profileVisible: false,
        shareUsageData: false,
      },
      autoDelete: {
        enabled: true,
        defaultExpiry: 1, // hours
      },
      fileUpload: {
        autoCompress: true,
        defaultPrivacy: 'private',
      },
    };
  }

  /**
   * Validate profile data
   */
  validateProfileData(profileData) {
    const { displayName, bio, avatar } = profileData;
    
    if (displayName && displayName.length > 50) {
      throw new ValidationError('Display name cannot exceed 50 characters', 'displayName');
    }
    
    if (bio && bio.length > 500) {
      throw new ValidationError('Bio cannot exceed 500 characters', 'bio');
    }
    
    if (avatar && typeof avatar !== 'string') {
      throw new ValidationError('Avatar must be a valid URL', 'avatar');
    }
  }

  /**
   * Validate preferences
   */
  validatePreferences(preferences) {
    if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
      throw new ValidationError('Invalid theme option', 'theme');
    }
    
    if (preferences.language && typeof preferences.language !== 'string') {
      throw new ValidationError('Language must be a string', 'language');
    }
  }

  /**
   * Get complete user profile
   */
  async getUserProfile(userId) {
    // Get user auth data
    const user = await this.authService.getUserById(userId);
    
    // Get profile data
    let profile = await this.profileRepository.findByUserId(userId);
    
    // Create default profile if none exists
    if (!profile) {
      profile = await this.profileRepository.createProfile(userId, {
        display_name: null,
        bio: null,
        avatar: null,
      });
    }
    
    // Get preferences
    let preferences = await this.preferencesRepository.findByUserId(userId);
    
    // Create default preferences if none exist
    if (!preferences) {
      const defaultPrefs = this.getDefaultPreferences();
      preferences = await this.preferencesRepository.upsertPreferences(userId, defaultPrefs);
    }
    
    return {
      id: user.id,
      phone: user.phone,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      profile: {
        displayName: profile.display_name,
        bio: profile.bio,
        avatar: profile.avatar,
        updatedAt: profile.updated_at,
      },
      preferences: preferences.preferences,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    this.validateProfileData(profileData);
    
    const { displayName, bio, avatar } = profileData;
    
    const updatedProfile = await this.profileRepository.updateProfile(userId, {
      display_name: displayName,
      bio,
      avatar,
    });
    
    return {
      displayName: updatedProfile.display_name,
      bio: updatedProfile.bio,
      avatar: updatedProfile.avatar,
      updatedAt: updatedProfile.updated_at,
    };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId, newPreferences) {
    // Get current preferences
    const current = await this.preferencesRepository.findByUserId(userId);
    const currentPrefs = current?.preferences || this.getDefaultPreferences();
    
    // Merge with new preferences
    const mergedPreferences = {
      ...currentPrefs,
      ...newPreferences,
      notifications: {
        ...currentPrefs.notifications,
        ...newPreferences.notifications,
      },
      privacy: {
        ...currentPrefs.privacy,
        ...newPreferences.privacy,
      },
      autoDelete: {
        ...currentPrefs.autoDelete,
        ...newPreferences.autoDelete,
      },
      fileUpload: {
        ...currentPrefs.fileUpload,
        ...newPreferences.fileUpload,
      },
    };
    
    this.validatePreferences(mergedPreferences);
    
    const updatedPreferences = await this.preferencesRepository.upsertPreferences(
      userId, 
      mergedPreferences
    );
    
    return updatedPreferences.preferences;
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId) {
    const preferences = await this.preferencesRepository.findByUserId(userId);
    
    if (!preferences) {
      // Create and return default preferences
      const defaultPrefs = this.getDefaultPreferences();
      const created = await this.preferencesRepository.upsertPreferences(userId, defaultPrefs);
      return created.preferences;
    }
    
    return preferences.preferences;
  }

  /**
   * Update user PIN (delegates to auth service)
   */
  async updatePIN(userId, currentPIN, newPIN) {
    return await this.authService.updatePIN(userId, currentPIN, newPIN);
  }

  /**
   * Delete user account and all related data
   */
  async deleteAccount(userId, pin) {
    // Verify PIN before deletion
    await this.authService.deleteAccount(userId, pin);
    
    // Clean up profile and preferences
    try {
      await this.profileRepository.deleteProfile(userId);
      await this.preferencesRepository.query()
        .query.delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error cleaning up user data:', error);
      // Continue with deletion even if cleanup fails
    }
    
    return { success: true };
  }

  /**
   * Get user activity summary
   */
  async getActivitySummary(userId) {
    try {
      // Get user profile
      const profile = await this.getUserProfile(userId);
      
      // This would typically aggregate data from other services
      // For now, returning basic info
      return {
        userId,
        memberSince: profile.createdAt,
        lastActive: profile.lastSignInAt,
        profileComplete: !!(profile.profile.displayName || profile.profile.bio),
        preferences: {
          theme: profile.preferences.theme,
          autoDeleteEnabled: profile.preferences.autoDelete.enabled,
          notificationsEnabled: profile.preferences.notifications.email,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get activity summary: ${error.message}`);
    }
  }

  /**
   * Update user theme preference
   */
  async updateTheme(userId, theme) {
    if (!['light', 'dark', 'auto'].includes(theme)) {
      throw new ValidationError('Invalid theme option', 'theme');
    }
    
    const preferences = await this.updatePreferences(userId, { theme });
    
    return { theme: preferences.theme };
  }

  /**
   * Toggle notification preferences
   */
  async toggleNotifications(userId, notificationType, enabled) {
    const validTypes = ['email', 'push', 'autoDelete'];
    
    if (!validTypes.includes(notificationType)) {
      throw new ValidationError(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    const preferences = await this.updatePreferences(userId, {
      notifications: {
        [notificationType]: enabled,
      },
    });
    
    return preferences.notifications;
  }

  /**
   * Export user data
   */
  async exportUserData(userId) {
    const profile = await this.getUserProfile(userId);
    
    return {
      user: {
        id: profile.id,
        phone: profile.phone,
        createdAt: profile.createdAt,
      },
      profile: profile.profile,
      preferences: profile.preferences,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    try {
      // Check auth service dependency
      const authHealth = await this.authService.healthCheck();
      
      // Test database connections
      await this.profileRepository.query().query.select('count').limit(1);
      await this.preferencesRepository.query().query.select('count').limit(1);
      
      return {
        ...baseHealth,
        dependencies: {
          auth: authHealth.status,
        },
        database: 'connected',
        features: {
          profiles: true,
          preferences: true,
          themes: true,
          notifications: true,
          dataExport: true,
        },
      };
    } catch (error) {
      return {
        ...baseHealth,
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
} 