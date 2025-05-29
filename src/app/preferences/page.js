"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthProvider';
import { 
  getAutoSignoutSettings, 
  setAutoSignoutEnabled,
  setAutoSignoutTimeouts
} from '../../../lib/services/userPreferences';
import PageHeader from '../components/PageHeader';

export default function PreferencesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [autoSignoutSettings, setAutoSignoutSettingsState] = useState(null);
  const [isAutoSignoutEnabled, setIsAutoSignoutEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load user preferences
  useEffect(() => {
    if (user) {
      const settings = getAutoSignoutSettings();
      setAutoSignoutSettingsState(settings);
      setIsAutoSignoutEnabled(settings.enabled);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Handle toggle change
  const handleToggleChange = (enabled) => {
    // Update local toggle state immediately for instant UI feedback
    setIsAutoSignoutEnabled(enabled);

    // Update auto signout settings in background
    handleAutoSignoutChange({ enabled });
  };

  // Save auto signout settings
  const handleAutoSignoutChange = (newSettings) => {
    // Update local state immediately for instant UI feedback
    setAutoSignoutSettingsState(prev => ({
      ...prev,
      ...newSettings
    }));

    // Save to localStorage in the background
    const saveSettings = async () => {
      setIsSaving(true);
      try {
        if (newSettings.enabled !== undefined) {
          setAutoSignoutEnabled(newSettings.enabled);
        }
        
        if (newSettings.desktopTimeout || newSettings.mobileTimeout) {
          setAutoSignoutTimeouts(
            newSettings.desktopTimeout || autoSignoutSettings?.desktopTimeout || 20,
            newSettings.mobileTimeout || autoSignoutSettings?.mobileTimeout || 10
          );
        }

        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('Error saving auto signout settings:', error);
        setSaveMessage('Error saving settings. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
        
        // Revert local states on error
        const currentSettings = getAutoSignoutSettings();
        setAutoSignoutSettingsState(currentSettings);
        setIsAutoSignoutEnabled(currentSettings.enabled);
      } finally {
        setIsSaving(false);
      }
    };

    // Run save operation after state has updated
    saveSettings();
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement actual account deletion API call
      console.log('Account deletion requested');
      
      // For now, just sign out and redirect
      // In a real app, this would call an API to delete the account
      alert('Account deletion would be implemented here. For demo purposes, this just logs the request.');
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-gray-900">
      <PageHeader />
      
      {/* Header with navigation */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Preferences</h1>
          </div>
          
          {/* Save status */}
          {saveMessage && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              saveMessage.includes('Error') 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-8">
          
          {/* Auto Signout Settings */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Auto Signout</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Automatically sign out after a period of inactivity to protect your account.
            </p>
            
            {autoSignoutSettings && (
              <div className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Enable Auto Signout</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isAutoSignoutEnabled 
                        ? 'Auto signout is currently enabled' 
                        : 'Auto signout is currently disabled'
                      }
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isAutoSignoutEnabled}
                      onChange={(e) => handleToggleChange(e.target.checked)}
                      disabled={isSaving}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Timeout Settings - Only show when enabled */}
                {isAutoSignoutEnabled && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Timeout Settings</h3>
                    
                    {/* Desktop Timeout */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Desktop Timeout</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Minutes of inactivity before auto signout on desktop</p>
                      </div>
                      <select
                        value={autoSignoutSettings.desktopTimeout || 20}
                        onChange={(e) => handleAutoSignoutChange({ desktopTimeout: parseInt(e.target.value) })}
                        disabled={isSaving}
                        className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                      >
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                        <option value={60}>1 hour</option>
                      </select>
                    </div>

                    {/* Mobile Timeout */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Timeout</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Minutes of inactivity before auto signout on mobile</p>
                      </div>
                      <select
                        value={autoSignoutSettings.mobileTimeout || 10}
                        onChange={(e) => handleAutoSignoutChange({ mobileTimeout: parseInt(e.target.value) })}
                        disabled={isSaving}
                        className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                      >
                        <option value={2}>2 min</option>
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                      </select>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">How Auto Signout Works</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            The timer resets with any activity (typing, clicking, scrolling). You'll see a warning 60 seconds before auto signout.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delete Account Section */}
          <div className="border-t border-red-200 dark:border-red-700 pt-8">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
            <div className="border border-red-200 dark:border-red-700 rounded-lg p-6 bg-red-50 dark:bg-red-900/20">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-200">Delete Account</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Delete Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete your account? This will permanently remove:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 list-disc list-inside space-y-1">
              <li>All your notes and text content</li>
              <li>All uploaded images and documents</li>
              <li>Your account settings and preferences</li>
              <li>All associated data and backups</li>
            </ul>
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-6">
              This action cannot be undone. Please make sure you have exported any data you want to keep.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Delete My Account
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 