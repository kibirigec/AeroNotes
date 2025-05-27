/**
 * Custom API Hook
 * Provides a centralized way to make API calls with error handling and loading states
 */

import { useState, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Custom hook for API calls
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      // Add user ID from localStorage or context
      const userId = localStorage.getItem('userId');
      if (userId) {
        config.headers['x-user-id'] = userId;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint, options = {}) => {
    return makeRequest(endpoint, { method: 'GET', ...options });
  }, [makeRequest]);

  const post = useCallback((endpoint, data, options = {}) => {
    return makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }, [makeRequest]);

  const put = useCallback((endpoint, data, options = {}) => {
    return makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }, [makeRequest]);

  const del = useCallback((endpoint, options = {}) => {
    return makeRequest(endpoint, { method: 'DELETE', ...options });
  }, [makeRequest]);

  const upload = useCallback((endpoint, formData, options = {}) => {
    const uploadOptions = {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
        ...options.headers,
      },
    };
    delete uploadOptions.headers['Content-Type'];

    return makeRequest(endpoint, uploadOptions);
  }, [makeRequest]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    upload,
    clearError: () => setError(null),
  };
};

/**
 * Hook for authentication API calls
 */
export const useAuth = () => {
  const api = useApi();

  const register = useCallback(async (phoneNumber, pin) => {
    const result = await api.post('/api/auth/register', { phoneNumber, pin });
    localStorage.setItem('userId', result.user.id);
    return result;
  }, [api]);

  const login = useCallback(async (phoneNumber, pin) => {
    const result = await api.post('/api/auth/login', { phoneNumber, pin });
    localStorage.setItem('userId', result.user.id);
    return result;
  }, [api]);

  const logout = useCallback(() => {
    localStorage.removeItem('userId');
  }, []);

  return {
    register,
    login,
    logout,
    loading: api.loading,
    error: api.error,
    clearError: api.clearError,
  };
};

/**
 * Hook for notes API calls
 */
export const useNotes = () => {
  const api = useApi();

  const getNotes = useCallback((options = {}) => {
    const params = new URLSearchParams(options).toString();
    return api.get(`/api/notes${params ? `?${params}` : ''}`);
  }, [api]);

  const createNote = useCallback((text, options = {}) => {
    return api.post('/api/notes', { text, ...options });
  }, [api]);

  const getNote = useCallback((id) => {
    return api.get(`/api/notes/${id}`);
  }, [api]);

  const updateNote = useCallback((id, updates) => {
    return api.put(`/api/notes/${id}`, updates);
  }, [api]);

  const deleteNote = useCallback((id) => {
    return api.delete(`/api/notes/${id}`);
  }, [api]);

  return {
    getNotes,
    createNote,
    getNote,
    updateNote,
    deleteNote,
    loading: api.loading,
    error: api.error,
    clearError: api.clearError,
  };
};

/**
 * Hook for files API calls
 */
export const useFiles = () => {
  const api = useApi();

  const getFiles = useCallback((options = {}) => {
    const params = new URLSearchParams(options).toString();
    return api.get(`/api/files${params ? `?${params}` : ''}`);
  }, [api]);

  const uploadFile = useCallback((file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, value.join(','));
      } else {
        formData.append(key, value);
      }
    });

    return api.upload('/api/files', formData);
  }, [api]);

  const getFile = useCallback((id) => {
    return api.get(`/api/files/${id}`);
  }, [api]);

  const updateFile = useCallback((id, updates) => {
    return api.put(`/api/files/${id}`, updates);
  }, [api]);

  const deleteFile = useCallback((id) => {
    return api.delete(`/api/files/${id}`);
  }, [api]);

  return {
    getFiles,
    uploadFile,
    getFile,
    updateFile,
    deleteFile,
    loading: api.loading,
    error: api.error,
    clearError: api.clearError,
  };
};

/**
 * Hook for user API calls
 */
export const useUser = () => {
  const api = useApi();

  const getProfile = useCallback(() => {
    return api.get('/api/user/profile');
  }, [api]);

  const updateProfile = useCallback((updates) => {
    return api.put('/api/user/profile', updates);
  }, [api]);

  const getStorageUsage = useCallback(() => {
    return api.get('/api/user/storage');
  }, [api]);

  return {
    getProfile,
    updateProfile,
    getStorageUsage,
    loading: api.loading,
    error: api.error,
    clearError: api.clearError,
  };
};

/**
 * Hook for monitoring API calls
 */
export const useMonitoring = () => {
  const api = useApi();

  const getMonitoringData = useCallback(async (type = 'overview', detailed = false) => {
    const params = new URLSearchParams({ type, detailed: detailed.toString() }).toString();
    const response = await api.get(`/api/monitoring?${params}`);
    return response.success ? response.data : response;
  }, [api]);

  const getAlerts = useCallback(async () => {
    const response = await api.post('/api/monitoring/alerts', {});
    return response.success ? response.data : { alerts: [] };
  }, [api]);

  const getHealth = useCallback(async (includeMetrics = false) => {
    const params = includeMetrics ? '?metrics=true' : '';
    const response = await api.get(`/api/health${params}`);
    return response.success ? response.data : response;
  }, [api]);

  return {
    getMonitoringData,
    getAlerts,
    getHealth,
    loading: api.loading,
    error: api.error,
    clearError: api.clearError,
  };
}; 