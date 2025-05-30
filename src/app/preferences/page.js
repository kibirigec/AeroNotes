"use client";

import { useState, useEffect, useRef } from 'react';
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
  const [hasMounted, setHasMounted] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Refs for uncontrolled components
  const desktopSelectRef = useRef(null);
  const mobileSelectRef = useRef(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Load user preferences
  useEffect(() => {
    if (user) {
      const settings = getAutoSignoutSettings();
      setAutoSignoutSettingsState(settings);
      setIsAutoSignoutEnabled(settings.enabled);
    }
  }, [user]);

  // Update refs when settings change
  useEffect(() => {
    if (hasMounted && desktopSelectRef.current && autoSignoutSettings) {
      desktopSelectRef.current.value = autoSignoutSettings.desktopTimeout;
    }
  }, [autoSignoutSettings?.desktopTimeout, hasMounted]);

  useEffect(() => {
    if (hasMounted && mobileSelectRef.current && autoSignoutSettings) {
      mobileSelectRef.current.value = autoSignoutSettings.mobileTimeout;
    }
  }, [autoSignoutSettings?.mobileTimeout, hasMounted]);

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
  const handleAutoSignoutChange = (newPartialSettings) => {
    // Current state (e.g., desktop: 15, mobile: 15)
    const currentSettings = autoSignoutSettings;

    // Desired state after this change (e.g., desktop: 20, mobile: 15)
    const intendedSettings = {
      ...(currentSettings || {}),
      ...newPartialSettings
    };

    setAutoSignoutSettingsState(intendedSettings); // Update UI state
    if (intendedSettings.enabled !== undefined) { // Keep this separate toggle state in sync
      setIsAutoSignoutEnabled(intendedSettings.enabled);
    }

    // Save to localStorage in the background
    const saveSettings = async () => {
      setIsSaving(true);
      try {
        if (newPartialSettings.enabled !== undefined) {
          setAutoSignoutEnabled(newPartialSettings.enabled);
        }

        if (newPartialSettings.desktopTimeout !== undefined || newPartialSettings.mobileTimeout !== undefined) {
          // Determine what to save for desktop:
          // Use the value from newPartialSettings if it exists, otherwise use the existing value from currentSettings.
          const desktopToSave = newPartialSettings.desktopTimeout !== undefined
            ? newPartialSettings.desktopTimeout
            : (currentSettings ? currentSettings.desktopTimeout : undefined);

          // Determine what to save for mobile:
          const mobileToSave = newPartialSettings.mobileTimeout !== undefined
            ? newPartialSettings.mobileTimeout
            : (currentSettings ? currentSettings.mobileTimeout : undefined);

          console.log("Attempting to save timeouts. Desktop:", desktopToSave, "Mobile:", mobileToSave);

          setAutoSignoutTimeouts(
            desktopToSave,
            mobileToSave
          );
        }

        // Show success message with animation
        setSaveMessage('Settings saved successfully!');
        console.log('Toast: Setting success message and starting animation');
        setIsToastVisible(false); // Ensure it starts hidden
        // Small delay to allow component to render in hidden state first
        setTimeout(() => {
          console.log('Toast: Making visible');
          setIsToastVisible(true);
        }, 10);
        // Hide after 2.5 seconds with slide-up animation
        setTimeout(() => {
          setIsToastVisible(false);
        }, 2500);
        // Clear message after slide-up animation completes
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } catch (error) {
        console.error('Error saving auto signout settings:', error);
        // Show error message with animation
        setSaveMessage('Error saving settings. Please try again.');
        setIsToastVisible(false); // Ensure it starts hidden
        // Small delay to allow component to render in hidden state first
        setTimeout(() => {
          setIsToastVisible(true);
        }, 10);
        // Hide after 2.5 seconds with slide-up animation
        setTimeout(() => {
          setIsToastVisible(false);
        }, 2500);
        // Clear message after slide-up animation completes
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
        
        // Revert local states on error by re-fetching from the source of truth
        const freshSettings = getAutoSignoutSettings();
        setAutoSignoutSettingsState(freshSettings);
        setIsAutoSignoutEnabled(freshSettings.enabled);
      } finally {
        setIsSaving(false);
      }
    };

    // Run save operation
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
        </div>
      </div>

      {/* Toast Notification */}
      {saveMessage && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center">
          <div className={`mt-4 mx-4 max-w-md w-full transform transition-all duration-500 ease-in-out ${
            isToastVisible 
              ? 'translate-y-0 opacity-100' 
              : '-translate-y-full opacity-0'
          }`}>
            <div className={`rounded-lg border shadow-lg p-4 ${
              saveMessage.includes('Error') 
                ? 'bg-red-100 dark:bg-red-800 border-red-300 dark:border-red-600' 
                : 'bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-600'
            }`}>
              <div className="flex items-start">
                <div className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                  saveMessage.includes('Error') 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {saveMessage.includes('Error') ? (
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-medium ${
                    saveMessage.includes('Error') 
                      ? 'text-red-800 dark:text-red-200' 
                      : 'text-green-800 dark:text-green-200'
                  }`}>
                    {saveMessage.includes('Error') ? 'Error' : 'Settings Updated'}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    saveMessage.includes('Error') 
                      ? 'text-red-700 dark:text-red-300' 
                      : 'text-green-700 dark:text-green-300'
                  }`}>
                    {saveMessage.includes('Error') 
                      ? 'There was a problem saving your settings. Please try again.' 
                      : 'Your auto signout preferences have been saved successfully.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Desktop Timeout</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Minutes before auto signout on desktop</p>
                      </div>
                      {hasMounted ? (
                        <select
                          ref={desktopSelectRef}
                          defaultValue={autoSignoutSettings.desktopTimeout || 20}
                          onChange={(e) => {
                            const newDesktop = parseInt(e.target.value);
                            console.log("Desktop timeout change", { 
                              from: autoSignoutSettings.desktopTimeout, 
                              to: newDesktop 
                            });
                            handleAutoSignoutChange({ desktopTimeout: newDesktop });
                          }}
                          disabled={isSaving}
                          className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                        >
                          <option value={5}>5 min</option>
                          <option value={10}>10 min</option>
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>1 hour</option>
                        </select>
                      ) : (
                        <div className="w-20 h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      )}
                    </div>

                    {/* Mobile Timeout */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Timeout</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Minutes before auto signout on mobile</p>
                      </div>
                      {hasMounted ? (
                        <select
                          ref={mobileSelectRef}
                          defaultValue={autoSignoutSettings.mobileTimeout || 10}
                          onChange={(e) => {
                            const newMobile = parseInt(e.target.value);
                            console.log("Mobile timeout change", { 
                              from: autoSignoutSettings.mobileTimeout, 
                              to: newMobile 
                            });
                            handleAutoSignoutChange({ mobileTimeout: newMobile });
                          }}
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
                      ) : (
                        <div className="w-20 h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      )}
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
                            The timer resets with any activity (typing, clicking, scrolling). You&apos;ll see a warning 60 seconds before auto signout.
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